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

    const loader = new THREE.TextureLoader();

    if (type === 'barrier') {
      // Tập hợp màu cảnh báo
      const warningColors = [0xff0000, 0xffa500, 0xffff00, 0xffffff];
      const color = warningColors[Math.floor(Math.random() * warningColors.length)];
  
      const geometry = new THREE.BoxGeometry(3, 1, 0.5);
  
      const material = new THREE.MeshStandardMaterial({
          color: color,
          metalness: 0.3,
          roughness: 0.5,
          emissive: 0x000000,
          emissiveIntensity: 0.05
      });
  
      obstacle = new THREE.Mesh(geometry, material);
      obstacle.position.set(lane, 0.5, z);
      obstacle.type = 'barrier';
      obstacle.castShadow = true;
      obstacle.receiveShadow = true;
  
      // Optional: nghiêng nhẹ để trông tự nhiên hơn
      obstacle.rotation.y = (Math.random() - 0.5) * 0.1;

    } else if (type === 'block') {
        // Block: concrete-like large block
        const geometry = new THREE.BoxGeometry(3, 3, 1);
        const texture = loader.load('textures/concrete_diffuse.jpg');
        const normalMap = loader.load('textures/concrete_diffus.jpg');

        const material = new THREE.MeshStandardMaterial({
            map: texture,
            normalMap: normalMap,
            metalness: 0.2,
            roughness: 0.8,
        });

        obstacle = new THREE.Mesh(geometry, material);
        obstacle.position.set(lane, 1.5, z);
        obstacle.type = 'block';
        obstacle.castShadow = true;
        obstacle.receiveShadow = true;
    }

    this.scene.add(obstacle);
    this.obstacles.push(obstacle);
    return obstacle;
  }

  createCoin(lane, z) {
    const outerRadius = 0.5;
    const tubeRadius = 0.15;
    const radialSegments = 32;
    const tubularSegments = 64;

    // Create a smoother torus
    const geometry = new THREE.TorusGeometry(outerRadius, tubeRadius, radialSegments, tubularSegments);

    // Use a shiny gold material
    const material = new THREE.MeshStandardMaterial({
        color: 0xFFD700,
        metalness: 0.8,
        roughness: 0.2,
        emissive: 0x222200,
        emissiveIntensity: 0.2
    });

    const coin = new THREE.Mesh(geometry, material);
    coin.position.set(lane, 1.5, z);
    coin.rotation.x = Math.PI / 2;
    coin.castShadow = true;
    coin.receiveShadow = true;

    // Optional: add a glowing outline using a sprite or subtle bloom later

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