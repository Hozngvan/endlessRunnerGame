import * as THREE from "three";
import { Player } from "./player.js";
import { World } from "./world.js";
import { ObstacleManager } from "./obstacleManager.js";
import { UI } from "./ui.js";

export class Game {
  constructor(container) {
    this.container = container;
    this.speed = 15;
    this.baseSpeed = 15;
    this.speedIncrement = 0.005;
    this.score = 0;
    this.coinScore = 0;
    this.coinValue = 1;
    this.isGameOver = false;
    this.lanes = [-4, 0, 4];
    this.currentLane = 1;
    this.playerName = "";
    this.lastScoreUpdate = 0; // Theo dõi thời gian cập nhật điểm
    this.minScoreToUpdate = 0; // Điểm tối thiểu để cập nhật top 5
    this.isNight = false;
    this.lastLightingMilestone = 0;
    this.FirstCamera = false;
    this.cameraTransition = {
      inProgress: false,
      start: new THREE.Vector3(),
      end: new THREE.Vector3(),
      lookAt: new THREE.Vector3(0, 0, 0),
      progress: 0,
      duration: 1.0,
    };
    this.endgameAudio = new Audio("sound/complete.wav");
    this.runningAudio = new Audio("sound/Sakura-Girl-Daisy-chosic.mp3"); // Thêm dòng này
    this.runningAudio.loop = true; // Lặp liên tục

    window.addEventListener("keydown", (event) => {
      if (event.key === "c" || event.key === "C") {
        this.FirstCamera = !this.FirstCamera;
        console.log("FirstCamera is now:", this.FirstCamera);

        // if (!this.FirstCamera) {
        //   this.camera.position.set(0, 5, 10);
        //   this.camera.lookAt(0, 0, 0);
        // }

        // Gán vị trí bắt đầu
        this.cameraTransition.start.copy(this.camera.position);

        // Gán vị trí kết thúc tùy theo FirstCamera
        if (this.FirstCamera) {
          this.cameraTransition.end.set(
            this.player.position.x,
            2,
            this.player.position.z
          ); // Góc nhìn thứ nhất

          this.cameraTransition.lookAt.set(
            0,
            this.player.position.y,
            this.player.position.z - 10
          );
        } else {
          this.cameraTransition.end.set(0, 5, 10); // Góc nhìn thứ hai
          this.cameraTransition.lookAt.set(0, 0, -10);
        }

        this.cameraTransition.progress = 0;
        this.cameraTransition.inProgress = true;
      }
    });

    // Setup scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);

    // Setup camera
    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 5, 10);
    this.camera.lookAt(0, 0, 0);

    // Setup renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.container.appendChild(this.renderer.domElement);

    // Setup lighting
    this.setupLighting();
    this.setupNightLighting();
    this.hideNightLighting();

    // Initialize game components
    this.world = new World(this.scene);
    this.player = new Player(this.scene, this.lanes[this.currentLane]);
    this.obstacleManager = new ObstacleManager(this.scene, this.lanes);
    this.ui = new UI(this.container);

    // Setup controls
    this.setupControls();

    // Handle window resize
    window.addEventListener("resize", () => this.onWindowResize());

