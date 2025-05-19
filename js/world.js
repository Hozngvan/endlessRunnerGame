import * as THREE from 'three';

export class World {
  constructor(scene) {
    this.scene = scene;
    this.roadLength = 50;
    this.roadWidth = 15;
    
    this.createGround();
    this.createSkyBox();
    this.createRoadSegments();
    this.createBuildings();
    //this.createClouds();
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
    // Simple sky gradient (could be enhanced with a real skybox)
    const verticalFog = new THREE.Fog(0x87ceeb, 50, 100);
    this.scene.fog = verticalFog;
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

    sign.position.set(0, h + 0.42, d / 2 + 0.02);
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

  createBuilding_2(w, h) {
    const geo = new THREE.CylinderGeometry(w / 2, w / 2, h, 8);
    const mat = new THREE.MeshLambertMaterial({ color: 0x9999cc });
    const mesh = new THREE.Mesh(geo, mat);
    return mesh;
  }

  createBuilding_3(w, h) {
    const geo = new THREE.ConeGeometry(w / 2, h, 6);
    const mat = new THREE.MeshLambertMaterial({ color: 0xcc9999 });
    const mesh = new THREE.Mesh(geo, mat);
    return mesh;
  }

  createBuilding_4(w, h) {
    const geo = new THREE.CapsuleGeometry(w / 2, h - w, 4, 8);
    const mat = new THREE.MeshLambertMaterial({ color: 0x99cc99 });
    const mesh = new THREE.Mesh(geo, mat);
    return mesh;
  }

  createBuilding_5(w, h) {
    const geo = new THREE.TorusGeometry(w / 2, w / 4, 8, 16);
    const mat = new THREE.MeshLambertMaterial({ color: 0xccffcc });
    const mesh = new THREE.Mesh(geo, mat);
    // mesh.scale.y = h / w; // kéo dài chiều cao
    return mesh;
  }

  createBuilding_6(w, d, h) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshLambertMaterial({ color: 0xffcc99, wireframe: false });
    const mesh = new THREE.Mesh(geo, mat);
    // mesh.rotation.y = Math.PI / 4; // xoay tòa nhà
    return mesh;
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
        left.position.set(leftOffset, 0, zPos);
        this.scene.add(left);
        segmentBuildings.push(left);

        const right = this.createBuildingById(id, w, d, h);
        if (id === 1) {
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
      case 5: return this.createBuilding_5(w, h);
      case 6: return this.createBuilding_6(w, d, h);
      default: return this.createBuilding_1(w, d, h); // fallback
    }
  }

  createClouds() {
    const cloudGroup = new THREE.Group();
    for (let i = 0; i < 5; i++) {
      const geometry = new THREE.SphereGeometry(Math.random() * 1 + 0.5, 16, 16);
      const material = new THREE.MeshBasicMaterial({ 
        color: 0xffffee,
        roughness: 1,
        metalness: 0
      });

      const puff = new THREE.Mesh(geometry, material);
      puff.castShadow = true;
      puff.receiveShadow = true;

      puff.position.set(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 1,
        (Math.random() - 0.5) * 1
      );

      cloudGroup.add(puff);
    }

    cloudGroup.position.set(0, 10, -10);
    this.scene.add(cloudGroup);
    return cloudGroup;
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

    // Move clouds 
    // for (const cloud of this.clouds) {
      
    // }
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