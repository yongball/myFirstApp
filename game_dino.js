/* game_dino.js - 크롬 공룡 게임 로직 */
let canvas, ctx;
let gameRunning = false;
let score = 0;
let highScore = localStorage.getItem('dinoHighScore') || 0;

const dino = {
    x: 50,
    y: 150,
    width: 40,
    height: 40,
    dy: 0,
    jumpForce: 12,
    gravity: 0.6,
    grounded: true,
    color: '#39ff14' // 네온 그린 공룡
};

const obstacles = [];
let obstacleTimer = 0;
let gameSpeed = 5;

function startDino() {
    canvas = document.getElementById('dinoCanvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    
    document.getElementById('high-score').innerText = highScore;
    
    // 키 입력 및 터치/클릭 이벤트
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space') jump();
    });
    canvas.addEventListener('mousedown', jump);
    
    resetGame();
    gameLoop();
}

function resetGame() {
    score = 0;
    obstacles.length = 0;
    obstacleTimer = 0;
    gameSpeed = 5;
    dino.y = 150;
    dino.dy = 0;
    gameRunning = true;
    updateScore();
}

function jump() {
    if (dino.grounded && gameRunning) {
        dino.dy = -dino.jumpForce;
        dino.grounded = false;
    }
}

function updateScore() {
    document.getElementById('game-score').innerText = Math.floor(score);
    if (score > highScore) {
        highScore = Math.floor(score);
        document.getElementById('high-score').innerText = highScore;
        localStorage.setItem('dinoHighScore', highScore);
    }
}

function gameLoop() {
    if (!gameRunning) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 바닥 그리기
    ctx.strokeStyle = '#555';
    ctx.beginPath();
    ctx.moveTo(0, 190);
    ctx.lineTo(canvas.width, 190);
    ctx.stroke();

    // 공룡 물리 로직
    dino.dy += dino.gravity;
    dino.y += dino.dy;

    if (dino.y > 150) {
        dino.y = 150;
        dino.dy = 0;
        dino.grounded = true;
    }

    // 공룡 그리기 (픽셀 스타일 사각형)
    ctx.fillStyle = dino.color;
    ctx.fillRect(dino.x, dino.y, dino.width, dino.height);
    // 공룡 눈
    ctx.fillStyle = '#000';
    ctx.fillRect(dino.x + 25, dino.y + 10, 5, 5);

    // 장애물 생성
    obstacleTimer++;
    if (obstacleTimer > 70 + Math.random() * 50) {
        obstacles.push({
            x: canvas.width,
            y: 150,
            width: 20 + Math.random() * 20,
            height: 30 + Math.random() * 20,
            color: '#ff0000'
        });
        obstacleTimer = 0;
    }

    // 장애물 이동 및 그리기
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.x -= gameSpeed;
        
        ctx.fillStyle = obs.color;
        ctx.fillRect(obs.x, obs.y + (40 - obs.height), obs.width, obs.height);

        // 충돌 감지
        if (dino.x < obs.x + obs.width &&
            dino.x + dino.width > obs.x &&
            dino.y < obs.y + 40 &&
            dino.y + dino.height > obs.y + (40 - obs.height)) {
            gameOver();
        }

        // 화면 밖으로 나간 장애물 제거
        if (obs.x + obs.width < 0) {
            obstacles.splice(i, 1);
            score += 10;
            updateScore();
            gameSpeed += 0.1; // 난이도 상승
        }
    }

    score += 0.1;
    updateScore();
    
    requestAnimationFrame(gameLoop);
}

function gameOver() {
    gameRunning = false;
    saveGameScore('dino', score); // 랭킹 저장 (v35)
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#fff';
    ctx.font = '30px NeoDunggeunmo';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2);
    ctx.font = '20px NeoDunggeunmo';
    ctx.fillText('CLICK TO RESTART', canvas.width/2, canvas.height/2 + 40);
    
    canvas.onclick = () => {
        canvas.onclick = null;
        resetGame();
        gameLoop();
    };
}
