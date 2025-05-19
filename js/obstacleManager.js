import * as THREE from 'three';

export class ObstacleManager {
  constructor(scene, lanes) {
    this.scene = scene;
    this.lanes = lanes;
    this.obstacles = [];
    this.coins = [];
    this.spawnDistance = -100;
    this.despawnDistance = 20;
    this.obstacleTypes = ['barrier', 'block', 'fence'];
    
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
    else if (type === 'fence') {
      // Fence: player jump will collide
      const geometry = new THREE.BoxGeometry(4, 0.5, 1);
      const material = new THREE.MeshStandardMaterial({
          color: 0x8B4513, // Brown color
          metalness: 0.1,
          roughness: 0.5,
          emissive: 0x000000,
          emissiveIntensity: 0.05
      });

      obstacle = new THREE.Mesh(geometry, material);
      obstacle.position.set(lane, 2, z);
      obstacle.type = 'fence';
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
    coin.rotation.y = Math.PI / 2;
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
    const closeCoin = this.coins.find(coin => Math.abs(coin.position.z - z) < 5);
    if (closeCoin) {
      return; // Đã có coin gần đó, không spawn thêm
    }

    let laneIndex;
    const possibleIndexes = this.lanes.map((_, idx) => idx).filter(idx => idx !== this.lastCoinLaneIndex);
    laneIndex = possibleIndexes[Math.floor(Math.random() * possibleIndexes.length)];

    this.lastCoinLaneIndex = laneIndex;
    const lane = this.lanes[laneIndex];

    const coinCount = Math.floor(Math.random() * 3) + 3; // 3 đến 5 coin
    const spacing = 2.5; // khoảng cách giữa mỗi coin trên trục Z

    for (let i = 0; i < coinCount; i++) {
      const coinZ = z - i * spacing;
      this.createCoin(lane, coinZ);
    }
  }
  
  update(delta, speed) {
    // Move obstacles
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obstacle = this.obstacles[i];
      obstacle.position.z += speed * delta;
      
      // // Rotate blocks slightly for visual interest
      // if (obstacle.type === 'block') {
      //   obstacle.rotation.y += delta;
      // }
      
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
      coin.rotation.y += 2 * delta; // Spin the coin
      
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
       
        // Tính center và size ban đầu của bounding box
        const center = new THREE.Vector3();
        const size = new THREE.Vector3();
        obstacleBoundingBox.getCenter(center);
        obstacleBoundingBox.getSize(size);

        // Trừ mỗi chiều 0.5 đơn vị
        size.subScalar(0.5);

        // Tạo bounding box mới với kích thước nhỏ hơn
        obstacleBoundingBox.setFromCenterAndSize(center, size);


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
  
  checkCoinCollision(playerPosition) {
    // Tạo bounding box cho người chơi
    const playerBoundingBox = new THREE.Box3().setFromCenterAndSize(
      playerPosition,
      new THREE.Vector3(1, 2, 1)
    );
    
    const collectedCoins = [];
    
    // Kiểm tra va chạm với từng đồng tiền
    for (let i = 0; i < this.coins.length; i++) {
      const coin = this.coins[i];
      
      // Chỉ kiểm tra các đồng tiền trong khoảng gần người chơi
      if (coin.position.z > -1 && coin.position.z < 1) {
        // const coinBoundingBox = new THREE.Box3().setFromObject(coin);
        const originalBox = new THREE.Box3().setFromObject(coin);
        const shrinkFactor = 0.4; // 60% size
        const center = originalBox.getCenter(new THREE.Vector3());
        const size = originalBox.getSize(new THREE.Vector3()).multiplyScalar(shrinkFactor);
        const coinBoundingBox = new THREE.Box3().setFromCenterAndSize(center, size);
        
        // Nếu có va chạm với đồng tiền
        if (playerBoundingBox.intersectsBox(coinBoundingBox)) {
          // Thêm đồng tiền vào danh sách đã thu thập
          // console.log('Collected coin---------------:', i);
          collectedCoins.push(i);
        }
      }
    }
    
    // Xóa các đồng tiền đã thu thập (từ cuối mảng lên để tránh lỗi index)
    for (let i = collectedCoins.length - 1; i >= 0; i--) {
      const coinIndex = collectedCoins[i];
      const coin = this.coins[coinIndex];
      
      // Xóa đồng tiền khỏi scene và mảng
      this.scene.remove(coin);
      this.coins.splice(coinIndex, 1);
      
      // Tạo đồng tiền mới để thay thế
      this.spawnCoin();
      
      // Đây là nơi bạn có thể thêm điểm, âm thanh hoặc hiệu ứng khi nhặt đồng tiền
    }
    // console.log('Collected coins:', collectedCoins);
    // Trả về số lượng đồng tiền đã thu thập
    return collectedCoins.length;
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