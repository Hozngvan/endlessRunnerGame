export class UI {
  constructor(container) {
    this.container = container;
    this.createUI();
  }

  createUI() {
    // Score element
    this.scoreElement = document.createElement("div");
    this.scoreElement.style.position = "absolute";
    this.scoreElement.style.top = "20px";
    this.scoreElement.style.left = "20px";
    this.scoreElement.style.color = "white";
    this.scoreElement.style.fontSize = "24px";
    this.scoreElement.style.fontFamily = "Arial, sans-serif";
    this.scoreElement.style.textShadow = "2px 2px 4px rgba(0, 0, 0, 0.5)";
    this.container.appendChild(this.scoreElement);

    // Coin score element
    this.coinScoreElement = document.createElement("div");
    this.coinScoreElement.style.position = "absolute";
    this.coinScoreElement.style.top = "60px";
    this.coinScoreElement.style.left = "20px";
    this.coinScoreElement.style.color = "yellow";
    this.coinScoreElement.style.fontSize = "20px";
    this.coinScoreElement.style.fontFamily = "Arial, sans-serif";
    this.coinScoreElement.style.textShadow = "2px 2px 4px rgba(0, 0, 0, 0.5)";
    this.container.appendChild(this.coinScoreElement);

    // Top 5 scores element
    this.topScoresElement = document.createElement("div");
    this.topScoresElement.style.position = "absolute";
    this.topScoresElement.style.bottom = "60px";
    this.topScoresElement.style.left = "20px";
    this.topScoresElement.style.color = "white";
    this.topScoresElement.style.fontSize = "18px";
    this.topScoresElement.style.fontFamily = "Arial, sans-serif";
    this.topScoresElement.style.textShadow = "2px 2px 4px rgba(0, 0, 0, 0.5)";
    this.container.appendChild(this.topScoresElement);

    // Game over element
    this.gameOverElement = document.createElement("div");
    this.gameOverElement.style.position = "absolute";
    this.gameOverElement.style.top = "50%";
    this.gameOverElement.style.left = "50%";
    this.gameOverElement.style.transform = "translate(-50%, -50%)";
    this.gameOverElement.style.color = "white";
    this.gameOverElement.style.fontSize = "36px";
    this.gameOverElement.style.fontFamily = "Arial, sans-serif";
    this.gameOverElement.style.textAlign = "center";
    this.gameOverElement.style.textShadow = "2px 2px 4px rgba(0, 0, 0, 0.5)";
    this.gameOverElement.style.display = "none";
    this.container.appendChild(this.gameOverElement);

    // Name input form
    this.nameInputElement = document.createElement("div");
    this.nameInputElement.style.position = "absolute";
    this.nameInputElement.style.top = "50%";
    this.nameInputElement.style.left = "50%";
    this.nameInputElement.style.transform = "translate(-50%, -50%)";
    this.nameInputElement.style.color = "white";
    this.nameInputElement.style.fontFamily = "Arial, sans-serif";
    this.nameInputElement.style.textAlign = "center";
    this.nameInputElement.style.display = "none";
    this.nameInputElement.innerHTML = `
      <div style="background: rgba(0, 0, 0, 0.7); padding: 20px; border-radius: 10px;">
        <h2>Enter Your Name</h2>
        <input type="text" id="playerName" style="padding: 10px; font-size: 16px;" placeholder="Your name" />
        <br>
        <button id="startGame" style="padding: 10px 20px; font-size: 16px; margin-top: 10px;">Start</button>
      </div>
    `;
    this.container.appendChild(this.nameInputElement);

    // Controls hint
    this.controlsElement = document.createElement("div");
    this.controlsElement.style.position = "absolute";
    this.controlsElement.style.bottom = "20px";
    this.controlsElement.style.right = "20px";
    this.controlsElement.style.color = "white";
    this.controlsElement.style.fontSize = "16px";
    this.controlsElement.style.fontFamily = "Arial, sans-serif";
    this.controlsElement.style.textAlign = "right";
    this.controlsElement.style.textShadow = "2px 2px 4px rgba(0, 0, 0, 0.5)";
    this.controlsElement.innerHTML =
      "Arrow Left/Right: Move<br>Arrow Up/Space: Jump";
    this.container.appendChild(this.controlsElement);
  }

  showNameInput(callback) {
    this.nameInputElement.style.display = "block";
    const startButton = this.nameInputElement.querySelector("#startGame");
    const playerNameInput = this.nameInputElement.querySelector("#playerName");
    startButton.onclick = () => {
      const name = playerNameInput.value.trim();
      if (name) {
        this.nameInputElement.style.display = "none";
        callback(name);
      } else {
        alert("Please enter a name!");
      }
    };
  }

  updateScore(score) {
    this.scoreElement.textContent = `Score: ${score}`;
  }

  updateCoinScore(coinScore) {
    this.coinScoreElement.textContent = `Coins: ${coinScore}`;
  }

  updateTopScores(topScores) {
    this.topScoresElement.innerHTML = `
      Top 5 Players<br>
      ${
        topScores.length
          ? topScores
              .map(
                (entry, index) =>
                  `${index + 1}. ${entry.name}: ${entry.score} (Coins: ${
                    entry.coin
                  })`
              )
              .join("<br>")
          : "No scores yet"
      }
    `;
  }

  showGameOver(finalScore, finalCoinScore, topScores) {
    this.gameOverElement.innerHTML = `
      Game Over<br>
      Final Score: ${finalScore}<br>
      Coins Collected: ${finalCoinScore}<br>
      <br>
      <button id="restartButton" style="padding: 10px 20px; font-size: 18px; margin-top: 20px;">Restart</button>
    `;
    this.gameOverElement.style.display = "block";
  }

  hideGameOver() {
    this.gameOverElement.style.display = "none";
  }
}
