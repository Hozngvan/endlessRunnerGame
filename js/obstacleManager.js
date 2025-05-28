import * as THREE from 'three';

export class ObstacleManager {
  constructor(scene, lanes) {
    this.scene = scene;
    this.lanes = lanes;
    this.objects = []; // Mảng chung cho cả obstacles và coins
    this.spawnDistance = -100;
    this.despawnDistance = 20;
    this.obstacleTypes = ['barrier', 'block', 'fence'];
    
    // Create some initial objects
    this.init();
  }
  
  init() {
    // Clear any existing objects
    this.reset();
    
    // Create initial objects
    for (let i = 0; i < 20; i++) {
      this.spawnRandomObstacle(-30 - i * 10);
      this.spawnCoin(-25 - i * 20);
    }
  }

  createObstacle(type, lane, z) {
    let obstacle;

    const loader = new THREE.TextureLoader();

    function createWheels() {
      const geometry = new THREE.BoxGeometry(2.1, 0.6, 1); 
      const material = new THREE.MeshLambertMaterial({color: 0x333333});
      const wheel = new THREE.Mesh(geometry, material); 
      return wheel;
    }

    if (type === 'barrier') {
      // Group obstacle
      obstacle = new THREE.Group();

      // Wheels
      const backWheel = createWheels(); 
      backWheel.position.y = -1; 
      backWheel.position.z = 1; 
      obstacle.add(backWheel);

      const frontWheel = createWheels(); 
      frontWheel.position.y = -1; 
      frontWheel.position.z = -1; 
      obstacle.add(frontWheel);

      // Main body car
      const main = new THREE.Mesh(
        new THREE.BoxGeometry(2, 0.8, 4),
        new THREE.MeshLambertMaterial({color: 0x78b14b})
      );
      main.position.y = -0.6; 
      obstacle.add(main);

      // Cabin 
      const cabin = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 0.8, 2.4),
        new THREE.MeshLambertMaterial({color: 0xffffff})
      );
      cabin.position.x = 0; 
      cabin.position.y = -0.2;
      cabin.position.z = -0.7;
      obstacle.add(cabin);

      // Biển số xe
      const bienso = new THREE.Mesh(
        new THREE.BoxGeometry(1, 0.4, 0.2),
        new THREE.MeshLambertMaterial({color: 0xffffff})
      );
      bienso.position.set(0, -0.7, 2);
      obstacle.add(bienso);

