import * as THREE from 'three';
import { Sky } from 'three/examples/jsm/objects/sky.js';

export class World {
  constructor(scene) {
    this.scene = scene;
    this.roadLength = 50;
    this.roadWidth = 15;
    
    this.createGround();
    this.createSkyBox();
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
    const sky = new Sky();
    sky.scale.setScalar(450000);
    this.scene.add(sky);

    const skyUniforms = sky.material.uniforms;
    skyUniforms['turbidity'].value = 10;
    skyUniforms['rayleigh'].value = 2;
    skyUniforms['mieCoefficient'].value = 0.005;
    skyUniforms['mieDirectionalG'].value = 0.8;

    // Vị trí mặt trời (ánh sáng)
    const sun = new THREE.Vector3();
    const theta = Math.PI * (0.49); // cao
    const phi = 2 * Math.PI * (0.25); // góc quay
    sun.x = Math.cos(phi) * Math.sin(theta);
    sun.y = Math.cos(theta);
    sun.z = Math.sin(phi) * Math.sin(theta);
    sky.material.uniforms['sunPosition'].value.copy(sun);

    // Optional: dùng thêm ánh sáng mặt trời (DirectionalLight)
    const sunlight = new THREE.DirectionalLight(0xffffff, 1);
    sunlight.position.copy(sun);
    this.scene.add(sunlight);
  }