    // Fetch initial top scores
    this.fetchTopScores();
  }

  setupLighting() {
    this.dirLight = new THREE.DirectionalLight(0xffffff, 1);
    this.dirLight.position.set(10, 10, 10);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.camera.near = 0.1;
    this.dirLight.shadow.camera.far = 100;
    this.dirLight.shadow.camera.right = 20;
    this.dirLight.shadow.camera.left = -20;
    this.dirLight.shadow.camera.top = 20;
    this.dirLight.shadow.camera.bottom = -20;
    this.scene.add(this.dirLight);

    this.ambientLight1 = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(this.ambientLight1);
  }

  setupNightLighting() {
    // Màu nền đêm (xanh đen)
    this.scene.background = new THREE.Color(0x0a0a1a);

    // Đèn mặt trăng yếu (ánh sáng trắng xanh nhạt)
    this.moonLight = new THREE.DirectionalLight(0xaaaaff, 0.8);
    this.moonLight.position.set(0, 10, -50);
    this.moonLight.castShadow = true;
    this.moonLight.shadow.camera.near = 0.1;
    this.moonLight.shadow.camera.far = 100;
    this.moonLight.shadow.camera.right = 20;
    this.moonLight.shadow.camera.left = -20;
    this.moonLight.shadow.camera.top = 20;
    this.moonLight.shadow.camera.bottom = -20;
    this.moonLight.shadow.mapSize.set(2048, 2048);
    this.scene.add(this.moonLight);

    // Đèn môi trường rất nhẹ (gần như tối)
    this.ambientLight2 = new THREE.AmbientLight(0x222244, 0.1);
    this.scene.add(this.ambientLight2);
  }

  hideDayLighting() {
    if (this.dirLight) this.dirLight.visible = false;
    if (this.ambientLight1) this.ambientLight1.visible = false;
    if (this.scene.fog) {
      this.scene.fog.color.set(0x0a0a1a); // Màu sương mù đêm
    }
  }

  showDayLighting() {
    if (this.dirLight) this.dirLight.visible = true;
    if (this.ambientLight1) this.ambientLight1.visible = true;
    if (this.scene.fog) {
      this.scene.fog.color.set(0xbbbbbb); // Màu sương mù ban ngày
    }
  }

  hideNightLighting() {
    if (this.moonLight) this.moonLight.visible = false;
    if (this.ambientLight2) this.ambientLight2.visible = false;
    if (this.scene.fog) {
      this.scene.fog.color.set(0xbbbbbb); // Màu sương mù ban ngày
    }
  }

  showNightLighting() {
    if (this.moonLight) this.moonLight.visible = true;
    if (this.ambientLight2) this.ambientLight2.visible = true;
    if (this.scene.fog) {
      this.scene.fog.color.set(0x0a0a1a); // Màu sương mù đêm
    }
  }

  toggleLighting() {
    if (this.isNight) {
      this.hideNightLighting();
      this.showDayLighting();
      this.world.hideNightSkyBox();
      this.world.showDaySkyBox();
      this.isNight = false;
    } else {
      this.hideDayLighting();
      this.showNightLighting();
      this.world.hideDaySkyBox();
      this.world.showNightSkyBox();
      this.isNight = true;
    }
  }

  updateCamera() {
    this.camera.position.x = this.player.position.x;
    this.camera.position.y = this.player.position.y + 2;
    this.camera.position.z = this.player.position.z;
    this.camera.lookAt(
      this.player.position.x,
      this.player.position.y + 1.5,
      -2
    );
  }

  setupControls() {
    document.addEventListener("keydown", (e) => {
      if (this.isGameOver) return;
      switch (e.key) {
        case "ArrowLeft":
          this.moveLeft();
          break;
        case "ArrowRight":
          this.moveRight();
          break;
        case "ArrowUp":
        case " ":
          this.player.jump();
          break;
      }
    });

    let startX = 0;
    this.container.addEventListener("touchstart", (e) => {
      startX = e.touches[0].clientX;
    });

    this.container.addEventListener("touchend", (e) => {
      if (this.isGameOver) return;
      const endX = e.changedTouches[0].clientX;
      const diffX = endX - startX;
      if (Math.abs(diffX) > 50) {
        if (diffX > 0) {
          this.moveRight();
        } else {
          this.moveLeft();
        }
      } else {
        this.player.jump();
      }
    });
  }

  async fetchTopScores() {
    try {
      const response = await fetch("http://localhost:3000/scores/top5");
      const topScores = await response.json();
      this.ui.updateTopScores(topScores);
      this.minScoreToUpdate = topScores.length
        ? Math.min(...topScores.map((s) => s.score))
        : 0;
    } catch (err) {
      console.error("Failed to fetch top scores:", err);
      this.ui.updateTopScores([]);
    }
  }

  async saveTempScore() {
    try {
      await fetch("http://localhost:3000/scores/temp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: this.playerName,
          score: Math.floor(this.score),
          coin: this.coinScore,
        }),
      });
      await this.fetchTopScores();
    } catch (err) {
      console.error("Failed to save temporary score:", err);
    }
  }

  async saveScore() {
    try {
      await fetch("http://localhost:3000/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: this.playerName,
          score: Math.floor(this.score),
          coin: this.coinScore,
        }),
      });
      await this.fetchTopScores();
    } catch (err) {
      console.error("Failed to save score:", err);
    }
  }

  start() {
    this.ui.showNameInput((name, character) => {
      this.playerName = name;
      this.isGameOver = false;
      this.score = 0;
      this.coinScore = 0;
      this.speed = this.baseSpeed;
      this.currentLane = 1;
      this.player.moveTo(this.lanes[this.currentLane]);
      this.player.initializeCharacter(character);
      this.lastScoreUpdate = 0;
      this.minScoreToUpdate = 0;
      this.ui.updateScore(this.score);
      this.ui.updateCoinScore(this.coinScore);
      this.ui.hideGameOver();
      this.lastLightingMilestone = 0;
      // Setup lighting
      if (this.isNight) {
        this.toggleLighting();
      }
      this.fetchTopScores();
      this.animate();

      // Phát nhạc nền chạy khi bắt đầu game
      if (this.runningAudio) {
        this.runningAudio.currentTime = 0;
        this.runningAudio.play();
      }
    });
  }

  animate() {
    if (this.isGameOver) return;

    requestAnimationFrame(() => this.animate());

    const delta = 0.02;

    this.speed += this.speedIncrement;

    this.world.update(delta, this.speed);
    this.player.update(delta);
    this.obstacleManager.update(delta, this.speed);

    if (this.checkCollisions()) {
      this.gameOver();
      return;
    }

    this.checkCoinCollisions();
    this.checkShoeCollision();
    this.checkShieldCollision();

    this.score += this.speed * delta;
    this.ui.updateScore(Math.floor(this.score));
    this.ui.updateCoinScore(this.coinScore);

    // Cập nhật top 5 trong thời gian thực
    const currentTime = Date.now();
    if (
      this.score > this.minScoreToUpdate &&
      currentTime - this.lastScoreUpdate > 2000 // Cập nhật mỗi 2 giây
    ) {
      this.lastScoreUpdate = currentTime;
      this.saveTempScore();
    }

    // Switch Day - Night
    const milestone = Math.floor(this.score / 1000);
    if (milestone > this.lastLightingMilestone) {
      this.lastLightingMilestone = milestone;
      this.toggleLighting();
    }

    if (this.FirstCamera == true) {
      this.updateCamera();
    }

    // Nếu đang chuyển góc nhìn
    if (this.cameraTransition.inProgress) {
      this.cameraTransition.progress += delta / this.cameraTransition.duration;

      const t = Math.min(this.cameraTransition.progress, 1); // clamp 0 → 1

      // Nội suy vị trí
      this.camera.position.lerpVectors(
        this.cameraTransition.start,
        this.cameraTransition.end,
        t
      );

      // Cập nhật hướng nhìn
      this.camera.lookAt(this.cameraTransition.lookAt);

      // Kết thúc quá trình nếu hoàn tất
      if (t >= 1) {
        this.cameraTransition.inProgress = false;
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  checkCollisions() {
    if (this.player.isShieldActive()) return false;
    return this.obstacleManager.checkCollision(
      this.player.position,
      this.player.isJumping
    );
  }

  checkCoinCollisions() {
    const coinsCollected = this.obstacleManager.checkCoinCollision(
      this.player.position
    );
    if (coinsCollected > 0) {
      this.coinScore += coinsCollected * this.coinValue;
    }
    return coinsCollected;
  }

  checkShoeCollision() {
    const collision = this.obstacleManager.checkShoeCollision(
      this.player.position,
      this.player.isJumping
    );

    if (collision) {
      this.player.activateJumpBoost();
      // console.log("Collision detected!");
    } else {
      // console.log("No collision.");
    }
  }

  checkShieldCollision() {
    const collision = this.obstacleManager.checkShieldCollision(
      this.player.position,
      this.player.isJumping
    );

    if (collision) {
      this.player.activateShield();
      // console.log("Shield activated!");
    } else {
      // console.log("No shield collision.");
    }
  }

  gameOver() {
    this.isGameOver = true;

    // Dừng nhạc nền chạy khi game over
    if (this.runningAudio) {
      this.runningAudio.pause();
      this.runningAudio.currentTime = 0;
    }

    // Phát âm thanh endgame ngay khi game over
    if (this.endgameAudio) {
      this.endgameAudio.currentTime = 0;
      this.endgameAudio.play();
    }

    this.saveScore().then(() => {
      this.ui.showGameOver(
        Math.floor(this.score),
        this.coinScore,
        this.getTopScores()
      );
    });

    window.addEventListener("gameOverShown", () => {
      const restartButton = document.querySelector("#restartButton");
      if (restartButton) {
        restartButton.onclick = () => {
          this.resetGame();
        };

        // Thêm sự kiện phím Enter để restart
        const handleEnterRestart = (e) => {
          if (e.key === "Enter") {
            this.resetGame();
            window.removeEventListener("keydown", handleEnterRestart);
          }
        };
        window.addEventListener("keydown", handleEnterRestart);
      }
    });
  }

  async getTopScores() {
    try {
      const response = await fetch("http://localhost:3000/scores/top5");
      return await response.json();
    } catch (err) {
      console.error("Failed to fetch top scores:", err);
      return [];
    }
  }

  moveLeft() {
    if (this.currentLane > 0) {
      this.currentLane--;
      this.player.moveTo(this.lanes[this.currentLane]);
    }
  }

  moveRight() {
    if (this.currentLane < this.lanes.length - 1) {
      this.currentLane++;
      this.player.moveTo(this.lanes[this.currentLane]);
    }
  }

  resetGame() {
    this.obstacleManager.reset();
    this.player.reset();
    this.world.reset();
    this.start();
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}
