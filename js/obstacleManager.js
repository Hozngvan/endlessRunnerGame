import * as THREE from "three";

export class ObstacleManager {
  constructor(scene, lanes) {
    this.scene = scene;
    this.lanes = lanes;
    this.objects = []; // Mảng chung cho cả obstacles và coins
    this.coinPool = []; // Mảng lưu vàng
    this.spawnDistance = -100;
    this.despawnDistance = 20;
    this.obstacleTypes = ["barrier", "block", "fence"];
    this.obstacleCount = { barrier: 0, block: 0, fence: 0 };
    this.lastCoinLaneIndex = null;
    // Create some initial objects
    this.init();
  }

  init() {
    // Tạo sẵn 100 coin trong coinPool
    for (let i = 0; i < 100; i++) {
      const coin = this.createCoin(0, 0);
      coin.visible = false;
      this.coinPool.push(coin);
    }
    console.log(`Initialized coinPool with ${this.coinPool.length} coins`);

    // Clear any existing objects
    this.reset();

    // Create initial objects

  }

  spawnCoinsOverObstacle(obstacle) {
    const lane = obstacle.position.x;
    const baseZ = obstacle.position.z;

    const count = 5; // Số coin tạo hình vòng cung
    const spacing = 2.3; // Khoảng cách giữa các coin theo z
    const maxHeight = 2; // Chiều cao đỉnh

    const availableCoins = this.coinPool.filter((c) => !c.visible).length;
    if (availableCoins < count) {
      console.warn(`Not enough coins for spawnCoinsOverObstacle (need ${count}, available ${availableCoins})`);
      return;
    }

    for (let i = 0; i < count; i++) {
      const t = i / (count - 1); // 0 -> 1
      const zOffset = (t - 0.5) * (count - 1) * spacing; // z lệch trái - giữa - phải
      const height = -4 * (t - 0.5) ** 2 + 1; // Parabol: cao ở giữa
      const y = 1.2 + height * maxHeight; // nâng khỏi barrier một ít

      const coin = this.spawnCoinFromPool(lane, baseZ + zOffset, y);
      if (!coin) console.warn(`Không đủ coin trong coinPool tại lane=${lane}, z=${baseZ + zOffset}`);
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
      //   this.spawnCoinsOverObstacle(obstacle);
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
    this.scene.add(obstacle);
    this.objects.push(obstacle);
    this.obstacleCount[type]++;
    return obstacle;
  }

  createCoin(lane, z) {
    const outerRadius = 0.5;
    const tubeRadius = 0.15;
    const radialSegments = 16;
    const tubularSegments = 32;

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

    // Cylinder - lõi đen tạo cảm giác đục
    const holeGeometry = new THREE.CylinderGeometry(0.6, 0.6, 0.05, 32);
    //const bitcoin = new THREE.TextureLoader().load('textures/img/bitcoin.jpg');
    const holeMaterial = new THREE.MeshStandardMaterial({
      //map: bitcoin,
      color: 0xffd700,
      side: THREE.DoubleSide,
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
    coinGroup.objectType = "coin";

    this.scene.add(coinGroup);
    return coinGroup;
  }

  spawnCoinFromPool(lane, z, y = 1.5) {
    const coin = this.coinPool.find((c) => !c.visible);
    if (!coin) {
      console.warn(`Không đủ coin trong coinPool tại lane=${lane}, z=${z}. Active coins: ${this.coinPool.filter(c => c.visible).length}`);
      return null;
    }

    coin.position.set(lane, y, z);
    coin.rotation.y = 0;
    coin.visible = true;
    if (!this.objects.includes(coin)) {
      this.objects.push(coin);
    }
    console.log(`Spawn coin tại lane=${lane}, y=${y}, z=${z}, visible=${coin.visible}`);
    return coin;
  }

  spawnRandomObstacle(z = this.spawnDistance) {
    const minSpacing = 2;
    const minCoinSpacing = 1;
    const maxAttempts = 5;

    const blockCount = this.objects.filter(
      (obj) =>
        obj.objectType === "obstacle" &&
        obj.type === "block" &&
        Math.abs(obj.position.z - z) < minSpacing
    ).length;

    let availableTypes = [...this.obstacleTypes];
    if (blockCount >= 2) {
      availableTypes = availableTypes.filter((type) => type !== "block");
    }

    // Tìm loại obstacle có số lần xuất hiện ít nhất
    let minCount = Infinity;
    let selectedType = null;
    availableTypes.forEach((type) => {
      if (this.obstacleCount[type] < minCount) {
        minCount = this.obstacleCount[type];
        selectedType = type;
      }
    });

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const laneIndex = Math.floor(Math.random() * this.lanes.length);
      const lane = this.lanes[laneIndex];

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
        const obstacle = this.createObstacle(selectedType, lane, z);
        if (selectedType === "barrier" && Math.random() < 0.5) {
          this.spawnCoinsOverObstacle(obstacle);
        }
        return true;
      }
    }

    return false;
  }

  spawnCoin(z = this.spawnDistance) {
    const minCoinSpacing = 3;
    const minObstacleSpacing = 3; // Giảm từ 5 xuống 3

    const closeCoin = this.objects.find(
      (obj) =>
        obj.objectType === "coin" &&
        Math.abs(obj.position.z - z) < minCoinSpacing
    );
    if (closeCoin) {
      console.log(`Không spawn coin tại z=${z} vì quá gần coin khác`);
      return false;
    }

    let laneIndex;
    const possibleIndexes = this.lanes
      .map((_, idx) => idx)
      .filter((idx) => idx !== this.lastCoinLaneIndex);
    laneIndex =
      possibleIndexes[Math.floor(Math.random() * possibleIndexes.length)];

    this.lastCoinLaneIndex = laneIndex;
    const lane = this.lanes[laneIndex];

    const coinCount = Math.floor(Math.random() * 3) + 3; // Giảm từ 3-5 xuống 2-3 coins
    const spacing = 3; // Tăng từ 2.5 lên 3

    const availableCoins = this.coinPool.filter((c) => !c.visible).length;
    if (availableCoins < coinCount) {
      console.warn(`Not enough coins for spawnCoin (need ${coinCount}, available ${availableCoins})`);
      return false;
    }

    for (let i = 0; i < coinCount; i++) {
      const coinZ = z - i * spacing;
      const tooClose = this.objects.some((obj) => {
        if (obj.position.x === lane && obj.visible) {
          const distance = Math.abs(obj.position.z - coinZ);
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
        console.log(`Không spawn coin tại z=${coinZ} vì quá gần`);
        return false;
      }
    }

    for (let i = 0; i < coinCount; i++) {
      const coinZ = z - i * spacing;
      this.spawnCoinFromPool(lane, coinZ);
    }
    return true; // Spawn thành công
  }

  update(delta, speed) {
    const activeCoins = this.coinPool.filter((c) => c.visible).length;
    console.log(`Active coins: ${activeCoins}/${this.coinPool.length}`);

    for (let i = this.objects.length - 1; i >= 0; i--) {
      const obj = this.objects[i];
      if (!obj.visible) continue;

      obj.position.z += speed * delta;

      if (obj.objectType === "coin") {
        obj.rotation.y += 2 * delta;
      }

      if (obj.position.z > this.despawnDistance) {
        if (obj.objectType === "obstacle") {
          this.scene.remove(obj);
          const removedType = obj.type;
          this.objects.splice(i, 1);
          this.obstacleCount[removedType]--;
          this.spawnRandomObstacle();
          if (Math.random() < 0.5) this.spawnRandomObstacle();
        } else if (obj.objectType === "coin") {
          obj.visible = false;
          console.log(`Ẩn coin tại z=${obj.position.z}`);
          // this.spawnCoin();
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
      if (
        obj.objectType !== "obstacle" ||
        obj.position.z < -3 ||
        obj.position.z > 3
      ) {
        continue;
      }

      const obstacleBoundingBox = new THREE.Box3().setFromObject(obj);
      if (obj.type === "fence") {
        obstacleBoundingBox.min.y = 1.6;
      }
      // const center = new THREE.Vector3();
      // const size = new THREE.Vector3();
      // obstacleBoundingBox.getCenter(center);
      // obstacleBoundingBox.getSize(size);
      // //size.subScalar(0.5);
      // obstacleBoundingBox.setFromCenterAndSize(center, size);

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

    for (let i = 0; i < this.objects.length; i++) {
      const obj = this.objects[i];

      if (
        obj.objectType !== "coin" ||
        !obj.visible ||
        obj.position.z < -1 ||
        obj.position.z > 1
      ) {
        continue;
      }

      const originalBox = new THREE.Box3().setFromObject(obj);
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
      const coin = this.objects[coinIndex];
      coin.visible = false;
      console.log(`Thu thập coin tại z=${coin.position.z}`);
      this.spawnCoin();
    }

    return collectedCoins.length;
  }

  reset() {
    this.objects.forEach((obj) => {
      if (obj.objectType === "obstacle") {
        this.scene.remove(obj);
      } else {
        obj.visible = false;
      }
    });
    this.objects = this.coinPool.filter((coin) => coin.visible);
    this.obstacleCount = { barrier: 0, block: 0, fence: 0 };
    this.lastCoinLaneIndex = null;

    for (let i = 0; i < 5; i++) {
      this.spawnRandomObstacle(-25 - i * 30);
    }

    for (let i = 0; i < 50; i++) {
      this.spawnCoin(-25 - i * 30);
    }
  }
}