  createRoadSegments() {
    this.roadSegments = [];
    const loader = new THREE.TextureLoader();

    // Create the road
    const roadGeometry = new THREE.PlaneGeometry(this.roadWidth, this.roadLength);
    const texture = loader.load('textures/img/matduong.jpg');
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(this.roadWidth / 10, this.roadLength / 10); // tuỳ chỉnh mật độ lặp

    const roadMaterial = new THREE.MeshLambertMaterial({ 
      map: texture,
      roughness: 0,
      metalness: 0,
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
      const x = -this.roadWidth / 2 + j * crossLineWidth + crossLineWidth / 2;;
      const line = new THREE.Mesh(crossLineGeometry, crossLineMaterial);
      line.rotation.x = -Math.PI / 2;
      line.position.set(x, 0.02, 0); 
      this.scene.add(line); 
      this.crosswalkLines.push({ mesh: line, baseZ: segmentEndZ });
    }

    // Add sidelines
    this.longSidelines = [];
    const gach = loader.load('textures/img/gach.jpg');
    const longSideGeometry = new THREE.BoxGeometry(0.3, 0.3, 2.5); // mỗi đoạn dài 2 đơn vị
    const longSideMaterial = new THREE.MeshBasicMaterial({ 
      map: gach,
      
    });

    const sidePositions = [-7.5, 7.5]; // hai bên mép đường

    for (let i = 0; i < 3; i++) { // cho 3 đoạn đường
      const baseZ = -i * this.roadLength;

      for (let posLine of sidePositions) {
        for (let j = 0; j < this.roadLength / 4 ; j++) { // spacing = 4
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
    const buildingMaterial = new THREE.MeshLambertMaterial({color: 0xF0F8FF });
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
    const doorMaterial = new THREE.MeshLambertMaterial({ color: 0xC6E2FF });
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(0, h * 0.05, d /2 + 0.0411);
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
    const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x00BFFF });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.castShadow = true;
    roof.receiveShadow = true;
    roof.position.set(0, h - 0.1, 0);
    building.add(roof);

    // Thêm 2 cột đen 2 bên toà nhà
    const columnGeometry = new THREE.CylinderGeometry(0.05, 0.05, h - 0.2 , 32);
    const columnMaterial = new THREE.MeshLambertMaterial({ color: 0x828282 });
    const columnLeft = new THREE.Mesh(columnGeometry, columnMaterial);
    const columnRight = new THREE.Mesh(columnGeometry, columnMaterial);
    columnLeft.position.set(-w * 0.5, h / 2 - 0.1, d / 2 + 0.03);
    columnRight.position.set(w * 0.5, h / 2 - 0.1, d / 2 + 0.03);
    building.add(columnLeft, columnRight);
    
    // Thêm 1 biển hiệu trên đầu toà nhà + texture
    const signGeometry = new THREE.BoxGeometry(w * 0.8, 1.2, 0.02);
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load('textures/img/pepsi.jpg', () => {
      sign.material.map = texture;
      sign.material.needsUpdate = true;
    });
    const signMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
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
    building.position.y = h / 2;;
    return building;
  }

createBuilding_2(w, d, h) {
    const building = new THREE.Group();

    // Khối chính hình trụ
    const mainGeo = new THREE.CylinderGeometry(w / 2, w / 2, h, 16);
    const mainMat = new THREE.MeshLambertMaterial({ color: 0x9999cc });
    const mainBlock = new THREE.Mesh(mainGeo, mainMat);
    mainBlock.position.y = h / 2;
    mainBlock.castShadow = true;
    mainBlock.receiveShadow = true;
    building.add(mainBlock);

    // Cửa sổ vòng quanh
    const floors = 5;
    const floorHeight = h / floors;
    const windowGeo = new THREE.BoxGeometry(0.5, floorHeight * 0.4, 0.02);
    const windowMat = new THREE.MeshLambertMaterial({ color: 0x333333, transparent: true, opacity: 0.7 });

    for (let i = 0; i < floors; i++) {
      for (let angle = 0; angle < 360; angle += 45) {
        const rad = (angle * Math.PI) / 180;
        const window = new THREE.Mesh(windowGeo, windowMat);
        window.position.set(
          (w / 2) * Math.cos(rad),
          (i + 0.5) * floorHeight,
          (w / 2) * Math.sin(rad)
        );
        window.rotation.y = -rad;
        window.castShadow = true;
        window.receiveShadow = true;
        building.add(window);
      }
    }

    // Mái phẳng với lan can
    const roofGeo = new THREE.CylinderGeometry(w / 2, w / 2, 0.2, 16);
    const roofMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = h + 0.1;
    roof.castShadow = true;
    roof.receiveShadow = true;
    building.add(roof);

    const railingGeo = new THREE.TorusGeometry(w / 2, 0.05, 8, 32);
    const railingMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
    const railing = new THREE.Mesh(railingGeo, railingMat);
    railing.position.y = h + 0.2;
    railing.rotation.x = Math.PI / 2;
    railing.castShadow = true;
    railing.receiveShadow = true;
    building.add(railing);

    // Cột trang trí ở đáy
    const colGeo = new THREE.CylinderGeometry(0.1, 0.1, 1, 16);
    const colMat = new THREE.MeshLambertMaterial({ color: 0xaaaaaa });
    for (let angle = 0; angle < 360; angle += 90) {
      const rad = (angle * Math.PI) / 180;
      const col = new THREE.Mesh(colGeo, colMat);
      col.position.set(
        (w / 2 - 0.2) * Math.cos(rad),
        0.5,
        (w / 2 - 0.2) * Math.sin(rad)
      );
      col.castShadow = true;
      col.receiveShadow = true;
      building.add(col);
    }

    building.position.y = h / 2;
    return building;
  }

  createBuilding_3(w, d, h) {
    const building = new THREE.Group();

    // Tháp với các tầng thu hẹp
    const floors = 4;
    const floorHeight = h / floors;
    for (let i = 0; i < floors; i++) {
      const radius = (w / 2) * (1 - i / floors); // Thu hẹp dần
      const geo = new THREE.CylinderGeometry(radius, radius, floorHeight, 12);
      const mat = new THREE.MeshLambertMaterial({ color: 0xcc9999 });
      const floor = new THREE.Mesh(geo, mat);
      floor.position.y = i * floorHeight + floorHeight / 2;
      floor.castShadow = true;
      floor.receiveShadow = true;
      building.add(floor);

      // Cửa sổ nhỏ
      const windowGeo = new THREE.BoxGeometry(0.3, floorHeight * 0.3, 0.02);
      const windowMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
      for (let angle = 0; angle < 360; angle += 90) {
        const rad = (angle * Math.PI) / 180;
        const window = new THREE.Mesh(windowGeo, windowMat);
        window.position.set(
          radius * Math.cos(rad),
          i * floorHeight + floorHeight / 2,
          radius * Math.sin(rad)
        );
        window.rotation.y = -rad;
        window.castShadow = true;
        window.receiveShadow = true;
        building.add(window);
      }
    }

    // Đỉnh anten
    const antenGeo = new THREE.CylinderGeometry(0.05, 0.05, 2, 8);
    const antenMat = new THREE.MeshLambertMaterial({ color: 0xaaaaaa });
    const anten = new THREE.Mesh(antenGeo, antenMat);
    anten.position.y = h + 1;
    anten.castShadow = true;
    anten.receiveShadow = true;
    building.add(anten);

    building.position.y = h / 2;
    return building;
  }

  createBuilding_4(w, d, h) {
    const building = new THREE.Group();

    // Khối chính
    const mainGeo = new THREE.BoxGeometry(w, h, d);
    const mainMat = new THREE.MeshLambertMaterial({ color: 0x99cc99 });
    const mainBlock = new THREE.Mesh(mainGeo, mainMat);
    mainBlock.position.y = h / 2;
    mainBlock.castShadow = true;
    mainBlock.receiveShadow = true;
    building.add(mainBlock);

    // Tấm kính lớn
    const floors = 5;
    const floorHeight = h / floors;
    const glassGeo = new THREE.BoxGeometry(w * 0.9, floorHeight * 0.6, 0.03);
    const glassMat = new THREE.MeshLambertMaterial({ color: 0x87ceeb, transparent: true, opacity: 0.6 });

    for (let i = 0; i < floors; i++) {
      const glass = new THREE.Mesh(glassGeo, glassMat);
      glass.position.set(0, (i + 0.5) * floorHeight, d / 2 + 0.031);
      glass.castShadow = true;
      glass.receiveShadow = true;
      building.add(glass);
    }

    // Mái nghiêng
    const roofGeo = new THREE.BoxGeometry(w * 1.05, 0.3, d * 1.05);
    const roofMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(0, h + 0.15, 0);
    roof.rotation.z = Math.PI / 12; // Nghiêng nhẹ
    roof.castShadow = true;
    roof.receiveShadow = true;
    building.add(roof);

    // Biển hiệu phát sáng
    const signGeo = new THREE.BoxGeometry(w * 0.7, 1, 0.02);
    const signMat = new THREE.MeshBasicMaterial({ color: 0xffffaa }); // Ánh sáng vàng
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, h + 0.7, d / 2 + 0.031);
    sign.castShadow = true;
    sign.receiveShadow = true;
    building.add(sign);

    building.position.y = h / 2;
    return building;
  }
  createAntenna(height = 2) {
  const group = new THREE.Group();

  const bottomWidth = 0.6; // khoảng cách giữa chân dưới
  const topWidth = 0.1;    // khoảng cách giữa chân trên
  const legSegments = 3;   // số đoạn thanh nối ngang
  const legRadius = 0.025;
  const legHeight = height;

  const legMat = new THREE.MeshLambertMaterial({ color: 0x888888 });

  const createLeg = (x1, z1, x2, z2) => {
    const legGeo = new THREE.CylinderGeometry(legRadius, legRadius, legHeight, 8);
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
    { bottom: [-bottomWidth/2, -bottomWidth/2], top: [-topWidth/2, -topWidth/2] },
    { bottom: [ bottomWidth/2, -bottomWidth/2], top: [ topWidth/2, -topWidth/2] },
    { bottom: [-bottomWidth/2,  bottomWidth/2], top: [-topWidth/2,  topWidth/2] },
    { bottom: [ bottomWidth/2,  bottomWidth/2], top: [ topWidth/2,  topWidth/2] },
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
      const windowGeo = new THREE.BoxGeometry(w * 0.25, floorHeight * 0.6, 0.02);
      const windowMat = new THREE.MeshLambertMaterial({ color: 0x111111, transparent: true, opacity: 0.8 });

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
    const sideWinMat = new THREE.MeshLambertMaterial({ color: 0x111111, transparent: true, opacity: 0.8 });

    for (let i = 0; i < floorCount; i++) {
      const y = floorHeight * i - h / 2 + floorHeight / 2;
      const win = new THREE.Mesh(sideWinGeo, sideWinMat);
      win.position.set(-w / 2 - 0.01, y, 0);
      win.rotation.y = Math.PI / 2;
      building.add(win);
    }

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

    // -------- Khối chính của tòa nhà --------
    const mainGeometry = new THREE.BoxGeometry(w, h, d);
    const mainMaterial = new THREE.MeshLambertMaterial({ color: 0xd46a6a }); // đỏ gạch
    const mainBlock = new THREE.Mesh(mainGeometry, mainMaterial);
    mainBlock.position.y = h / 2;
    building.add(mainBlock);

    // -------- Ban công cho từng tầng --------
    const floors = 4;
    const floorHeight = h / floors;
    const balconyDepth = 0.3;
    const balconyHeight = floorHeight * 0.6;

    const balconyGeometry = new THREE.BoxGeometry(w + 0.2, balconyHeight, balconyDepth);
    const balconyMaterial = new THREE.MeshLambertMaterial({ color: 0xc85c5c });

    for (let i = 1; i <= floors; i++) {
      const balcony = new THREE.Mesh(balconyGeometry, balconyMaterial);
      balcony.position.set(0, i * floorHeight - floorHeight / 2, d / 2 + balconyDepth / 2);
      building.add(balcony);
    }

    // -------- Cửa sổ và cửa tầng chính giữa --------
    const windowGeometry = new THREE.BoxGeometry(w * 0.2, floorHeight * 0.5, 0.02);
    const windowMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });

    for (let i = 0; i < floors; i++) {
      const y = (i + 0.5) * floorHeight;
      const leftWindow = new THREE.Mesh(windowGeometry, windowMaterial);
      const rightWindow = new THREE.Mesh(windowGeometry, windowMaterial);
      const centerWindow = new THREE.Mesh(windowGeometry, windowMaterial);

      leftWindow.position.set(-w * 0.3, y, d / 2 + 0.02);
      rightWindow.position.set(w * 0.3, y, d / 2 + 0.02);
      centerWindow.position.set(0, y, d / 2 + 0.02);

      building.add(leftWindow, rightWindow, centerWindow);
    }

    // -------- Dải cửa sổ bên hông trái --------
    const sideWindowGeometry = new THREE.BoxGeometry(0.1, floorHeight * 0.6, 0.02);
    for (let i = 0; i < floors; i++) {
      const win = new THREE.Mesh(sideWindowGeometry, windowMaterial);
      win.position.set(-w / 2 - 0.01, (i + 0.5) * floorHeight, -d / 3);
      win.rotation.y = Math.PI / 2;
      building.add(win);
    }

    // -------- Khung anten đơn giản trên nóc --------
    const poleGeometry = new THREE.CylinderGeometry(0.03, 0.03, 1.5);
    const poleMaterial = new THREE.MeshBasicMaterial({ color: 0xaaaaaa });

    const pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.set(0, h + 0.75, 0);
    building.add(pole);

    return building;
  }

