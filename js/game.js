import * as THREE from "three";
import { Player } from "./player.js";
import { World } from "./world.js";
import { ObstacleManager } from "./obstacleManager.js";
import { UI } from "./ui.js";

export class Game {
  constructor(container) {
    this.container = container;
    this.speed = 15;
    this.baseSpeed = 15;
    this.speedIncrement = 0.0005;
    this.score = 0;
    this.coinScore = 0;
    this.coinValue = 1;
    this.isGameOver = false;
    this.lanes = [-4, 0, 4];
    this.currentLane = 1;
    this.playerName = "";
    this.lastScoreUpdate = 0; // Theo dõi thời gian cập nhật điểm
    this.minScoreToUpdate = 0; // Điểm tối thiểu để cập nhật top 5

    // Setup scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);

    // Setup camera
    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 5, 10);
    this.camera.lookAt(0, 0, 0);

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
    window.addEventListener("resize", () => this.onWindowResize());

    // Fetch initial top scores
    this.fetchTopScores();
  }

  setupLighting() {
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

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);
  }

  updateCamera() {
    this.camera.position.x = this.player.position.x;
    this.camera.position.y = this.player.position.y + 1.5;
    this.camera.position.z = this.player.position.z;
    this.camera.lookAt(
      this.player.position.x,
      this.player.position.y + 1.5,
      -2
    );
  }

  setupControls() {
    document.addEventListener("keydown", (e) => {
      if (this.isGameOver) return;
      switch (e.key) {
        case "ArrowLeft":
          this.moveLeft();
          break;
        case "ArrowRight":
          this.moveRight();
          break;
        case "ArrowUp":
        case " ":
          this.player.jump();
          break;
      }
    });

    let startX = 0;
    this.container.addEventListener("touchstart", (e) => {
      startX = e.touches[0].clientX;
    });

    this.container.addEventListener("touchend", (e) => {
      if (this.isGameOver) return;
      const endX = e.changedTouches[0].clientX;
      const diffX = endX - startX;
      if (Math.abs(diffX) > 50) {
        if (diffX > 0) {
          this.moveRight();
        } else {
          this.moveLeft();
        }
      } else {
        this.player.jump();
      }
    });
  }

  async fetchTopScores() {
    try {
      const response = await fetch("http://localhost:3000/scores/top5");
      const topScores = await response.json();
      this.ui.updateTopScores(topScores);
      this.minScoreToUpdate = topScores.length
        ? Math.min(...topScores.map((s) => s.score))
        : 0;
    } catch (err) {
      console.error("Failed to fetch top scores:", err);
      this.ui.updateTopScores([]);
    }
  }

  async saveTempScore() {
    try {
      await fetch("http://localhost:3000/scores/temp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: this.playerName,
          score: Math.floor(this.score),
          coin: this.coinScore,
        }),
      });
      await this.fetchTopScores();
    } catch (err) {
      console.error("Failed to save temporary score:", err);
    }
  }

  async saveScore() {
    try {
      await fetch("http://localhost:3000/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: this.playerName,
          score: Math.floor(this.score),
          coin: this.coinScore,
        }),
      });
      await this.fetchTopScores();
    } catch (err) {
      console.error("Failed to save score:", err);
    }
  }

  start() {
    this.ui.showNameInput((name) => {
      this.playerName = name;
      this.isGameOver = false;
      this.score = 0;
      this.coinScore = 0;
      this.speed = this.baseSpeed;
      this.currentLane = 1;
      this.player.moveTo(this.lanes[this.currentLane]);
      this.lastScoreUpdate = 0;
      this.minScoreToUpdate = 0;
      this.ui.updateScore(this.score);
      this.ui.updateCoinScore(this.coinScore);
      this.ui.hideGameOver();
      this.fetchTopScores();
      this.animate();
    });
  }

  animate() {
    if (this.isGameOver) return;

    requestAnimationFrame(() => this.animate());

    const delta = 0.01;

    this.speed += this.speedIncrement;

    this.world.update(delta, this.speed);
    this.player.update(delta);
    this.obstacleManager.update(delta, this.speed);

    if (this.checkCollisions()) {
      this.gameOver();
      return;
    }

    const coinnumbers = this.checkCoinCollisions();
    this.score += this.speed * delta;
    this.ui.updateScore(Math.floor(this.score));
    this.ui.updateCoinScore(this.coinScore);

    // Cập nhật top 5 trong thời gian thực
    const currentTime = Date.now();
    if (
      this.score > this.minScoreToUpdate &&
      currentTime - this.lastScoreUpdate > 2000 // Cập nhật mỗi 2 giây
    ) {
      this.lastScoreUpdate = currentTime;
      this.saveTempScore();
    }

    // this.updateCamera();

    this.renderer.render(this.scene, this.camera);
  }

  checkCollisions() {
    return this.obstacleManager.checkCollision(
      this.player.position,
      this.player.isJumping
    );
  }

  checkCoinCollisions() {
    const coinsCollected = this.obstacleManager.checkCoinCollision(
      this.player.position
    );
    if (coinsCollected > 0) {
      this.coinScore += coinsCollected * this.coinValue;
    }
    return coinsCollected;
  }

  gameOver() {
    this.isGameOver = true;
    this.saveScore().then(() => {
      this.ui.showGameOver(
        Math.floor(this.score),
        this.coinScore,
        this.getTopScores()
      );
    });

    // Add event listener for restart button
    const restartButton = this.container.querySelector("#restartButton");
    if (restartButton) {
      restartButton.onclick = () => {
        this.resetGame();
      };
    }
  }

  async getTopScores() {
    try {
      const response = await fetch("http://localhost:3000/scores/top5");
      return await response.json();
    } catch (err) {
      console.error("Failed to fetch top scores:", err);
      return [];
    }
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
