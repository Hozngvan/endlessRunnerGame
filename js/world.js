import * as THREE from 'three';

export class World {
  constructor(scene) {
    this.scene = scene;
    this.roadLength = 50;
    this.roadWidth = 15;
    
    this.createGround();
    this.createSkyBox();
    this.createRoadSegments();
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
    
    // Create the road
    const roadGeometry = new THREE.PlaneGeometry(this.roadWidth, this.roadLength);
    const roadMaterial = new THREE.MeshLambertMaterial({ color: 0x404040 });
    
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
  }
  
  update(delta, speed) {
    // Move road segments
    for (const segment of this.roadSegments) {
      segment.position.z += speed * delta;
      
      // If a segment goes behind the camera, move it to the front
      if (segment.position.z > this.roadLength / 2) {
        segment.position.z -= this.roadLength * this.roadSegments.length;
      }
    }
    
    // Move lane lines
    for (const line of this.laneLines) {
      line.mesh.position.z += speed * delta;
      
      // Reset position if beyond camera
      if (line.mesh.position.z > this.roadLength / 2) {
        line.mesh.position.z -= this.roadLength * (this.laneLines.length / 2);
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