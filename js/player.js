
import * as THREE from 'three';

export class Player {
  constructor(scene, initialX) {
    this.scene = scene;
    this.position = new THREE.Vector3(initialX, 0.5, 0);
    this.targetX = initialX; // Làn chạy 
    this.isJumping = false;
    this.jumpHeight = 3;
    this.jumpSpeed = 8;
    this.verticalVelocity = 0; // Speed 
    
    // Create player mesh (simple for now)
    this.createPlayerMesh();
  }
  
  createPlayerMesh() {
    // Player body
    const bodyGeometry = new THREE.BoxGeometry(1, 2, 1);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x3498db });
    this.mesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.mesh.position.copy(this.position);
    this.mesh.castShadow = true;
    this.scene.add(this.mesh);
  }
  
  update(delta) {
    // Handle jumping
    if (this.isJumping) {
      this.position.y += this.verticalVelocity * delta;
      this.verticalVelocity -= 20 * delta; // Gravity
      
      if (this.position.y <= 0.5) {
        this.position.y = 0.5;
        this.isJumping = false;
        this.verticalVelocity = 0;
      }
    }
    
    // Handle lane movement (lerp to target position)
    this.position.x += (this.targetX - this.position.x) * 10 * delta;
    
    // Update mesh position
    this.mesh.position.copy(this.position);
  }
  
  jump() {
    if (!this.isJumping) {
      this.isJumping = true;
      this.verticalVelocity = this.jumpSpeed;
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
    this.mesh.position.copy(this.position);
  }
}