/* game_dino.js - 크롬 공룡 게임 로직 (v39) */
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
    isDucking: false // 숙이기 상태 추가
};

const obstacles = [];
let obstacleTimer = 0;
let gameSpeed = 5;

function startDino() {
    canvas = document.getElementById('dinoCanvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    
    document.getElementById('high-score').innerText = highScore;
    
    // 키보드 이벤트
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space' || e.code === 'ArrowUp') jump();
        if (e.code === 'ArrowDown') {
            dino.isDucking = true;
            if (!dino.grounded) dino.dy += 5; // 점프 중 아래 누르면 빠른 낙하
        }
    });
    window.addEventListener('keyup', (e) => {
        if (e.code === 'ArrowDown') dino.isDucking = false;
    });
    
    // 마우스 이벤트 (터치/클릭 점프)
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
    dino.isDucking = false;
    gameRunning = true;
    updateScore();
}

function jump() {
    if (dino.grounded && gameRunning && !dino.isDucking) {
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
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 190);
    ctx.lineTo(canvas.width, 190);
    ctx.stroke();

    // 숙이기 상태에 따른 물리적 높이 변경
    dino.height = dino.isDucking ? 20 : 40;

    // 공룡 물리 로직
    dino.dy += dino.gravity;
    dino.y += dino.dy;

    // 바닥 충돌 판정
    if (dino.y > 190 - dino.height) {
        dino.y = 190 - dino.height;
        dino.dy = 0;
        dino.grounded = true;
    }

    // 공룡 렌더링 (이모지 🦖 사용)
    ctx.save();
    ctx.font = '40px sans-serif';
    ctx.textBaseline = 'top';
    if (dino.isDucking) {
        // 숙일 때는 캔버스를 살짝 회전시켜서 엎드린 것처럼 표현
        ctx.translate(dino.x + 20, dino.y + 20);
        ctx.rotate(Math.PI / 4);
        ctx.fillText('🦖', -20, -20);
    } else {
        ctx.fillText('🦖', dino.x, dino.y);
    }
    ctx.restore();

    // 장애물 생성
    obstacleTimer++;
    if (obstacleTimer > 70 + Math.random() * 50) {
        let isOptionFlying = Math.random() < 0.3; // 30% 확률로 익룡
        
        if (isOptionFlying && score > 50) { // 점수가 50점 이상일 때부터 익룡 등장
            obstacles.push({
                type: 'bird',
                x: canvas.width,
                y: 120, // 높게 날아옴 (숙여야 피할 수 있음)
                width: 30,
                height: 30
            });
        } else {
            obstacles.push({
                type: 'cactus',
                x: canvas.width,
                y: 160, // 바닥 장애물
                width: 30,
                height: 30
            });
        }
        obstacleTimer = 0;
    }

    // 장애물 이동 및 렌더링
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.x -= gameSpeed;
        
        ctx.font = '30px sans-serif';
        ctx.textBaseline = 'top';
        if (obs.type === 'bird') {
            ctx.fillText('🦅', obs.x, obs.y);
        } else {
            ctx.fillText('🌵', obs.x, obs.y);
        }

        // 충돌 감지 (이모지 여백을 고려해 hit margin 적용)
        const hitMargin = 5;
        if (dino.x + hitMargin < obs.x + obs.width - hitMargin &&
            dino.x + dino.width - hitMargin > obs.x + hitMargin &&
            dino.y + hitMargin < obs.y + obs.height - hitMargin &&
            dino.y + dino.height - hitMargin > obs.y + hitMargin) {
            gameOver();
        }

        // 화면 밖으로 나간 장애물 제거 및 점수 획득
        if (obs.x + obs.width < 0) {
            obstacles.splice(i, 1);
            score += 10;
            updateScore();
            gameSpeed += 0.05; // 서서히 난이도 상승
        }
    }

    score += 0.1;
    updateScore();
    
    requestAnimationFrame(gameLoop);
}

function gameOver() {
    gameRunning = false;
    saveGameScore('dino', score); // 랭킹 저장
    
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#ffcc00';
    ctx.font = 'bold 30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2);
    
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('CLICK TO RESTART', canvas.width/2, canvas.height/2 + 40);
    
    canvas.onclick = () => {
        canvas.onclick = null;
        resetGame();
        gameLoop();
    };
}
