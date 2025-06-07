import * as THREE from "three";
import { Sky } from "three/examples/jsm/objects/sky.js";

export class World {
  constructor(scene) {
    this.scene = scene;
    this.roadLength = 50;
    this.roadWidth = 15;

    this.createGround();
    this.createSkyBox();
    //this.hideDaySkyBox();
    this.createNightSkyBox();
    this.hideNightSkyBox();
    this.createRoadSegments();
    this.createBuildings();
  }

  createGround() {
    // Ground plane
    const groundGeometry = new THREE.PlaneGeometry(100, 300);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x7caf71 });
    this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.y = -0.1;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);
  }

  createSkyBox() {
    this.sky = new Sky();
    this.sky.scale.setScalar(4500);
    this.scene.add(this.sky);

    const skyUniforms = this.sky.material.uniforms;
    skyUniforms["turbidity"].value = 10;
    skyUniforms["rayleigh"].value = 0.5;
    skyUniforms["mieCoefficient"].value = 0.005;
    skyUniforms["mieDirectionalG"].value = 0.8;

    // Vị trí mặt trời (ánh sáng)
    const sun = new THREE.Vector3();
    const theta = Math.PI * 0.49; // cao
    const phi = 2 * Math.PI * 0.25; // góc quay
    sun.x = Math.cos(phi) * Math.sin(theta);
    sun.y = Math.cos(theta);
    sun.z = Math.sin(phi) * Math.sin(theta);
    this.sky.material.uniforms["sunPosition"].value.copy(sun);

    // Optional: dùng thêm ánh sáng mặt trời (DirectionalLight)
    this.sunlight = new THREE.DirectionalLight(0xffffff, 1);
    this.sunlight.position.copy(sun);
    this.scene.add(this.sunlight);

    // Tạo sương mù
    const verticalFog = new THREE.Fog(0xaaaaaa, 50, 80);
    this.scene.fog = verticalFog;
  }

  showDaySkyBox() {
    if (this.sky) this.sky.visible = true;
    if (this.sunlight) this.sunlight.visible = true;
  }

  hideDaySkyBox() {
    if (this.sky) this.sky.visible = false;
    if (this.sunlight) this.sunlight.visible = false;
  }

  showNightSkyBox() {
    if (this.nightSky) this.nightSky.visible = true;
    if (this.moon) this.moon.visible = true;
    if (this.moonLight) this.moonLight.visible = true;
    if (this.moonPointLight) this.moonPointLight.visible = true;
  }

  hideNightSkyBox() {
    if (this.skySphere) this.skySphere.visible = false;
    if (this.moon) this.moon.visible = false;
    if (this.moonLight) this.moonLight.visible = false;
    if (this.moonPointLight) this.moonPointLight.visible = false;
  }

  createNightSkyBox() {
    // Bầu trời sao - sky sphere
    const skyGeometry = new THREE.SphereGeometry(500, 128, 128);
    const skyMaterial = new THREE.MeshBasicMaterial({
      map: new THREE.TextureLoader().load('textures/star_sky.jpg'), // texture bầu trời sao
      //side: THREE.BackSide,
    });
    this.skySphere = new THREE.Mesh(skyGeometry, skyMaterial);
    this.scene.add(this.skySphere);

    // Mặt trăng
    const moonTexture = new THREE.TextureLoader().load('textures/moon.jpg');
    const moonMaterial = new THREE.MeshStandardMaterial({
      map: moonTexture,
      emissive: 0x222222,
      emissiveIntensity: 0.5,
    });
    this.moon = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 32), moonMaterial);
    this.moon.position.set(0, 10, -50);
    this.scene.add(this.moon);

    // ánh sáng điểm mặt trăng
    this.moonPointLight = new THREE.PointLight(0xaaaaee, 1.7, 10);
    this.moonPointLight.position.copy(this.moon.position);
    this.scene.add(this.moonPointLight);

    // Ánh sáng từ mặt trăng
    this.moonLight = new THREE.DirectionalLight(0xaaaaee, 0.8);
    this.moonLight.position.set(-10, 10, -50);
    this.scene.add(this.moonLight);

    // Tạo sương mù
    const verticalFog = new THREE.Fog(0xffffff, 50, 80);
    this.scene.fog = verticalFog;
  }

  createRoadSegments() {
    this.roadSegments = [];
    const loader = new THREE.TextureLoader();

    // Create the road
    const roadGeometry = new THREE.PlaneGeometry(
      this.roadWidth,
      this.roadLength
    );
    const texture = loader.load("textures/img/matduong.jpg");
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(this.roadWidth / 10, this.roadLength / 10); // tuỳ chỉnh mật độ lặp

    const roadMaterial = new THREE.MeshLambertMaterial({
      map: texture,
      transparent: true,
    });

    // Create multiple road segments that will move toward the player
    for (let i = 0; i < 3; i++) {
      const road = new THREE.Mesh(roadGeometry, roadMaterial);
      road.rotation.x = -Math.PI / 2;
      road.position.z = -i * this.roadLength;
      road.receiveShadow = true;
      this.scene.add(road);
      this.roadSegments.push(road);
    }

    // Add lane divider lines
    this.laneLines = [];
    const lineGeometry = new THREE.PlaneGeometry(0.3, this.roadLength);
    const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

    for (let i = 0; i < 3; i++) {
      for (let lanePos of [-2, 2]) {
        const line = new THREE.Mesh(lineGeometry, lineMaterial);
        line.rotation.x = -Math.PI / 2;
        line.position.set(lanePos, 0.01, -i * this.roadLength);
        this.scene.add(line);
        this.laneLines.push({ mesh: line, baseZ: -i * this.roadLength });
      }
    }

    // Add cross lines
    this.crosswalkLines = [];
    const crossLineWidth = this.roadWidth / 10;
    const crossLineGeometry = new THREE.PlaneGeometry(crossLineWidth * 0.6, 5);
    const crossLineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const segmentEndZ = this.roadLength - 5;
    for (let j = 0; j < 10; j++) {
      const x = -this.roadWidth / 2 + j * crossLineWidth + crossLineWidth / 2;
      const line = new THREE.Mesh(crossLineGeometry, crossLineMaterial);
      line.rotation.x = -Math.PI / 2;
      line.position.set(x, 0.02, 0);
      this.scene.add(line);
      this.crosswalkLines.push({ mesh: line, baseZ: segmentEndZ });
    }

    // Add traffic lights
    this.trafficLights = [];
    const poleHeight = 5;
    const poleRadius = 0.1;
    const horizontalLength = 2;
    const lightBoxSize = { width: 1.6, height: 0.6, depth: 0.3 };
    const lightRadius = 0.15;

    const redMaterial = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
    });
    const yellowMaterial = new THREE.MeshStandardMaterial({
      color: 0xffff00,
      emissive: 0xffff00,
    });
    const greenMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ff00,
      emissive: 0x00ff00,
    });

    const x = this.roadWidth / 2 + 0.2;

    //const trafficLightGroup = new THREE.Group();

    // Trụ đứng
    const tru = new THREE.Mesh(
      new THREE.CylinderGeometry(poleRadius, poleRadius, poleHeight, 32),
      new THREE.MeshLambertMaterial({ color: 0x828282 })
    );
    tru.position.set(x, poleHeight / 2, 3);
    this.scene.add(tru);
    this.trafficLights.push({ mesh: tru, baseZ: segmentEndZ });

    // Trụ ngang
    const horizontal = new THREE.Mesh(
      new THREE.BoxGeometry(horizontalLength, poleRadius, poleRadius),
      new THREE.MeshLambertMaterial({ color: 0x828282 })
    );
    horizontal.position.set(x - 1, poleHeight - 0.5, 3);
    this.scene.add(horizontal);
    this.trafficLights.push({ mesh: horizontal, baseZ: segmentEndZ });

    // Hộp đèn
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(
        lightBoxSize.width,
        lightBoxSize.height,
        lightBoxSize.depth
      ),
      new THREE.MeshLambertMaterial({ color: 0x828282 })
    );
    box.position.set(x - 2, poleHeight - 0.5, 3);
    this.scene.add(box);
    this.trafficLights.push({ mesh: box, baseZ: segmentEndZ });

    // 3 đèn đỏ vàng xanh
    const redLight = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 32, 32),
      new THREE.MeshLambertMaterial({ color: 0xff0000 })
    );
    redLight.position.set(x - 2.5, poleHeight - 0.5, 3);
    this.scene.add(redLight);
    this.trafficLights.push({ mesh: redLight, baseZ: segmentEndZ });

    const yellowLight = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 32, 32),
      new THREE.MeshLambertMaterial({ color: 0xffff00 })
    );
    yellowLight.position.set(x - 2, poleHeight - 0.5, 3);
    this.scene.add(yellowLight);
    this.trafficLights.push({ mesh: yellowLight, baseZ: segmentEndZ });

    const greenLight = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 32, 32),
      new THREE.MeshLambertMaterial({ color: 0x00ff00 })
    );
    greenLight.position.set(x - 1.5, poleHeight - 0.5, 3);
    this.scene.add(greenLight);
    this.trafficLights.push({ mesh: greenLight, baseZ: segmentEndZ });

    // Add sidelines
    this.longSidelines = [];
    const gach = loader.load("textures/img/gach.jpg");
    const longSideGeometry = new THREE.BoxGeometry(0.3, 0.3, 2.5); // mỗi đoạn dài 2 đơn vị
    const longSideMaterial = new THREE.MeshBasicMaterial({
      //map: gach,
    });

    const sidePositions = [-7.5, 7.5]; // hai bên mép đường

    for (let i = 0; i < 3; i++) {
      // cho 3 đoạn đường
      const baseZ = -i * this.roadLength;

      for (let posLine of sidePositions) {
        for (let j = 0; j < this.roadLength / 4; j++) {
          // spacing = 4
          const z = baseZ - j * 4 - 2;
          const segment = new THREE.Mesh(longSideGeometry, longSideMaterial);
          segment.position.set(posLine, 0.15, z);
          this.scene.add(segment);
          this.longSidelines.push(segment);
        }
      }
    }
  }

  createBuilding_1(w, d, h) {
    const building = new THREE.Group();

    // Tạo khối chính của tòa nhà
    const buildingGeometry = new THREE.BoxGeometry(w, h, d);
    const buildingMaterial = new THREE.MeshLambertMaterial({ color: 0xf0f8ff });
    const mainBlock = new THREE.Mesh(buildingGeometry, buildingMaterial);
    mainBlock.position.y = h / 2;
    mainBlock.castShadow = true;
    mainBlock.receiveShadow = true;
    building.add(mainBlock);

    // Tạo dải màu xanh giữa mặt tiền
    const facadeGeometry = new THREE.BoxGeometry(w * 0.2, h, 0.05);
    const facadeMaterial = new THREE.MeshLambertMaterial({ color: 0x7da3c3 });
    const facade = new THREE.Mesh(facadeGeometry, facadeMaterial);
    facade.position.set(0, h / 2, d / 2 + 0.026);
    building.add(facade);

    // Thêm cửa chính
    const doorGeometry = new THREE.BoxGeometry(1, 2, 0.02);
    const doorMaterial = new THREE.MeshLambertMaterial({ color: 0xc6e2ff });
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(0, h * 0.05, d / 2 + 0.0411);
    building.add(door);

    // Thêm các cửa sổ tầng
    const windowGeometry = new THREE.BoxGeometry(w * 0.2, h * 0.08, 0.02);
    const windowMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
    const floors = 6;
    const offsetY = h / (floors + 1);
    for (let i = 1; i <= floors; i++) {
      const windowLeft = new THREE.Mesh(windowGeometry, windowMaterial);
      const windowRight = new THREE.Mesh(windowGeometry, windowMaterial);

      windowLeft.position.set(-w * 0.25, i * offsetY, d / 2 + 0.03);
      windowRight.position.set(w * 0.25, i * offsetY, d / 2 + 0.03);

      building.add(windowLeft, windowRight);
    }

    // Thêm mái tôn
    const roofGeometry = new THREE.BoxGeometry(w * 1.05, h * 0.022, d * 1.05);
    const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x00bfff });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.castShadow = true;
    roof.receiveShadow = true;
    roof.position.set(0, h - 0.1, 0);
    building.add(roof);

    // Thêm 2 cột đen 2 bên toà nhà
    const columnGeometry = new THREE.CylinderGeometry(0.05, 0.05, h - 0.2, 32);
    const columnMaterial = new THREE.MeshLambertMaterial({ color: 0x828282 });
    const columnLeft = new THREE.Mesh(columnGeometry, columnMaterial);
    const columnRight = new THREE.Mesh(columnGeometry, columnMaterial);
    columnLeft.position.set(-w * 0.5, h / 2 - 0.1, d / 2 + 0.03);
    columnRight.position.set(w * 0.5, h / 2 - 0.1, d / 2 + 0.03);
    building.add(columnLeft, columnRight);

    // Thêm 1 biển hiệu trên đầu toà nhà + texture
    const signGeometry = new THREE.BoxGeometry(w * 0.8, 1.2, 0.02);
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load("textures/img/pepsi.jpg", () => {
      //sign.material.map = texture;
      sign.material.needsUpdate = true;
    });
    const signMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const sign = new THREE.Mesh(signGeometry, signMaterial);
    sign.castShadow = true;
    sign.receiveShadow = true;
    sign.position.set(0, h + 0.42, d / 2 - 0.1);
    sign.rotation.x = -Math.PI / 6;
    building.add(sign);

    // sân đáp trực thăng trên nóc
    const helipadGeometry = new THREE.CircleGeometry(w * 0.3, 32);
    const helipadMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
    const helipad = new THREE.Mesh(helipadGeometry, helipadMaterial);
    helipad.rotation.x = -Math.PI / 2;
    helipad.position.set(0, h + 0.02, 0);
    building.add(helipad);

    building.rotation.y = Math.PI / 2;
    building.position.y = h / 2;
    return building;
  }

  createBuilding_2(w, d, h) {
    const building = new THREE.Group();

    const floors = 6;
    const floorHeight = h / floors;

    // Thân nhà chính (xám nhạt)
    const mainGeo = new THREE.BoxGeometry(w, h, d);
    const mainMat = new THREE.MeshLambertMaterial({ color: 0xe6e6e6 }); // xám nhạt
    const main = new THREE.Mesh(mainGeo, mainMat);
    main.position.y = h / 2;
    main.castShadow = true;
    main.receiveShadow = true;
    building.add(main);

    // Viền chân nhà
    const baseGeo = new THREE.BoxGeometry(w, 0.2, d);
    const baseMat = new THREE.MeshLambertMaterial({ color: 0xb0e0e6 }); // xanh đậm
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.1;
    building.add(base);

    // Viền mái nhà
    const topGeo = new THREE.BoxGeometry(w, 0.15, d);
    const topMat = new THREE.MeshLambertMaterial({ color: 0xb0e0e6 });
    const top = new THREE.Mesh(topGeo, topMat);
    top.position.y = h + 0.075;
    building.add(top);

    // Dải đứng màu xanh (bên trái) chứa cửa và cửa sổ nhỏ
    const stripGeo = new THREE.BoxGeometry(w * 0.3, h, d + 0.05); // Tăng độ sâu để tránh chồng lấp
    const stripMat = new THREE.MeshLambertMaterial({ color: 0xb0e0e6 }); // xanh đậm
    const strip = new THREE.Mesh(stripGeo, stripMat);
    strip.position.set(-w * 0.35, h / 2, -0.025); // Điều chỉnh vị trí Z để nhô ra trước
    building.add(strip);

    const windowMat = new THREE.MeshLambertMaterial({
      color: 0x111111,
      transparent: true,
      opacity: 0.85,
    });

    // Cửa chính
    const doorGeo = new THREE.BoxGeometry(w * 0.18, floorHeight * 0.9, 0.05);
    const door = new THREE.Mesh(doorGeo, windowMat);
    door.position.set(-w * 0.35, floorHeight * 0.45, d / 2 + 0.075); // Tăng khoảng cách Z
    building.add(door);

    // Tầng lặp
    for (let i = 0; i < floors; i++) {
      const y = i * floorHeight + floorHeight / 2;

      // Cửa sổ nhỏ bên trái (trên dải màu xanh)
      const smallWinGeo = new THREE.BoxGeometry(
        w * 0.1,
        floorHeight * 0.4,
        0.03
      );
      const smallWin = new THREE.Mesh(smallWinGeo, windowMat);
      smallWin.position.set(-w * 0.35, y, d / 2 + 0.075); // Tăng khoảng cách Z
      building.add(smallWin);

      // Hai cửa sổ lớn bên phải (trên nền chính)
      const bigWinGeo = new THREE.BoxGeometry(
        w * 0.22,
        floorHeight * 0.5,
        0.03
      );
      const leftWin = new THREE.Mesh(bigWinGeo, windowMat);
      leftWin.position.set(-w * 0.08, y, d / 2 + 0.075); // Tăng khoảng cách Z

      const rightWin = leftWin.clone();
      rightWin.position.x = w * 0.18;

      building.add(leftWin, rightWin);
    }

    return building;
  }

  createBuilding_3(w, d, h) {
    const building = new THREE.Group();

    // Chiều cao tầng cafe hợp lý (giữ cố định)
    const cafeHeight = 1.5;

    const baseColor = 0xd8c0a9;
    const trimColor = 0x8b6f4e;
    const doorColor = 0x3a3a3a;
    const awningColor = 0xff6347;

    // Thân quán
    const bodyGeo = new THREE.BoxGeometry(w, cafeHeight, d);
    const bodyMat = new THREE.MeshLambertMaterial({ color: baseColor });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = cafeHeight / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    building.add(body);

    // Viền mái
    const trimGeo = new THREE.BoxGeometry(w * 1.02, 0.2, d * 1.02);
    const trimMat = new THREE.MeshLambertMaterial({ color: trimColor });
    const trim = new THREE.Mesh(trimGeo, trimMat);
    trim.position.y = cafeHeight + 0.1;
    trim.castShadow = true;
    trim.receiveShadow = true;
    building.add(trim);

    // Cửa chính
    const doorGeo = new THREE.BoxGeometry(w * 0.3, cafeHeight * 0.6, 0.05);
    const doorMat = new THREE.MeshLambertMaterial({ color: doorColor });
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(0, cafeHeight * 0.3, d / 2 + 0.03);
    door.castShadow = true;
    building.add(door);

    // Biển hiệu
    const signGeo = new THREE.BoxGeometry(w * 0.5, 0.2, 0.05);
    const signMat = new THREE.MeshLambertMaterial({ color: 0xff9966 });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, cafeHeight + 0.25, d / 2 + 0.04);
    building.add(sign);

    // Mái che cửa sổ
    function createAwning(width, height) {
      const group = new THREE.Group();
      const stripeCount = 6;
      for (let i = 0; i < stripeCount; i++) {
        const stripeGeo = new THREE.BoxGeometry(
          width / stripeCount,
          height,
          0.02
        );
        const stripeMat = new THREE.MeshLambertMaterial({
          color: i % 2 === 0 ? 0xffffff : awningColor,
        });
        const stripe = new THREE.Mesh(stripeGeo, stripeMat);
        stripe.position.x = -width / 2 + (i + 0.5) * (width / stripeCount);
        group.add(stripe);
      }
      return group;
    }

    const awningWidth = w * 0.3;
    const awningHeight = 0.2;
    const awning1 = createAwning(awningWidth, awningHeight);
    const awning2 = createAwning(awningWidth, awningHeight);

    awning1.position.set(-w * 0.3, cafeHeight * 0.7, d / 2 + 0.02);
    awning2.position.set(w * 0.3, cafeHeight * 0.7, d / 2 + 0.02);
    building.add(awning1, awning2);

    // Bàn ghế và ô dù
    function createTableWithUmbrella() {
      const group = new THREE.Group();

      const tableGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.05, 8);
      const table = new THREE.Mesh(
        tableGeo,
        new THREE.MeshLambertMaterial({ color: 0x8b6f4e })
      );
      table.position.y = 0.4;
      group.add(table);

      for (let i = 0; i < 4; i++) {
        const chairGeo = new THREE.BoxGeometry(0.05, 0.2, 0.05);
        const chair = new THREE.Mesh(
          chairGeo,
          new THREE.MeshLambertMaterial({ color: 0x5e4a35 })
        );
        const angle = (Math.PI / 2) * i;
        const radius = 0.25;
        chair.position.set(
          Math.cos(angle) * radius,
          0.1,
          Math.sin(angle) * radius
        );
        group.add(chair);
      }

      const umbrellaGeo = new THREE.ConeGeometry(0.4, 0.2, 8);
      const umbrellaMat = new THREE.MeshLambertMaterial({ color: 0xff6347 });
      const umbrella = new THREE.Mesh(umbrellaGeo, umbrellaMat);
      umbrella.position.y = 0.7;
      group.add(umbrella);

      return group;
    }

    // Tính toán vị trí bàn ghế để không tràn ra đường
    const table1 = createTableWithUmbrella();
    const table2 = createTableWithUmbrella();
    const table3 = createTableWithUmbrella();

    // Khoảng cách từ mép trước của tòa nhà đến mép đường
    const roadEdge = 7.5; // Mép đường tại +-7.5 (roadWidth / 2)
    const buildingEdge = d / 2; // Mép trước của tòa nhà
    const offsetFromEdge = 0.5; // Khoảng cách an toàn từ mép đường
    const tableSetRadius = 0.25; // Bán kính của bộ bàn ghế (do ghế có radius = 0.25)

    // Đặt vị trí Z sao cho mép ngoài của bàn ghế không vượt quá mép đường
    const maxZ = roadEdge - offsetFromEdge - tableSetRadius; // Tính vị trí Z tối đa
    const tableZ = Math.min(buildingEdge + 0.5, maxZ); // Đặt Z không vượt quá maxZ

    // Đặt vị trí X để không vượt ra ngoài chiều rộng tòa nhà
    const tableXSpacing = w * 0.3; // Khoảng cách giữa các bàn ghế
    table1.position.set(-tableXSpacing, 0, tableZ);
    table2.position.set(0, 0, tableZ);
    table3.position.set(tableXSpacing, 0, tableZ);

    building.add(table1, table2, table3);

    return building;
  }

  createBuilding_4(w, d, h) {
    const park = new THREE.Group();
    // === Park base ===
    const grass = new THREE.Mesh(
      new THREE.BoxGeometry(w, 0.2, d),
      new THREE.MeshLambertMaterial({ color: 0x88cc66 })
    );
    grass.position.y = 0.1;
    park.add(grass);

    // === Benches (4 benches in a square pattern) ===
    function createBench() {
      const bench = new THREE.Group();
      const mat = new THREE.MeshLambertMaterial({ color: 0x664433 });

      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.2), mat);
      seat.position.y = 0.3;
      bench.add(seat);

      const legGeo = new THREE.BoxGeometry(0.1, 0.2, 0.1);
      const legs = [-0.3, 0.3].map((x) => {
        const leg = new THREE.Mesh(legGeo, mat);
        leg.position.set(x, 0.1, 0);
        return leg;
      });
      legs.forEach((leg) => bench.add(leg));
      return bench;
    }

    const benchPositions = [
      { x: -w / 4, z: -d / 4 }, // Bottom-left
      { x: w / 4, z: -d / 4 }, // Bottom-right
      { x: -w / 4, z: d / 4 }, // Top-left
      { x: w / 4, z: d / 4 }, // Top-right
    ];
    benchPositions.forEach((pos) => {
      const bench = createBench();
      bench.position.set(pos.x, 0, pos.z);
      bench.rotation.y = Math.PI / 2; // Adjust rotation as needed
      park.add(bench);
    });

    // === Trees (larger and random sizes) ===
    function createTree() {
      // Random scale between 1.5x and 2x
      const scale = 1.5 + Math.random() * (2 - 1.5);

      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05 * scale, 0.05 * scale, 0.4 * scale, 6),
        new THREE.MeshLambertMaterial({ color: 0x775533 })
      );
      trunk.position.y = 0.2 * scale;

      const crown = new THREE.Mesh(
        new THREE.SphereGeometry(0.25 * scale, 6, 6),
        new THREE.MeshLambertMaterial({ color: 0x66cc33 })
      );
      crown.position.y = 0.2 * scale + 0.3 * scale; // Adjust crown position based on scaled trunk height

      const tree = new THREE.Group();
      tree.add(trunk);
      tree.add(crown);
      return tree;
    }

    const treePositions = [
      { x: -w / 2, z: -d / 2 },
      { x: -w / 4, z: -d / 2 },
      { x: 0, z: -d / 2 },
      { x: w / 4, z: -d / 2 },
      { x: w / 2, z: -d / 2 },
      { x: -w / 2, z: -d / 4 },
      { x: w / 2, z: -d / 4 },
      { x: -w / 2, z: 0 },
      { x: w / 2, z: 0 },
      { x: -w / 2, z: d / 4 },
      { x: w / 2, z: d / 4 },
      { x: -w / 2, z: d / 2 },
      { x: -w / 4, z: d / 2 },
      { x: 0, z: d / 2 },
      { x: w / 4, z: d / 2 },
      { x: w / 2, z: d / 2 },
    ];
    treePositions.forEach((pos) => {
      const tree = createTree();
      tree.position.set(pos.x, 0, pos.z);
      park.add(tree);
    });

    // === Fountain in the center ===
    function createFountain() {
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 0.8, 0.2, 16),
        new THREE.MeshLambertMaterial({ color: 0x999999 })
      );
      base.position.y = 0.1;

      const water = new THREE.Mesh(
        new THREE.CylinderGeometry(0.6, 0.6, 0.1, 16),
        new THREE.MeshLambertMaterial({
          color: 0x3399ff,
          transparent: true,
          opacity: 0.8,
        })
      );
      water.position.y = 0.25;

      const fountain = new THREE.Group();
      fountain.add(base);
      fountain.add(water);
      return fountain;
    }

    const fountain = createFountain();
    fountain.position.set(0, 0, 0);
    park.add(fountain);

    return park;
  }

  createAntenna(height = 2) {
    const group = new THREE.Group();

    const bottomWidth = 0.6; // khoảng cách giữa chân dưới
    const topWidth = 0.1; // khoảng cách giữa chân trên
    const legSegments = 3; // số đoạn thanh nối ngang
    const legRadius = 0.025;
    const legHeight = height;

    const legMat = new THREE.MeshLambertMaterial({ color: 0x888888 });

    const createLeg = (x1, z1, x2, z2) => {
      const legGeo = new THREE.CylinderGeometry(
        legRadius,
        legRadius,
        legHeight,
        8
      );
      const leg = new THREE.Mesh(legGeo, legMat);

      const midX = (x1 + x2) / 2;
      const midZ = (z1 + z2) / 2;
      const midY = legHeight / 2;

      leg.position.set(midX, midY, midZ);

      const dx = x2 - x1;
      const dz = z2 - z1;
      const len = Math.sqrt(dx * dx + dz * dz + legHeight * legHeight);
      const angleX = Math.atan2(dz, legHeight);
      const angleZ = Math.atan2(dx, legHeight);

      // làm nghiêng trụ
      leg.rotation.z = -angleZ;
      leg.rotation.x = angleX;

      group.add(leg);
    };

    // Các chân: 4 điểm từ đáy lên đỉnh
    const positions = [
      {
        bottom: [-bottomWidth / 2, -bottomWidth / 2],
        top: [-topWidth / 2, -topWidth / 2],
      },
      {
        bottom: [bottomWidth / 2, -bottomWidth / 2],
        top: [topWidth / 2, -topWidth / 2],
      },
      {
        bottom: [-bottomWidth / 2, bottomWidth / 2],
        top: [-topWidth / 2, topWidth / 2],
      },
      {
        bottom: [bottomWidth / 2, bottomWidth / 2],
        top: [topWidth / 2, topWidth / 2],
      },
    ];

    for (const pos of positions) {
      createLeg(pos.bottom[0], pos.bottom[1], pos.top[0], pos.top[1]);
    }

    // Các thanh ngang nối ở 3 tầng (dạng hộp vuông)
    const barMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
    const barHeightStep = legHeight / (legSegments + 1);

    for (let i = 1; i <= legSegments; i++) {
      const y = i * barHeightStep;

      const t = y / legHeight;
      const width = bottomWidth * (1 - t) + topWidth * t;

      const barGeoH = new THREE.BoxGeometry(width, 0.03, 0.03);
      const barGeoV = new THREE.BoxGeometry(0.03, 0.03, width);

      // 4 cạnh
      for (let j = 0; j < 4; j++) {
        const barH = new THREE.Mesh(barGeoH, barMat);
        const barV = new THREE.Mesh(barGeoV, barMat);

        const offset = width / 2;
        const sign = j < 2 ? 1 : -1;

        // Horizontal bars
        barH.position.set(0, y, sign * offset);
        barV.position.set(sign * offset, y, 0);

        group.add(barH);
        group.add(barV);
      }
    }

    // Quả cầu đỏ trên đỉnh
    const ballGeo = new THREE.SphereGeometry(0.1, 16, 16);
    const ballMat = new THREE.MeshLambertMaterial({ color: 0xff0000 });
    const ball = new THREE.Mesh(ballGeo, ballMat);
    ball.position.y = legHeight + 0.1;
    group.add(ball);

    return group;
  }

  createBuilding_5(w, d, h) {
    const building = new THREE.Group();

    const floorCount = 4;
    const floorHeight = h / floorCount;

    // === Khối chính ===
    const mainGeo = new THREE.BoxGeometry(w, h, d);
    const mainMat = new THREE.MeshLambertMaterial({ color: 0xffe599 }); // vàng nhạt
    const mainMesh = new THREE.Mesh(mainGeo, mainMat);
    mainMesh.castShadow = true;
    mainMesh.receiveShadow = true;
    building.add(mainMesh);

    // === Cửa và ban công mỗi tầng ===
    for (let i = 0; i < floorCount; i++) {
      const y = floorHeight * i - h / 2 + floorHeight / 2;

      // Cửa sổ bên trái và phải
      const windowGeo = new THREE.BoxGeometry(
        w * 0.25,
        floorHeight * 0.6,
        0.02
      );
      const windowMat = new THREE.MeshLambertMaterial({
        color: 0x111111,
        transparent: true,
        opacity: 0.8,
      });

      for (let offsetX of [-w * 0.3, w * 0.3]) {
        const window = new THREE.Mesh(windowGeo, windowMat);
        window.position.set(offsetX, y, d / 2 + 0.01);
        building.add(window);
      }

      // Cửa chính giữa tầng (dùng cửa kính)
      const doorGeo = new THREE.BoxGeometry(w * 0.15, floorHeight * 0.6, 0.02);
      const door = new THREE.Mesh(doorGeo, windowMat);
      door.position.set(0, y, d / 2 + 0.01);
      building.add(door);
    }

    // === Cửa sổ bên hông trái ===
    const sideWinGeo = new THREE.BoxGeometry(0.2, floorHeight * 0.6, 0.02);
    const sideWinMat = new THREE.MeshLambertMaterial({
      color: 0x111111,
      transparent: true,
      opacity: 0.8,
    });

    for (let i = 0; i < floorCount; i++) {
      const y = floorHeight * i - h / 2 + floorHeight / 2;
      const win = new THREE.Mesh(sideWinGeo, sideWinMat);
      win.position.set(-w / 2 - 0.01, y, 0);
      win.rotation.y = Math.PI / 2;
      building.add(win);
    }

    // === Cửa chính bên hông trái tầng 1 (to hơn) ===
    const doorWidth = 1;
    const doorHeight = floorHeight * 0.9;
    const doorDepth = 0.02;
    const sideDoorGeo = new THREE.BoxGeometry(doorWidth, doorHeight, doorDepth);
    const sideDoorMat = new THREE.MeshLambertMaterial({
      color: 0x222222,
      transparent: true,
      opacity: 0.9,
    });

    const sideDoor = new THREE.Mesh(sideDoorGeo, sideDoorMat);
    sideDoor.position.set(-w / 2 - 0.01, -h / 2 + doorHeight / 2 + 0.01, 0); // sát hông trái
    sideDoor.rotation.y = Math.PI / 2;
    building.add(sideDoor);

    // === Mái che chéo cho cửa chính bên hông ===
    // Tạo hình mái che hình tam giác nghiêng bằng Box và xoay
    const awningLength = doorWidth + 0.4;
    const awningThickness = 0.05;
    const awningWidth = 0.3;

    const awningGeo = new THREE.BoxGeometry(
      awningThickness,
      awningWidth,
      awningLength
    );
    const awningMat = new THREE.MeshLambertMaterial({ color: 0x666666 });

    const awning = new THREE.Mesh(awningGeo, awningMat);

    // đặt mái che nghiêng xuống
    awning.rotation.z = -Math.PI / 4;
    awning.position.set(
      -w / 2 - 0.05,
      -h / 2 + doorHeight + awningWidth / 2,
      0
    );
    building.add(awning);

    // === Mái nhà chính ===
    const roofGeo = new THREE.BoxGeometry(w + 0.2, 0.1, d + 0.2);
    const roofMat = new THREE.MeshLambertMaterial({ color: 0xffcc88 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = h / 2 + 0.05;
    building.add(roof);

    // === Lan can trang trí trên mái ===
    const railHeight = 0.2;
    const railGeo = new THREE.BoxGeometry(0.05, railHeight, d + 0.3);
    const railMat = new THREE.MeshLambertMaterial({ color: 0x888888 });

    for (let side of [-1, 1]) {
      const rail = new THREE.Mesh(railGeo, railMat);
      rail.position.set(side * (w / 2 + 0.05), h / 2 + railHeight / 2 + 0.1, 0);
      building.add(rail);
    }

    // === Ắng-ten ngẫu nhiên ===
    if (Math.random() < 0.4) {
      const antenna = this.createAntenna(1.6);
      antenna.position.set(0, h / 2 + 0.15, 0); // giữa nóc, hơi cao hơn mái 1 chút
      building.add(antenna);
    }

    // === Đặt tòa nhà đúng mặt đất ===
    building.position.y = h / 2;
    return building;
  }

  createBuilding_6(w, d, h) {
    const building = new THREE.Group();

    const floorHeight = 1.5;
    const totalHeight = h * floorHeight;

    // === Main block of the building ===
    const main = new THREE.Mesh(
      new THREE.BoxGeometry(w, totalHeight, d),
      new THREE.MeshLambertMaterial({ color: 0xd97b6c })
    );
    main.position.y = totalHeight / 2;
    main.castShadow = true;
    main.receiveShadow = true;
    building.add(main);

    // === Windows & doors per floor ===
    const windowMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    const frameMat = new THREE.MeshLambertMaterial({ color: 0xeeeeee });

    // Calculate offsetY based on number of floors (h)
    const offsetY = totalHeight / (h + 1); // Ensure even distribution across h floors

    for (let i = 1; i <= h; i++) {
      const y = i * offsetY; // Position at the center of each floor

      // Balcony
      const balcony = new THREE.Mesh(
        new THREE.BoxGeometry(w * 0.95, 0.1, 0.3),
        new THREE.MeshLambertMaterial({ color: 0xbbbbbb })
      );
      balcony.position.set(0, y + 0.1, d / 2 + 0.15);
      balcony.castShadow = true;
      balcony.receiveShadow = true;
      building.add(balcony);

      // Railing
      const railing = new THREE.Mesh(
        new THREE.BoxGeometry(w * 0.9, 0.05, 0.05),
        new THREE.MeshLambertMaterial({ color: 0x222222 })
      );
      railing.position.set(0, y + 0.3, d / 2 + 0.25);
      railing.castShadow = true;
      railing.receiveShadow = true;
      building.add(railing);

      // Two side windows
      const winGeo = new THREE.BoxGeometry(0.4, 0.8, 0.05);
      const offsetX = 0.5;
      const winZ = d / 2 + 0.025;

      for (let dx of [-offsetX, offsetX]) {
        const frame = new THREE.Mesh(winGeo, frameMat);
        const glass = new THREE.Mesh(
          new THREE.BoxGeometry(0.35, 0.75, 0.01),
          windowMat
        );
        frame.position.set(dx, y, winZ);
        glass.position.set(dx, y, d / 2 + 0.051);
        frame.castShadow = true;
        frame.receiveShadow = true;
        glass.castShadow = true;
        glass.receiveShadow = true;
        building.add(frame);
        building.add(glass);
      }

      // Middle door
      const isGround = i === 1; // Consider first floor as ground
      const doorGeo = new THREE.BoxGeometry(0.4, isGround ? 1.0 : 0.8, 0.05);
      const door = new THREE.Mesh(doorGeo, frameMat);
      const doorGlass = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, isGround ? 0.95 : 0.75, 0.01),
        windowMat
      );
      door.position.set(0, y, winZ);
      doorGlass.position.set(0, y, d / 2 + 0.051);
      door.castShadow = true;
      door.receiveShadow = true;
      doorGlass.castShadow = true;
      doorGlass.receiveShadow = true;
      building.add(door);
      building.add(doorGlass);
    }

    // === Side glass panels ===
    const sideX = w / 2 + 0.01;
    const glassMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    for (let i = 1; i <= h; i++) {
      const y = i * offsetY;
      const glass = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 1.0, 0.05),
        glassMat
      );
      glass.position.set(sideX, y, 0);
      glass.castShadow = true;
      glass.receiveShadow = true;
      building.add(glass);
    }

    // === Antenna on roof ===
    const antenna = this.createAntenna(2);
    antenna.position.set(0, totalHeight + 0.1, 0);
    antenna.castShadow = true;
    antenna.receiveShadow = true;
    building.add(antenna);

    return building;
  }

  createBuildings() {
    this.sideBuildings = [];

    const spacing = 7;
    const roadSegmentCount = 3;
    const buildingCountPerSegment = this.roadLength / spacing - 1;

    const minHeight = 4,
      maxHeight = 10;
    const minSize = 3,
      maxSize = 7;

    const leftOffsetBase = -this.roadWidth / 2 - 4; // Base offset for left side
    const rightOffsetBase = this.roadWidth / 2 + 4; // Base offset for right side

    for (let segIndex = 0; segIndex < roadSegmentCount; segIndex++) {
      const segmentBuildings = [];

      for (let i = 0; i < buildingCountPerSegment; i++) {
        const zPos = -segIndex * this.roadLength - i * spacing;

        // Random parameters
        const w = THREE.MathUtils.randFloat(minSize, maxSize);
        const d = THREE.MathUtils.randFloat(minSize, maxSize);
        const h = THREE.MathUtils.randFloat(minHeight, maxHeight);
        const id = THREE.MathUtils.randInt(1, 6); // chọn mẫu tòa nhà từ 1 -> 6

        // Left building
        const left = this.createBuildingById(id, 6, 6, h);
        left.receiveShadow = true;
        left.castShadow = true;
        left.position.set(leftOffsetBase, 0, zPos);
        left.rotation.y = Math.PI / 2;
        this.scene.add(left);
        segmentBuildings.push(left);

        // const left = this.createBuildingById(1, w, d, h);
        // left.receiveShadow = true;
        // left.castShadow = true;
        // left.position.set(leftOffsetBase - w / 2, 0, zPos); // Center the building relative to offset
        // this.scene.add(left);
        // segmentBuildings.push(left);

        // Right building
        const right = this.createBuildingById(id, w, d, h);
        right.receiveShadow = true;
        right.castShadow = true;
        // Adjust position to keep outer edge at rightOffsetBase
        right.position.set(rightOffsetBase, 0, zPos); // Center the building relative to offset
        right.rotation.y = -Math.PI / 2; // Keep rotation if intended
        this.scene.add(right);
        segmentBuildings.push(right);
      }

      this.sideBuildings.push(segmentBuildings);
    }
  }

  // createBuildings() {
  //     this.sideBuildings = [];

  //     const spacing = 7;
  //     const roadSegmentCount = 3;
  //     const buildingCountPerSegment = this.roadLength / spacing - 1;

  //     const minHeight = 4,
  //       maxHeight = 10;
  //     const minSize = 3,
  //       maxSize = 7;

  //     const leftOffset = -this.roadWidth / 2 - 4;
  //     const rightOffset = this.roadWidth / 2 + 4;

  //     for (let segIndex = 0; segIndex < roadSegmentCount; segIndex++) {
  //       const segmentBuildings = [];

  //       for (let i = 0; i < buildingCountPerSegment; i++) {
  //         const zPos = -segIndex * this.roadLength - i * spacing;

  //         // Random parameters
  //         const w = THREE.MathUtils.randFloat(minSize, maxSize);
  //         const d = THREE.MathUtils.randFloat(minSize, maxSize);
  //         const h = THREE.MathUtils.randFloat(minHeight, maxHeight);
  //         const id = THREE.MathUtils.randInt(1, 6); // chọn mẫu tòa nhà từ 1 -> 6

  //         const left = this.createBuildingById(1, 6, 6, h);
  //         left.receiveShadow = true;
  //         left.castShadow = true;
  //         left.position.set(leftOffset, 0, zPos);
  //         //left.rotation.y = Math.PI / 2;
  //         this.scene.add(left);
  //         segmentBuildings.push(left);

  //         const right = this.createBuildingById(id, w, d, h);
  //         right.receiveShadow = true;
  //         right.castShadow = true;
  //         // const rightEdgeOffset = this.roadWidth / 2 + 4 + (maxSize - w) / 2;
  //         // right.position.set(rightEdgeOffset, 0, zPos);
  //         right.position.set(rightOffset, 0, zPos);
  //         right.rotation.y = -Math.PI / 2;
  //         this.scene.add(right);
  //         segmentBuildings.push(right);
  //       }

  //       this.sideBuildings.push(segmentBuildings);
  //     }
  //   }

  createBuildingById(id, w, d, h) {
    switch (id) {
      case 1:
        return this.createBuilding_1(w, d, h);
      case 2:
        return this.createBuilding_2(w, d, h);
      case 3:
        return this.createBuilding_3(w, d, h);
      case 4:
        return this.createBuilding_4(w, d, h); // Đảm bảo truyền đúng tham số
      case 5:
        return this.createBuilding_5(w, d, h);
      case 6:
        return this.createBuilding_6(w, d, h);
      default:
        return this.createBuilding_1(w, d, h); // fallback
    }
  }

  update(delta, speed) {
    // Move road segments
    for (const segment of this.roadSegments) {
      segment.position.z += speed * delta;

      // If a segment goes behind the camera, move it to the front
      if (segment.position.z > this.roadLength) {
        segment.position.z -= this.roadLength * this.roadSegments.length;
      }
    }

    // Move lane lines
    for (const line of this.laneLines) {
      line.mesh.position.z += speed * delta;

      // Reset position if beyond camera
      if (line.mesh.position.z > this.roadLength) {
        line.mesh.position.z -= this.roadLength * (this.laneLines.length / 2);
      }
    }

    // Move crosswalk lines
    for (const line of this.crosswalkLines) {
      line.mesh.position.z += speed * delta;

      // Reset position if beyond camera
      if (line.mesh.position.z > this.roadLength / 1.5) {
        line.mesh.position.z = -100;
      }
    }

    // Move buildings
    for (let i = 0; i < this.sideBuildings.length; i++) {
      const segmentBuildings = this.sideBuildings[i];
      for (const building of segmentBuildings) {
        building.position.z += speed * delta;

        // Reset position if beyond camera
        if (building.position.z > this.roadLength / 2) {
          building.position.z -= this.roadLength * this.roadSegments.length;
        }
      }
    }

    // Move traffic lights
    for (const trafficlight of this.trafficLights) {
      trafficlight.mesh.position.z += speed * delta;

      // Reset position if beyond camera
      if (trafficlight.mesh.position.z > this.roadLength / 1.5) {
        trafficlight.mesh.position.z = -100;
      }
    }

    // Move long sideLines
    for (const line of this.longSidelines) {
      line.position.z += speed * delta;

      // Reset position if beyond camera
      if (line.position.z > this.roadLength / 2) {
        line.position.z -= this.roadLength * this.roadSegments.length;
      }
    }

    if (this.clouds) {
      for (const cloud of this.clouds.children) {
        const velocity = cloud.userData.velocity || 0.1; // Giá trị mặc định
        cloud.position.z += velocity * delta;
        cloud.rotation.z += cloud.userData.rotationSpeed * delta; // Thêm xoay nhẹ
        if (cloud.position.z > 100) {
          cloud.position.z -= 200;
          cloud.position.x = (Math.random() - 0.5) * 100; // Đặt lại vị trí X ngẫu nhiên
          cloud.position.y = 10 + Math.random() * 10; // Đặt lại vị trí Y
        }
      }
    }
  }

  reset() {
    // Reset road segment positions
    for (let i = 0; i < this.roadSegments.length; i++) {
      this.roadSegments[i].position.z = -i * this.roadLength;
    }

    // Reset lane lines
    for (let i = 0; i < this.laneLines.length; i++) {
      const lineIndex = Math.floor(i / 2);
      this.laneLines[i].mesh.position.z = -lineIndex * this.roadLength;
      this.laneLines[i].baseZ = -lineIndex * this.roadLength;
    }
  }
}
