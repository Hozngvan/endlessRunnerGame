
export class UI {
  constructor(container) {
    this.container = container;
    this.createUI();
  }
  
  createUI() {
    // Score element
    this.scoreElement = document.createElement('div');
    this.scoreElement.style.position = 'absolute';
    this.scoreElement.style.top = '20px';
    this.scoreElement.style.left = '20px';
    this.scoreElement.style.color = 'white';
    this.scoreElement.style.fontSize = '24px';
    this.scoreElement.style.fontFamily = 'Arial, sans-serif';
    this.scoreElement.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.5)';
    this.container.appendChild(this.scoreElement);
    
    // Coin score element
    this.coinScoreElement = document.createElement('div');
    this.coinScoreElement.style.position = 'absolute';
    this.coinScoreElement.style.top = '60px'; // Dưới điểm số chính
    this.coinScoreElement.style.left = '20px';
    this.coinScoreElement.style.color = 'yellow';
    this.coinScoreElement.style.fontSize = '20px';
    this.coinScoreElement.style.fontFamily = 'Arial, sans-serif';
    this.coinScoreElement.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.5)';
    this.container.appendChild(this.coinScoreElement);
    // Game over element
    this.gameOverElement = document.createElement('div');
    this.gameOverElement.style.position = 'absolute';
    this.gameOverElement.style.top = '50%';
    this.gameOverElement.style.left = '50%';
    this.gameOverElement.style.transform = 'translate(-50%, -50%)';
    this.gameOverElement.style.color = 'white';
    this.gameOverElement.style.fontSize = '36px';
    this.gameOverElement.style.fontFamily = 'Arial, sans-serif';
    this.gameOverElement.style.textAlign = 'center';
    this.gameOverElement.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.5)';
    this.gameOverElement.style.display = 'none';
    this.container.appendChild(this.gameOverElement);
    
    // Controls hint
    this.controlsElement = document.createElement('div');
    this.controlsElement.style.position = 'absolute';
    this.controlsElement.style.bottom = '20px';
    this.controlsElement.style.right = '20px';
    this.controlsElement.style.color = 'white';
    this.controlsElement.style.fontSize = '16px';
    this.controlsElement.style.fontFamily = 'Arial, sans-serif';
    this.controlsElement.style.textAlign = 'right';
    this.controlsElement.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.5)';
    this.controlsElement.innerHTML = 'Arrow Left/Right: Move<br>Arrow Up/Space: Jump';
    this.container.appendChild(this.controlsElement);
  }
  
  updateScore(score) {
    this.scoreElement.textContent = `Score: ${score}`;
  }
  
  updateCoinScore(coinScore) {
    // console.log('Coin score:', coinScore);
    this.coinScoreElement.textContent = `Coins: ${coinScore}`;
  }

  showGameOver(finalScore, finalCoinScore) {
    this.gameOverElement.innerHTML = `
      Game Over<br>
      Final Score: ${finalScore}<br>
      Coins Collected: ${finalCoinScore}<br>
      <span style="font-size: 18px">Click or Press Any Key to Restart</span>
    `;
    this.gameOverElement.style.display = 'block';
  }
  
  hideGameOver() {
    this.gameOverElement.style.display = 'none';
  }
}
