
import * as THREE from 'three';

export class ObstacleManager {
  constructor(scene, lanes) {
    this.scene = scene;
    this.lanes = lanes;
    this.obstacles = [];
    this.coins = [];
    this.spawnDistance = -100;
    this.despawnDistance = 20;
    this.obstacleTypes = ['barrier', 'block'];
    
    // Create some initial obstacles
    this.init();
  }
  
  init() {
    // Clear any existing obstacles
    this.reset();
    
    // Create initial obstacles
    for (let i = 0; i < 10; i++) {
      this.spawnRandomObstacle(-30 - i * 20);
      this.spawnCoin(-25 - i * 20);
    }
  }
  
  createObstacle(type, lane, z) {
    let obstacle;
    
    if (type === 'barrier') {
      // Barrier that can be jumped over
      const geometry = new THREE.BoxGeometry(3, 1, 0.5);
      const material = new THREE.MeshLambertMaterial({ color: 0xff0000 });
      obstacle = new THREE.Mesh(geometry, material);
      obstacle.position.set(lane, 0.5, z);
      obstacle.type = 'barrier';
      obstacle.castShadow = true;
    } else if (type === 'block') {
      // Block that must be avoided
      const geometry = new THREE.BoxGeometry(3, 3, 1);
      const material = new THREE.MeshLambertMaterial({ color: 0xffcc00 });
      obstacle = new THREE.Mesh(geometry, material);
      obstacle.position.set(lane, 1.5, z);
      obstacle.type = 'block';
      obstacle.castShadow = true;
    }
    
    this.scene.add(obstacle);
    this.obstacles.push(obstacle);
    return obstacle;
  }
  
  createCoin(lane, z) {
    const geometry = new THREE.TorusGeometry(0.5, 0.2, 8, 16);
    const material = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
    const coin = new THREE.Mesh(geometry, material);
    coin.position.set(lane, 1.5, z);
    coin.rotation.x = Math.PI / 2;
    coin.castShadow = true;
    
    this.scene.add(coin);
    this.coins.push(coin);
    return coin;
  }
  
  spawnRandomObstacle(z = this.spawnDistance) {
    const laneIndex = Math.floor(Math.random() * this.lanes.length);
    const lane = this.lanes[laneIndex];
    
    const typeIndex = Math.floor(Math.random() * this.obstacleTypes.length);
    const type = this.obstacleTypes[typeIndex];
    
    this.createObstacle(type, lane, z);
  }
  
  spawnCoin(z = this.spawnDistance) {
    const laneIndex = Math.floor(Math.random() * this.lanes.length);
    const lane = this.lanes[laneIndex];
    this.createCoin(lane, z);
  }
  
  update(delta, speed) {
    // Move obstacles
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obstacle = this.obstacles[i];
      obstacle.position.z += speed * delta;
      
      // Rotate blocks slightly for visual interest
      if (obstacle.type === 'block') {
        obstacle.rotation.y += delta;
      }
      
      // Remove obstacles that have passed the player
      if (obstacle.position.z > this.despawnDistance) {
        this.scene.remove(obstacle);
        this.obstacles.splice(i, 1);
        this.spawnRandomObstacle();
      }
    }
    
    // Move coins
    for (let i = this.coins.length - 1; i >= 0; i--) {
      const coin = this.coins[i];
      coin.position.z += speed * delta;
      coin.rotation.z += 2 * delta; // Spin the coin
      
      // Remove coins that have passed the player
      if (coin.position.z > this.despawnDistance) {
        this.scene.remove(coin);
        this.coins.splice(i, 1);
        this.spawnCoin();
      }
    }
  }
  
  checkCollision(playerPosition, isJumping) {
    const playerBoundingBox = new THREE.Box3().setFromCenterAndSize(
      playerPosition, 
      new THREE.Vector3(1, isJumping ? 1 : 2, 1)
    );
    
    // Check collision with obstacles
    for (const obstacle of this.obstacles) {
      if (obstacle.position.z > -1 && obstacle.position.z < 1) {
        const obstacleBoundingBox = new THREE.Box3().setFromObject(obstacle);
        
        if (playerBoundingBox.intersectsBox(obstacleBoundingBox)) {
          // If the player is jumping and the obstacle is a barrier, no collision
          if (isJumping && obstacle.type === 'barrier') {
            continue;
          }
          return true;
        }
      }
    }
    
    return false;
  }
  
  reset() {
    // Remove all existing obstacles and coins
    this.obstacles.forEach(obstacle => this.scene.remove(obstacle));
    this.coins.forEach(coin => this.scene.remove(coin));
    this.obstacles = [];
    this.coins = [];
    
    // Add new initial obstacles
    for (let i = 0; i < 10; i++) {
      this.spawnRandomObstacle(-30 - i * 20);
      this.spawnCoin(-25 - i * 20);
    }
  }
}