  createBuildings() {
    this.sideBuildings = [];

    const spacing = 7;
    const roadSegmentCount = 3;
    const buildingCountPerSegment = this.roadLength / spacing -1 ;

    const minHeight = 4, maxHeight = 10;
    const minSize = 3, maxSize = 7;

    const leftOffset = -this.roadWidth / 2 - 4;
    const rightOffset = this.roadWidth / 2 + 4;

    for (let segIndex = 0; segIndex < roadSegmentCount; segIndex++) {
      const segmentBuildings = [];

      for (let i = 0; i < buildingCountPerSegment; i++) {
        const zPos = -segIndex * this.roadLength - i * spacing;

        // Random parameters
        const w = THREE.MathUtils.randFloat(minSize, maxSize);
        const d = THREE.MathUtils.randFloat(minSize, maxSize);
        const h = THREE.MathUtils.randFloat(minHeight, maxHeight);
        const id = THREE.MathUtils.randInt(1, 6); // chọn mẫu tòa nhà từ 1 -> 6

        const left = this.createBuildingById(1, 6, 6, h);
        left.receiveShadow = true;
        left.castShadow = true;
        left.position.set(leftOffset, 0, zPos);
        this.scene.add(left);
        segmentBuildings.push(left);

        const right = this.createBuildingById(id, 6, 6, h);
        right.receiveShadow = true;
        right.castShadow = true;
        if (id === 1 || id === 6) {
          right.position.set(rightOffset, 0, zPos);
          right.rotation.y = -Math.PI / 2;
        }
        else right.position.set(rightOffset, h / 2, zPos);
        
        this.scene.add(right);
        segmentBuildings.push(right);
      }

      this.sideBuildings.push(segmentBuildings);
    }
  }

  createBuildingById(id, w, d, h) {
    switch (id) {
      case 1: return this.createBuilding_1(w, d, h);
      case 2: return this.createBuilding_2(w, h);
      case 3: return this.createBuilding_3(w, h);
      case 4: return this.createBuilding_4(w, h);
      case 5: return this.createBuilding_5(w, d, h);
      case 6: return this.createBuilding_6(w, d, h);
      default: return this.createBuilding_1(w, d, h); // fallback
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