      // Đèn xe
      const light = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 32, 32),
        new THREE.MeshLambertMaterial({color: 0xaaaaaa})
      );

      light.position.set(-0.75, -0.7, 1.95);
      obstacle.add(light);

      const light2 = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 32, 32),
        new THREE.MeshLambertMaterial({color: 0xaaaaaa})
      );

      light2.position.set(0.75, -0.7, 1.95);
      obstacle.add(light2);

      // PointLights
      const pointLight = new THREE.PointLight(0xffff00, 1.7, 10);
      pointLight.position.copy(light.position);
      obstacle.add(pointLight);

      const pointLight2 = new THREE.PointLight(0xffff00, 1.7, 10);
      pointLight2.position.copy(light2.position);
      obstacle.add(pointLight2);
      
      // // Tạo hình nón ánh sáng giả lập
      // const coneGeometry = new THREE.ConeGeometry(1, 4, 32, 1, true); // bán kính, chiều cao
      // const coneMaterial = new THREE.MeshBasicMaterial({
      //   color: 0xffff00,
      //   transparent: true,
      //   opacity: 0.2,
      //   side: THREE.DoubleSide, // hiển thị cả mặt trong
      //   depthWrite: false // không ảnh hưởng bóng đổ
      // });
      // const lightCone = new THREE.Mesh(coneGeometry, coneMaterial);

      // // Đặt vị trí gốc giống spotLight
      // lightCone.position.copy(light.position);
      // lightCone.position.z = 4;

      // // Xoay hình nón hướng về phía trước (trục Z)
      // lightCone.rotation.x = -Math.PI / 2;

      // // Gắn vào obstacle hoặc scene
      // obstacle.add(lightCone);

      // const lightCone2 = lightCone.clone();
      // lightCone2.position.copy(light2.position);
      // lightCone2.position.z = 4;

      // obstacle.add(lightCone2);

      // Đặt vị trí
      obstacle.position.set(lane, 1.5, z);
      //obstacle.rotation.y = Math.PI / 2;
      obstacle.type = 'block';

    } else if (type === 'block') {
      const geometry = new THREE.BoxGeometry(3, 3, 1);
      const texture = loader.load('textures/concrete_diffuse.jpg');
      const normalMap = loader.load('textures/concrete_diffus.jpg');

      const material = new THREE.MeshStandardMaterial({
        //map: texture,
        //normalMap: normalMap,
        metalness: 0.2,
        roughness: 0.8,
      });

      obstacle = new THREE.Mesh(geometry, material);
      obstacle.position.set(lane, 1.5, z);
      obstacle.type = 'block';
      obstacle.castShadow = true;
      obstacle.receiveShadow = true;

    } else if (type === 'fence') {
      const geometry = new THREE.BoxGeometry(4, 1, 1);
      const material = new THREE.MeshStandardMaterial({
        color: 0x8B4513,
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

    obstacle.objectType = 'obstacle'; // Đánh dấu là obstacle
    this.scene.add(obstacle);
    this.objects.push(obstacle);
    return obstacle;
  }

  createCoin(lane, z) {
    const outerRadius = 0.5;
    const tubeRadius = 0.15;
    const radialSegments = 32;
    const tubularSegments = 64;

    const geometry = new THREE.TorusGeometry(outerRadius, tubeRadius, radialSegments, tubularSegments);
    const material = new THREE.MeshStandardMaterial({
      color: 0xFFD700,
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0x222200,
      emissiveIntensity: 0.2
    });

    const torus = new THREE.Mesh(geometry, material);
    torus.rotation.y = Math.PI / 2;

    // Cylinder - lõi đen tạo cảm giác đục
    const holeGeometry = new THREE.CylinderGeometry(0.6, 0.6 , 0.05, 32);
    const bitcoin = new THREE.TextureLoader().load('textures/img/bitcoin.jpg');
    const holeMaterial = new THREE.MeshStandardMaterial({ 
      //map: bitcoin,
      color: 0xFFD700,
      side: THREE.DoubleSide
    });

    const hole = new THREE.Mesh(holeGeometry, holeMaterial);
    hole.rotation.z = -Math.PI / 2;
    // hole.rotation.y = Math.PI / 2;

    // Tạo group đồng xu
    const coinGroup = new THREE.Group();
    coinGroup.add(torus);
    coinGroup.add(hole);

    // Đặt vị trí
    coinGroup.position.set(lane, 1.5, z);
    coinGroup.castShadow = true;
    coinGroup.receiveShadow = true;
    coinGroup.objectType = 'coin';

    this.scene.add(coinGroup);
    this.objects.push(coinGroup);

    return coinGroup;
  }

  spawnRandomObstacle(z = this.spawnDistance) {
    const minSpacing = 15; // Giảm từ 10 xuống 8 để dễ spawn hơn / khoảng cách tối thiểu giữa 2 obstacle cùng lane
    const minCoinSpacing = 3; // Giảm từ 5 xuống 3 / khoảng cách tối thiểu giữa obstacle và coin cùng lane
    const maxAttempts = 5; // Số lần thử sinh obstacle ở các lane ngẫu nhiên để không bị đè lên object khác.

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const laneIndex = Math.floor(Math.random() * this.lanes.length);
      const lane = this.lanes[laneIndex];

      const tooClose = this.objects.some(obj => {
        if (obj.position.x === lane) {
          const distance = Math.abs(obj.position.z - z);
          if (obj.objectType === 'obstacle' && distance < minSpacing) {
            return true;
          }
          if (obj.objectType === 'coin' && distance < minCoinSpacing) {
            return true;
          }
        }
        return false;
      });

      if (!tooClose) {
        const typeIndex = Math.floor(Math.random() * this.obstacleTypes.length);
        const type = this.obstacleTypes[typeIndex];
        this.createObstacle(type, lane, z);
        return true; // Spawn thành công
      }
    }

    return false; // Không thể spawn sau maxAttempts
  }
  
  spawnCoin(z = this.spawnDistance) {
    const minCoinSpacing = 5;
    const minObstacleSpacing = 3; // Giảm từ 5 xuống 3

    const closeCoin = this.objects.find(obj => 
      obj.objectType === 'coin' && 
      Math.abs(obj.position.z - z) < minCoinSpacing
    );
    if (closeCoin) {
      return false; // Bỏ qua spawn
    }

    let laneIndex;
    const possibleIndexes = this.lanes.map((_, idx) => idx).filter(idx => idx !== this.lastCoinLaneIndex);
    laneIndex = possibleIndexes[Math.floor(Math.random() * possibleIndexes.length)];

    this.lastCoinLaneIndex = laneIndex;
    const lane = this.lanes[laneIndex];

    const coinCount = Math.floor(Math.random() * 3) + 3; // Giảm từ 3-5 xuống 2-3 coins
    const spacing = 3; // Tăng từ 2.5 lên 3

    for (let i = 0; i < coinCount; i++) {
      const coinZ = z - i * spacing;
      const tooClose = this.objects.some(obj => {
        if (obj.position.x === lane) {
          const distance = Math.abs(obj.position.z - coinZ);
          if (obj.objectType === 'obstacle' && distance < minObstacleSpacing) {
            return true;
          }
          if (obj.objectType === 'coin' && distance < minCoinSpacing) {
            return true;
          }
        }
        return false;
      });

      if (tooClose) {
        return false;
      }
    }

    for (let i = 0; i < coinCount; i++) {
      const coinZ = z - i * spacing;
      this.createCoin(lane, coinZ);
    }
    return true; // Spawn thành công
  }
  
  update(delta, speed) {
    for (let i = this.objects.length - 1; i >= 0; i--) {
      const obj = this.objects[i];
      obj.position.z += speed * delta;

      // Xử lý riêng cho từng loại object
      if (obj.objectType === 'coin') {
        obj.rotation.y += 2 * delta; // Xoay coin
      }

      // Xóa object khi vượt quá despawnDistance
      if (obj.position.z > this.despawnDistance) {
        this.scene.remove(obj);
        this.objects.splice(i, 1);
        
        // Tạo lại object tương ứng
        if (obj.objectType === 'obstacle') {
          this.spawnRandomObstacle();
          if (Math.random() < 0.5) this.spawnRandomObstacle();
        } else if (obj.objectType === 'coin') {
          this.spawnCoin();
        }
      }
    }
  }
  
  checkCollision(playerPosition, isJumping) {
    const playerBoundingBox = new THREE.Box3().setFromCenterAndSize(
      playerPosition, 
      new THREE.Vector3(1, isJumping ? 1 : 2, 1)
    );

    for (const obj of this.objects) {
      if (obj.objectType !== 'obstacle' || obj.position.z < -1 || obj.position.z > 1) {
        continue;
      }

      const obstacleBoundingBox = new THREE.Box3().setFromObject(obj);
      const center = new THREE.Vector3();
      const size = new THREE.Vector3();
      obstacleBoundingBox.getCenter(center);
      obstacleBoundingBox.getSize(size);
      size.subScalar(0.5);
      obstacleBoundingBox.setFromCenterAndSize(center, size);

      if (playerBoundingBox.intersectsBox(obstacleBoundingBox)) {
        if (isJumping && obj.type === 'barrier') {
          continue;
        }
        return true;
      }
    }
    
    return false;
  }
  
  checkCoinCollision(playerPosition) {
    const playerBoundingBox = new THREE.Box3().setFromCenterAndSize(
      playerPosition,
      new THREE.Vector3(1, 2, 1)
    );
    
    const collectedCoins = [];
    
    for (let i = 0; i < this.objects.length; i++) {
      const obj = this.objects[i];
      
      if (obj.objectType !== 'coin' || obj.position.z < -1 || obj.position.z > 1) {
        continue;
      }

      const originalBox = new THREE.Box3().setFromObject(obj);
      const shrinkFactor = 0.4;
      const center = originalBox.getCenter(new THREE.Vector3());
      const size = originalBox.getSize(new THREE.Vector3()).multiplyScalar(shrinkFactor);
      const coinBoundingBox = new THREE.Box3().setFromCenterAndSize(center, size);
        
      if (playerBoundingBox.intersectsBox(coinBoundingBox)) {
        collectedCoins.push(i);
      }
    }
    
    for (let i = collectedCoins.length - 1; i >= 0; i--) {
      const coinIndex = collectedCoins[i];
      const coin = this.objects[coinIndex];
      this.scene.remove(coin);
      this.objects.splice(coinIndex, 1);
      this.spawnCoin();
    }
    
    return collectedCoins.length;
  }

  reset() {
    this.objects.forEach(obj => this.scene.remove(obj));
    this.objects = [];
    
    for (let i = 0; i < 20; i++) {
      this.spawnRandomObstacle(-30 - i * 10);
      this.spawnCoin(-25 - i * 20);
    }
  }
}