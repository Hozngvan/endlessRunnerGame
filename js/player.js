
import * as THREE from 'three';

export class Player {
  constructor(scene, initialX) {
    this.scene = scene;
    this.position = new THREE.Vector3(initialX, 0.5, 0);
    this.targetX = initialX; // Làn chạy 
    this.isJumping = false;
    this.jumpHeight = 2.1;
    this.boostedJumpHeight = 4.0;
    this.gravity = 30;
    this.jumpSpeed = 10;
    this.verticalVelocity = 0; // Speed 
    this.jumpBoostActive = false; // Trạng thái tăng cường nhảy
    this.boostDuration = 3; // Thời gian hiệu lực (giây)
    this.boostTimer = 0; // Bộ đếm thời gian
    this.legGroupLeft = new THREE.Group();
    this.legGroupRight = new THREE.Group();
    
    // Create player mesh (simple for now)
    this.createPlayerMesh();
    this.createPlayerLight();
  }
  
  createPlayerLight() {
    this.playerLight = new THREE.PointLight(0xffffaa, 1, 15);
    this.playerLight.position.set(
      this.position.x,
      this.position.y + 1.5,
      this.position.z + 2
    );
    this.scene.add(this.playerLight);
  }

  createPlayerMesh() {
    // Player body chicken
    // const bodyGeometry = new THREE.BoxGeometry(1, 1, 1);
    // const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x3498db });
    // this.mesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    // this.mesh.position.copy(this.position);
    // this.mesh.castShadow = true;
    // this.scene.add(this.mesh);

    this.mesh = new THREE.Group(); // Nhóm toàn bộ con gà
    this.mesh.position.copy(this.position);

    const white = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const orange = new THREE.MeshLambertMaterial({ color: 0xffa500 });
    const red = new THREE.MeshLambertMaterial({ color: 0xff0000 });
    const yellow = new THREE.MeshLambertMaterial({ color: 0xffff00 });

    // Thân
    const body = new THREE.Mesh(new THREE.BoxGeometry(1, 0.6, 1), white);
    body.position.set(0, 0.4, 0);
    body.castShadow = true;
    body.receiveShadow = true;
    this.mesh.add(body);

    // Cổ
    const neck = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.3), white);
    neck.position.set(0, 0.8, 0);
    neck.castShadow = true;
    neck.receiveShadow = true;
    this.mesh.add(neck);

    // Đầu
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.6), white);
    head.position.set(0, 1.1, 0);
    head.castShadow = true;
    head.receiveShadow = true;
    this.mesh.add(head);

    // Mào (3 khối đỏ trên đầu)
    for (let i = 0; i < 3; i++) {
      const comb = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.2, 0.15), red);
      comb.position.set(-0.15 + i * 0.15, 1.4, 0);
      comb.castShadow = true;
      comb.receiveShadow = true;
      this.mesh.add(comb);
    }

    // Mắt (2 khối đen)
    const eyeOffsetX = [-0.15, 0.15];
    const eyeOffsetY = [0.1, 0.1];
    const eyeOffsetZ = [0.2, 0.2];
    for (let i = 0; i < 2; i++) {
      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), new THREE.MeshLambertMaterial({ color: 0x000000 }));
      eye.position.set(eyeOffsetX[i], eyeOffsetY[i] + 1.1, eyeOffsetZ[i]-0.5);
      eye.castShadow = true;
      eye.receiveShadow = true;
      this.mesh.add(eye);
    }

    // Group legs and toes 
    this.legGroupLeft.position.set(0, 0, 0);
    this.legGroupRight.position.set(0, 0, 0);

    // 2 chân (màu vàng)
    const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.8, 0.2), yellow);
    const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.8, 0.2), yellow);
    leftLeg.position.set(-0.25, 0, 0.2);
    rightLeg.position.set(0.25, 0, 0.2);
    leftLeg.castShadow = true;
    rightLeg.castShadow = true;
    this.legGroupLeft.add(leftLeg); 
    this.legGroupRight.add(rightLeg);     

    // 6 ngón chân (3 mỗi chân) — màu cam
    const toeOffsetX = [-0.1, 0, 0.1];
    for (let i = 0; i < 3; i++) {
      const leftToe = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 0.3), orange);
      leftToe.position.set(-0.25 + toeOffsetX[i], -0.38, 0.18);
      leftToe.castShadow = true;
      this.legGroupLeft.add(leftToe);

      const rightToe = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 0.3), orange);
      rightToe.position.set(0.25 + toeOffsetX[i], -0.38, 0.18);
      rightToe.castShadow = true;
      this.legGroupRight.add(rightToe);
    } 
    // this.legGroupLeft.position.set(0, 0, -2);
    // this.legGroupRight.position.set(0, 0, -2);

    // Add legs to the main mesh
    this.mesh.add(this.legGroupRight, this.legGroupLeft);
    this.scene.add(this.mesh);
  }
  
  activateJumpBoost() {
    this.jumpBoostActive = true;
    this.boostTimer = this.boostDuration;
  }

  update(delta) {
    // Handle jumping
    if (this.isJumping) {
      this.position.y += this.verticalVelocity * delta;
      this.verticalVelocity -= this.gravity * delta;

      if (this.position.y <= 0.5) {
        this.position.y = 0.5;
        this.isJumping = false;
        this.verticalVelocity = 0;
      }
    }
    
    // Giảm bộ đếm thời gian tăng cường nhảy
    if (this.jumpBoostActive) {
      console.log("Jump boost active");
      this.boostTimer -= delta;
      if (this.boostTimer <= 0) {
        this.jumpBoostActive = false;
        
      }
    }

    // Legs animation when running 
    const time = Date.now() * 0.01;
    const legSwing = Math.sin(time);

    this.legGroupLeft.rotation.x = legSwing; // Left leg
    this.legGroupRight.rotation.x = -legSwing; // Left leg

    // Handle lane movement (lerp to target position)
    this.position.x += (this.targetX - this.position.x) * 10 * delta;
    
    // Update mesh position
    this.mesh.position.copy(this.position);

    this.playerLight.position.set(this.position.x, this.position.y + 1.5, this.position.z + 2);
  }
  
  jump() {
    if (!this.isJumping) {
      this.isJumping = true;
      const currentJumpHeight = this.jumpBoostActive
        ? this.boostedJumpHeight
        : this.jumpHeight;
      this.verticalVelocity = Math.sqrt(2 * this.gravity * currentJumpHeight);
    }
  }
  
  moveTo(x) {
    this.targetX = x;
  }
  
  reset() {
    this.position.set(0, 0.5, 0);
    this.targetX = 0;
    this.isJumping = false;
    this.verticalVelocity = 0;
    this.jumpBoostActive = false;
    this.boostTimer = 0;
    this.mesh.position.copy(this.position);
  }
}