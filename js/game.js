import * as THREE from 'three';
import { Player } from './player.js';
import { World } from './world.js';
import { ObstacleManager } from './obstacleManager.js';
import { UI } from './ui.js';

export class Game {
  constructor(container) {
    this.container = container;
    this.speed = 15;
    this.baseSpeed = 15;
    this.speedIncrement = 0.0005;
    this.score = 0;
    this.coinScore = 0;
    this.isGameOver = false;
    this.lanes = [-4, 0, 4];
    this.currentLane = 1; // Middle lane

    // Setup scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb); // Sky blue
    
    // Setup camera
    this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
    //this.camera.position.set(0, 5, 10); // goc thu nhat
    this.camera.position.set(5, 10, 20); // goc thu ba 
    this.camera.lookAt(0, 3, 0);
    
    // Setup renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.container.appendChild(this.renderer.domElement);
    
    // Setup lighting
    this.setupLighting();
    
    // Initialize game components
    this.world = new World(this.scene);
    this.player = new Player(this.scene, this.lanes[this.currentLane]);
    this.obstacleManager = new ObstacleManager(this.scene, this.lanes);
    this.ui = new UI(this.container);
    
    // Setup controls
    this.setupControls();
    
    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize());
  }
  
  setupLighting() {
    // Main directional light (sun)
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(10, 10, 10);
    dirLight.castShadow = true;
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 100;
    dirLight.shadow.camera.right = 20;
    dirLight.shadow.camera.left = -20;
    dirLight.shadow.camera.top = 20;
    dirLight.shadow.camera.bottom = -20;
    this.scene.add(dirLight);
    
    // Ambient light for overall scene brightness
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);
  }
  
  updateCamera() {
    // Camera follows the player

    this.camera.position.x = this.player.position.x;
    this.camera.position.y = this.player.position.y + 1.5;
    this.camera.position.z = this.player.position.z;
    this.camera.lookAt(this.player.position.x, this.player.position.y + 1.5, -2);
  }

  setupControls() {
    document.addEventListener('keydown', (e) => {
      if (this.isGameOver) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          this.moveLeft();
          break;
        case 'ArrowRight':
          this.moveRight();
          break;
        case 'ArrowUp':
        case ' ':
          this.player.jump();
          break;
      }
    });
    
    // Mobile touch controls
    let startX = 0;
    this.container.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
    });
    
    this.container.addEventListener('touchend', (e) => {
      if (this.isGameOver) return;
      
      const endX = e.changedTouches[0].clientX;
      const diffX = endX - startX;
      
      if (Math.abs(diffX) > 50) { // Minimum swipe distance
        if (diffX > 0) {
          this.moveRight();
        } else {
          this.moveLeft();
        }
      } else {
        // Tap to jump
        this.player.jump();
      }
    });
  }
  
  moveLeft() {
    if (this.currentLane > 0) {
      this.currentLane--;
      this.player.moveTo(this.lanes[this.currentLane]);
    }
  }
  
  moveRight() {
    if (this.currentLane < this.lanes.length - 1) {
      this.currentLane++;
      this.player.moveTo(this.lanes[this.currentLane]);
    }
  }
  
  start() {
    this.isGameOver = false;
    this.score = 0;
    this.coinScore = 0;
    this.speed = this.baseSpeed;
    this.ui.updateScore(this.score);
    this.ui.hideGameOver();
    this.animate();
  }
  
  animate() {
    if (this.isGameOver) return;
    
    requestAnimationFrame(() => this.animate());
    
    const delta = 0.01; // Approximately 60fps
    
    // Update game speed based on score
    this.speed += this.speedIncrement;
    
    // Update game components
    this.world.update(delta, this.speed);
    this.player.update(delta);
    this.obstacleManager.update(delta, this.speed);
    
    // Check for collisions
    if (this.checkCollisions()) {
      this.gameOver();
      return;
    }
    
    const coinnumbers = this.checkCoinCollisions();

    // console.log(this.coinScore);
    // Update score (based on distance traveled)
    this.score += this.speed * delta;
    this.ui.updateScore(Math.floor(this.score + coinnumbers));
    
    //this.updateCamera();
    
    // Render the scene
    this.renderer.render(this.scene, this.camera);
  }
  
  checkCollisions() {
    return this.obstacleManager.checkCollision(
      this.player.position,
      this.player.isJumping
    );
  }
  
  checkCoinCollisions(){
    // Gọi hàm kiểm tra va chạm coin mà chúng ta đã thêm
    const coinsCollected = this.obstacleManager.checkCoinCollision(this.player.position);
    // console.log('Coins collected:', coinsCollected);
    
    if (coinsCollected > 0) {
      // Cộng điểm cho mỗi đồng tiền thu được
      this.coinScore += coinsCollected * this.coinValue;
      // console.log('Coins collected lớn hơn 0:', coinsCollected);
    }
    
    return coinsCollected;
  }
  gameOver() {
    this.isGameOver = true;
    this.ui.showGameOver(Math.floor(this.score + this.checkCoinCollisions));
    
    // Add event listener for restart
    const restartHandler = () => {
      document.removeEventListener('keydown', restartHandler);
      this.container.removeEventListener('click', restartHandler);
      this.resetGame();
    };
    
    document.addEventListener('keydown', restartHandler);
    this.container.addEventListener('click', restartHandler);
  }
  
  resetGame() {
    this.obstacleManager.reset();
    this.player.reset();
    this.world.reset();
    this.start();
  }
  
  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}