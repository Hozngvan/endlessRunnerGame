import * as THREE from "three";

export class ObstacleManager {
  constructor(scene, lanes) {
    this.scene = scene;
    this.lanes = lanes;
    this.objects = []; // Mảng chung cho cả obstacles và coins
    this.coinPool = []; // Pool để lưu trữ các coin tái sử dụng
    this.activeCoins = []; // Mảng lưu các coin đang hoạt động
    this.shoePool = []; // Pool cho item giày
    this.activeShoes = []; // Giày đang hoạt động
    this.obstaclePools = {
      barrier: [],
      block: [],
      fence: [],
    }; // Pool cho từng loại obstacle
    this.activeObstacles = []; // Obstacle đang hoạt động

    this.spawnDistance = -100;
    this.despawnDistance = 20;
    this.obstacleTypes = ["barrier", "block", "fence"];
    this.obstacleCount = { barrier: 0, block: 0, fence: 0 };

    this.maxCoinPoolSize = 50;
    this.maxShoePoolSize = 5;
    this.maxObstaclePoolSize = 10; 

    this.maxOccupiedLanes = 2;
    // Tạo pool ban đầu
    this.initPools();

    // Create some initial objects
    this.init();
  }

  initPools() {
    // Tạo pool cho coin
    for (let i = 0; i < this.maxCoinPoolSize; i++) {
      const coin = this.createCoin(0, 0);
      coin.visible = false;
      this.scene.remove(coin);
      this.coinPool.push(coin);
    }

    // Tạo pool cho giày
    for (let i = 0; i < this.maxShoePoolSize; i++) {
      const shoe = this.createShoe(0, 0);
      shoe.visible = false;
      this.scene.remove(shoe);
      this.shoePool.push(shoe);
    }

    // Tạo pool cho obstacle
    this.obstacleTypes.forEach((type) => {
      for (let i = 0; i < this.maxObstaclePoolSize; i++) {
        const obstacle = this.createObstacle(type, 0, 0);
        obstacle.visible = false;
        this.scene.remove(obstacle);
        this.obstaclePools[type].push(obstacle);
      }
    });
  }

  init() {
    this.reset();
  }

  createShoe(lane, z) {
    const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const material = new THREE.MeshStandardMaterial({
      color: 0x00ff00, // Màu xanh lá cho giày
      metalness: 0.3,
      roughness: 0.4,
    });
    const shoe = new THREE.Mesh(geometry, material);
    shoe.position.set(lane, 1.0, z);
    shoe.castShadow = true;
    shoe.receiveShadow = true;
    shoe.objectType = "shoe";

    return shoe;
  }

  getShoeFromPool() {
    if (this.shoePool.length === 0) {
      return null;
    }
    return this.shoePool.pop();
  }

  returnShoeToPool(shoe) {
    shoe.visible = false;
    this.scene.remove(shoe);
    this.shoePool.push(shoe);
  }

  spawnShoe(z = this.spawnDistance) {
    const minShoeSpacing = 10;
    const minObstacleSpacing = 10;
    const minCoinSpacing = 5;

    // Kiểm tra xem có giày nào quá gần không
    const closeShoe = this.activeShoes.find(
      (obj) => Math.abs(obj.position.z - z) < minShoeSpacing
    );
    if (closeShoe) {
      return false;
    }

    let laneIndex;
    const possibleIndexes = this.lanes
      .map((_, idx) => idx)
      .filter((idx) => idx !== this.lastShoeLaneIndex);
    laneIndex =
      possibleIndexes[Math.floor(Math.random() * possibleIndexes.length)];

    this.lastShoeLaneIndex = laneIndex;
    const lane = this.lanes[laneIndex];

    // Kiểm tra khoảng cách với obstacle và coin
    const tooClose = this.objects.some((obj) => {
      if (obj.position.x === lane) {
        const distance = Math.abs(obj.position.z - z);
        if (obj.objectType === "obstacle" && distance < minObstacleSpacing) {
          return true;
        }
        if (obj.objectType === "coin" && distance < minCoinSpacing) {
          return true;
        }
      }
      return false;
    });

    if (tooClose) {
      return false;
    }

    const shoe = this.getShoeFromPool();
    if (shoe) {
      shoe.position.set(lane, 1.0, z);
      shoe.visible = true;
      this.scene.add(shoe);
      this.activeShoes.push(shoe);
      this.objects.push(shoe);
      return true;
    }
    return false;
  }
  
  spawnCoinsOverObstacle(obstacle) {
    const lane = obstacle.position.x;
    const baseZ = obstacle.position.z;

    const count = 5;
    const spacing = 2.3;
    const maxHeight = 2;

    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const zOffset = (t - 0.5) * (count - 1) * spacing;
      const height = -4 * (t - 0.5) ** 2 + 1;
      const y = 1.2 + height * maxHeight;

      const coin = this.getCoinFromPool();
      if (coin) {
        coin.position.set(lane, y, baseZ + zOffset);
        coin.visible = true;
        this.scene.add(coin);
        this.activeCoins.push(coin);
        this.objects.push(coin);
      }
    }
  }

  createObstacle(type, lane, z) {
    let obstacle;

    const loader = new THREE.TextureLoader();

    function createWheels() {
      const geometry = new THREE.BoxGeometry(2.1, 0.6, 1);
      const material = new THREE.MeshLambertMaterial({ color: 0x333333 });
      const wheel = new THREE.Mesh(geometry, material);
      return wheel;
    }

    if (type === "barrier") {
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
        new THREE.MeshLambertMaterial({ color: 0x78b14b })
      );
      main.position.y = -0.6;
      obstacle.add(main);

      // Cabin
      const cabin = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 0.8, 2.4),
        new THREE.MeshLambertMaterial({ color: 0xffffff })
      );
      cabin.position.x = 0;
      cabin.position.y = -0.2;
      cabin.position.z = -0.7;
      obstacle.add(cabin);

      // Biển số xe
      const bienso = new THREE.Mesh(
        new THREE.BoxGeometry(1, 0.4, 0.2),
        new THREE.MeshLambertMaterial({ color: 0xffffff })
      );
      bienso.position.set(0, -0.7, 2);
      obstacle.add(bienso);

      // Đèn xe
      const light = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 32, 32),
        new THREE.MeshLambertMaterial({ color: 0xaaaaaa })
      );

      light.position.set(-0.75, -0.7, 1.95);
      obstacle.add(light);

      const light2 = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 32, 32),
        new THREE.MeshLambertMaterial({ color: 0xaaaaaa })
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
      // const coneGeometry = new THREE.ConeGeometry(0.8, 1, 32, 1, true); // bán kính, chiều cao
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
      // lightCone.position.z = 3;

      // // Xoay hình nón hướng về phía trước (trục Z)
      // lightCone.rotation.x = -Math.PI / 2;

      // // Gắn vào obstacle hoặc scene
      // obstacle.add(lightCone);

      // const lightCone2 = lightCone.clone();
      // lightCone2.position.copy(light2.position);
      // lightCone2.position.z = 3 ;

      // obstacle.add(lightCone2);

      // Đặt vị trí
      obstacle.position.set(lane, 1.5, z);
      //obstacle.rotation.y = Math.PI / 2;
      obstacle.type = "barrier";

      // if (Math.random() < 0.5) {
      // this.spawnCoinsOverObstacle(obstacle);
      // }

    } else if (type === "block") {
      // === 1. TẠO THÂN XE ===
      const busBody = new THREE.Mesh(
        new THREE.BoxGeometry(3, 3, 8),
        new THREE.MeshStandardMaterial({ color: 0xb22222 }) // màu đỏ đậm
      );
      busBody.position.y = 0.3; // nâng lên khỏi mặt đất

      // === 2. TẠO MÁI XE ===
      const busRoof = new THREE.Mesh(
        new THREE.BoxGeometry(2, 0.2, 6),
        new THREE.MeshStandardMaterial({ color: 0xff6666 }) // đỏ nhạt
      );
      busRoof.position.set(0, 1.8, 0);

      // === 3. CỬA SỔ ===
      const windows = [];
      for (let i = -3; i <= 3; i += 2) {
        const win = new THREE.Mesh(
          new THREE.BoxGeometry(0.05, 1, 1.4),
          new THREE.MeshStandardMaterial({ color: 0x000000 })
        );
        win.position.set(-1.5, 1, i); // bên phải xe
        windows.push(win);

        const win2 = new THREE.Mesh(
          new THREE.BoxGeometry(0.05, 1, 1.4),
          new THREE.MeshStandardMaterial({ color: 0x000000 })
        );
        win2.position.set(1.5, 1, i); // bên trái xe
        windows.push(win2);
      }

      // === 4. BÁNH XE ===
      function createWheel(x, z) {
        const wheel = new THREE.Mesh(
          new THREE.CylinderGeometry(0.5, 0.5, 0.5, 32),
          new THREE.MeshStandardMaterial({ color: 0x333333 })
        );
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(x, -1, z);
        return wheel;
      }
      const wheel1 = createWheel(-1.5, 2.7);
      const wheel2 = createWheel(1.5, 2.7);
      const wheel3 = createWheel(-1.5, -2.7);
      const wheel4 = createWheel(1.5, -2.7);

      // === 5. KÍNH XE ===
      const glass = new THREE.Mesh(
        new THREE.BoxGeometry(2.6, 1, 0.2),
        new THREE.MeshStandardMaterial({
          color: 0x666666, // Màu nhẹ xám hoặc xanh lam nhạt
          metalness: 0.25, // Kim loại thấp (kính không phải kim loại)
          roughness: 0.05, // Rất mịn để phản chiếu tốt
          transparent: true, // Cho phép trong suốt
          opacity: 0.8, // Mức độ trong suốt
          envMapIntensity: 1.0, // Cường độ phản chiếu môi trường (nếu dùng env map)
          side: THREE.DoubleSide, // Đảm bảo nhìn thấy cả 2 mặt kính
        })
      );
      glass.position.set(0, 1, 4);

      // === 6. ĐÈN XE ===
      const light = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 32, 32),
        new THREE.MeshStandardMaterial({ color: 0xffffff })
      );
      light.position.set(-0.9, -0.7, 4);

      const light2 = light.clone();
      light2.position.set(0.9, -0.7, 4);

      // PointLights
      const pointLight = new THREE.PointLight(0xffff00, 2, 10);
      pointLight.position.copy(light.position);
      pointLight.position.z = 4.2;

      const pointLight2 = new THREE.PointLight(0xffff00, 2, 10);
      pointLight2.position.copy(light2.position);
      pointLight2.position.z = 4.2;

      // === 7. VÀNH XE ===
      const vanh = new THREE.Mesh(
        new THREE.BoxGeometry(3.1, 0.6, 8.1),
        new THREE.MeshStandardMaterial({ color: 0xffffff })
      );
      vanh.position.set(0, 0.04, 0);

      // === 5. GỘP CÁC PHẦN ===
      obstacle = new THREE.Group();
      obstacle.add(
        busBody,
        busRoof,
        ...windows,
        wheel1,
        wheel2,
        wheel3,
        wheel4,
        glass,
        light,
        light2,
        pointLight,
        pointLight2,
        vanh
      );

      // Đặt vị trí
      obstacle.position.set(lane, 1.5, z);
      //obstacle.rotation.y = Math.PI / 2;
      obstacle.type = "block";
    } else if (type === "fence") {
      obstacle = new THREE.Group();

      //const texture = new THREE.TextureLoader().load('textures/imgepsi.jpg');
      // Rào chán trên
      const geometry = new THREE.BoxGeometry(3.6, 2, 0.4);
      const material = new THREE.MeshStandardMaterial({
        //map: texture,
        color: 0x0000aa,
        metalness: 0.1,
        roughness: 0.5,
        emissive: 0x000000,
        emissiveIntensity: 0.05,
      });

      const fence = new THREE.Mesh(geometry, material);
      fence.position.set(0, 1.5, 0);
      obstacle.add(fence);

      // 2 cột 2 bên
      const geometry2 = new THREE.BoxGeometry(0.2, 2, 0.2);
      const material2 = new THREE.MeshStandardMaterial({
        color: 0x000000,
      });

      const column1 = new THREE.Mesh(geometry2, material2);
      column1.position.set(-1.65, 0, 0);
      obstacle.add(column1);

      const column2 = column1.clone();
      column2.position.set(1.65, 0, 0);
      obstacle.add(column2);

      obstacle.position.set(lane, 1.5, z);
      obstacle.type = "fence";
    }

    obstacle.objectType = "obstacle"; // Đánh dấu là obstacle
    // this.scene.add(obstacle);
    // this.objects.push(obstacle);
    // this.obstacleCount[type]++;
    return obstacle;
  }

  createCoin(lane, z) {
    const outerRadius = 0.5;
    const tubeRadius = 0.15;
    const radialSegments = 32;
    const tubularSegments = 64;

    const geometry = new THREE.TorusGeometry(
      outerRadius,
      tubeRadius,
      radialSegments,
      tubularSegments
    );
    const material = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0x222200,
      emissiveIntensity: 0.2,
    });

    const torus = new THREE.Mesh(geometry, material);
    torus.rotation.y = Math.PI / 2;

    const holeGeometry = new THREE.CylinderGeometry(0.6, 0.6, 0.05, 32);
    const holeMaterial = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      side: THREE.DoubleSide,
    });

    const hole = new THREE.Mesh(holeGeometry, holeMaterial);
    hole.rotation.z = -Math.PI / 2;

    const coinGroup = new THREE.Group();
    coinGroup.add(torus);
    coinGroup.add(hole);

    coinGroup.position.set(lane, 1.5, z);
    coinGroup.castShadow = true;
    coinGroup.receiveShadow = true;
    coinGroup.objectType = "coin";

    return coinGroup;
  }

  getCoinFromPool() {
    if (this.coinPool.length === 0) {
      return null; // Không còn coin trong pool
    }
    return this.coinPool.pop(); // Lấy coin từ pool
  }

  returnCoinToPool(coin) {
    coin.visible = false;
    this.scene.remove(coin);
    this.coinPool.push(coin); // Đưa coin trở lại pool
  }

  getObstacleFromPool(type) {
    if (this.obstaclePools[type].length === 0) {
      return null;
    }
    return this.obstaclePools[type].pop();
  }

  returnObstacleToPool(obstacle) {
    obstacle.visible = false;
    this.scene.remove(obstacle);
    this.obstaclePools[obstacle.type].push(obstacle);
  }

  spawnRandomObstacle(z = this.spawnDistance) {
    const minSpacing = 30;
    const minCoinSpacing = 5;
    const maxAttempts = 5;

    // Đếm số lane đang có obstacle gần vị trí z
    const occupiedLanes = new Set(
      this.activeObstacles
        .filter((obj) => Math.abs(obj.position.z - z) < minSpacing)
        .map((obj) => obj.position.x)
    );

    if (occupiedLanes.size >= this.maxOccupiedLanes) {
      return false; // Không spawn nếu đã có đủ lane bị chiếm
    }

    const blockCount = this.activeObstacles.filter(
      (obj) => obj.type === "block" && Math.abs(obj.position.z - z) < 1
    ).length;

    let availableTypes = [...this.obstacleTypes];
    if (blockCount >= 2) {
      availableTypes = availableTypes.filter((type) => type !== "block");
    }

    let minCount = Infinity;
    let selectedType = null;
    availableTypes.forEach((type) => {
      if (this.obstacleCount[type] < minCount) {
        minCount = this.obstacleCount[type];
        selectedType = type;
      }
    });

    // Chỉ chọn các lane chưa bị chiếm
    const availableLanes = this.lanes.filter(
      (lane) => !occupiedLanes.has(lane)
    );

    if (availableLanes.length === 0) {
      return false; // Không còn lane trống để spawn
    }

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const laneIndex = Math.floor(Math.random() * availableLanes.length);
      const lane = availableLanes[laneIndex];

      const tooClose = this.objects.some((obj) => {
        if (obj.position.x === lane) {
          const distance = Math.abs(obj.position.z - z);
          if (obj.objectType === "obstacle" && distance < minSpacing) {
            return true;
          }
          if (obj.objectType === "coin" && distance < minCoinSpacing) {
            return true;
          }
        }
        return false;
      });

      if (!tooClose) {
        const obstacle = this.getObstacleFromPool(selectedType);
        if (obstacle) {
          obstacle.position.set(lane, 1.5, z);
          obstacle.visible = true;
          this.scene.add(obstacle);
          this.activeObstacles.push(obstacle);
          this.objects.push(obstacle);
          this.obstacleCount[selectedType]++;
          return true;
        }
      }
    }

    return false;
  }

  spawnCoin(z = this.spawnDistance) {
    const minCoinSpacing = 5;
    const minObstacleSpacing = 5;

    const closeCoin = this.activeCoins.find(
      (obj) => Math.abs(obj.position.z - z) < minCoinSpacing
    );
    if (closeCoin) {
      return false; // Bỏ qua spawn
    }

    let laneIndex;
    const possibleIndexes = this.lanes
      .map((_, idx) => idx)
      .filter((idx) => idx !== this.lastCoinLaneIndex);
    laneIndex =
      possibleIndexes[Math.floor(Math.random() * possibleIndexes.length)];

    this.lastCoinLaneIndex = laneIndex;
    const lane = this.lanes[laneIndex];

    const coinCount = Math.floor(Math.random() * 3) + 3; // 2-3 coins
    const spacing = 3;

    for (let i = 0; i < coinCount; i++) {
      const coinZ = z - i * spacing;
      const tooClose = this.objects.some((obj) => {
        if (obj.position.x === lane) {
          const distance = Math.abs(obj.position.z - coinZ);
          if (obj.objectType === "obstacle" && distance < minObstacleSpacing) {
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
      const coin = this.getCoinFromPool();
      if (coin) {
        coin.position.set(lane, 1.5, coinZ);
        coin.visible = true;
        this.scene.add(coin);
        this.activeCoins.push(coin);
        this.objects.push(coin);
      }
    }
    return true; // Spawn thành công
  }

  update(delta, speed) {
    for (let i = this.activeCoins.length - 1; i >= 0; i--) {
      const coin = this.activeCoins[i];
      coin.position.z += speed * delta;
      coin.rotation.y += 2 * delta;

      if (coin.position.z > this.despawnDistance) {
        this.returnCoinToPool(coin);
        this.activeCoins.splice(i, 1);
        const index = this.objects.indexOf(coin);
        if (index !== -1) this.objects.splice(index, 1);
        this.spawnCoin();
      }
    }

    for (let i = this.activeShoes.length - 1; i >= 0; i--) {
      const shoe = this.activeShoes[i];
      shoe.position.z += speed * delta;
      shoe.rotation.y += 2 * delta; // Xoay giày để dễ nhìn

      if (shoe.position.z > this.despawnDistance) {
        this.returnShoeToPool(shoe);
        this.activeShoes.splice(i, 1);
        const index = this.objects.indexOf(shoe);
        if (index !== -1) this.objects.splice(index, 1);
        this.spawnShoe();
      }
    }

    for (let i = this.activeObstacles.length - 1; i >= 0; i--) {
      const obstacle = this.activeObstacles[i];
      obstacle.position.z += speed * delta;

      if (obstacle.position.z > this.despawnDistance) {
        this.obstacleCount[obstacle.type]--;
        this.returnObstacleToPool(obstacle);
        this.activeObstacles.splice(i, 1);
        const index = this.objects.indexOf(obstacle);
        if (index !== -1) this.objects.splice(index, 1);
        this.spawnRandomObstacle();
      }
    }
  }

  checkCollision(playerPosition, isJumping) {
    const playerBoundingBox = new THREE.Box3().setFromCenterAndSize(
      playerPosition,
      new THREE.Vector3(1, isJumping ? 1 : 2, 1)
    );

    for (const obj of this.activeObstacles) {
      if (obj.position.z < -3 || obj.position.z > 3) {
        continue;
      }

      const obstacleBoundingBox = new THREE.Box3().setFromObject(obj);
      if (obj.type === "fence") {
        obstacleBoundingBox.min.y = 1.6;
      }

      if (playerBoundingBox.intersectsBox(obstacleBoundingBox)) {
        if (isJumping && obj.type === "barrier") {
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

    for (let i = 0; i < this.activeCoins.length; i++) {
      const coin = this.activeCoins[i];

      if (coin.position.z < -1 || coin.position.z > 1) {
        continue;
      }

      const originalBox = new THREE.Box3().setFromObject(coin);
      const shrinkFactor = 0.4;
      const center = originalBox.getCenter(new THREE.Vector3());
      const size = originalBox
        .getSize(new THREE.Vector3())
        .multiplyScalar(shrinkFactor);
      const coinBoundingBox = new THREE.Box3().setFromCenterAndSize(
        center,
        size
      );

      if (playerBoundingBox.intersectsBox(coinBoundingBox)) {
        collectedCoins.push(i);
      }
    }

    for (let i = collectedCoins.length - 1; i >= 0; i--) {
      const coinIndex = collectedCoins[i];
      const coin = this.activeCoins[coinIndex];
      this.returnCoinToPool(coin);
      this.activeCoins.splice(coinIndex, 1);
      const objIndex = this.objects.indexOf(coin);
      if (objIndex !== -1) this.objects.splice(objIndex, 1);
    }

    return collectedCoins.length;
  }

  checkShoeCollision(playerPosition) {
    const playerBoundingBox = new THREE.Box3().setFromCenterAndSize(
      playerPosition,
      new THREE.Vector3(1, 2, 1)
    );

    const collectedShoes = [];

    for (let i = 0; i < this.activeShoes.length; i++) {
      const shoe = this.activeShoes[i];

      if (shoe.position.z < -1 || shoe.position.z > 1) {
        continue;
      }

      const originalBox = new THREE.Box3().setFromObject(shoe);
      const shrinkFactor = 0.4;
      const center = originalBox.getCenter(new THREE.Vector3());
      const size = originalBox
        .getSize(new THREE.Vector3())
        .multiplyScalar(shrinkFactor);
      const shoeBoundingBox = new THREE.Box3().setFromCenterAndSize(
        center,
        size
      );

      if (playerBoundingBox.intersectsBox(shoeBoundingBox)) {
        collectedShoes.push(i);
      }
    }

    for (let i = collectedShoes.length - 1; i >= 0; i--) {
      const shoeIndex = collectedShoes[i];
      const shoe = this.activeShoes[shoeIndex];
      this.returnShoeToPool(shoe);
      this.activeShoes.splice(shoeIndex, 1);
      const objIndex = this.objects.indexOf(shoe);
      if (objIndex !== -1) this.objects.splice(objIndex, 1);
      this.spawnShoe();
    }

    return collectedShoes.length;
  }

  reset() {
    // Đưa coin về pool
    while (this.activeCoins.length > 0) {
      const coin = this.activeCoins.pop();
      this.returnCoinToPool(coin);
      const index = this.objects.indexOf(coin);
      if (index !== -1) this.objects.splice(index, 1);
    }

    // Đưa giày về pool
    while (this.activeShoes.length > 0) {
      const shoe = this.activeShoes.pop();
      this.returnShoeToPool(shoe);
      const index = this.objects.indexOf(shoe);
      if (index !== -1) this.objects.splice(index, 1);
    }

    // Đưa obstacle về pool
    while (this.activeObstacles.length > 0) {
      const obstacle = this.activeObstacles.pop();
      this.obstacleCount[obstacle.type]--;
      this.returnObstacleToPool(obstacle);
      const index = this.objects.indexOf(obstacle);
      if (index !== -1) this.objects.splice(index, 1);
    }

    this.objects = [];
    this.obstacleCount = { barrier: 0, block: 0, fence: 0 };

    // Tạo lại các object ban đầu
    for (let i = 0; i < 10; i++) {
      // this.spawnRandomObstacle(-30 - i * 10);
      // this.spawnCoin(-15 - i * 10);
    }

    for (let i = 0; i < 20; i++) {
      // this.spawnCoin(-15 - i * 10);
    }

    for (let i = 0; i < 1; i++) {
      // if (Math.random() < 0.2) {
      this.spawnShoe(-15 - i * 10);
      // }
    }
  }
}