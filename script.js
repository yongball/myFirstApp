function navigateTo(url) {
    window.location.href = url;
}

function handleSignup(event) {
    event.preventDefault(); // 폼 제출 시 페이지 새로고침 방지

    // 입력된 각 항목의 데이터 가져오기
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;

    // 비밀번호 확인 체크
    if (password !== passwordConfirm) {
        alert('비밀번호가 일치하지 않습니다.');
        return;
    }

    // 사용자 객체 생성
    const userData = {
        name: name,
        email: email,
        password: password,
        createdAt: new Date().toISOString()
    };

    // 기존 사용자 목록 가져오기 (없으면 빈 배열)
    const users = JSON.parse(localStorage.getItem('users') || '[]');

    // 이메일 중복 체크
    if (users.some(user => user.email === email)) {
        alert('이미 가입된 이메일입니다.');
        return;
    }

    // 새로운 사용자 추가 및 저장
    users.push(userData);
    localStorage.setItem('users', JSON.stringify(users));

    alert('회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.');
    navigateTo('index.html');
}

function handleLogin() {
    const emailInput = document.getElementById('email').value;
    const passwordInput = document.getElementById('password').value;

    // 기존 사용자 목록 가져오기 (없으면 빈 배열)
    const users = JSON.parse(localStorage.getItem('users') || '[]');

    // 입력된 이메일과 비밀번호가 일치하는 사용자 찾기
    const user = users.find(u => u.email === emailInput && u.password === passwordInput);

    if (user) {
        // 대시보드 표시를 위해 로그인된 유저의 이름 임시 저장
        localStorage.setItem('name', user.name);
        // 로그인 성공 시 대시보드로 이동
        window.location.href = 'dashboard.html';
    } else {
        alert('이메일 또는 비밀번호가 일치하지 않습니다.');
    }
}

function handleGuestLogin() {
    // 게스트용 임시 이름 저장
    localStorage.setItem('name', '게스트');
    // 로그인 성공 시 대시보드로 이동
    window.location.href = 'dashboard.html';
}

function handleLogout() {
    // 로그아웃 시 로그인 상태(이름) 삭제
    localStorage.removeItem('name');
    // 로그아웃 시 로그인 페이지로 이동
    window.location.replace('index.html');
}

function showItemInfo(item) {
    const modal = document.getElementById('item-modal');
    const nameEl = document.getElementById('modal-item-name');
    const descEl = document.getElementById('modal-item-desc');
    
    const items = {
        'sword': { name: '낡은 검', desc: '초보 용사의 낡은 검. 녹이 슬었지만 아직 날카롭다.' },
        'shield': { name: '나무 방패', desc: '튼튼한 나무 방패. 웬만한 공격은 막아낼 수 있다.' },
        'potion': { name: '빨간 물약', desc: '신비로운 물약. 마시면 체력이 솟구친다!' },
        'gold': { name: '금화', desc: '반짝이는 금화. 시장에서 맛있는 걸 살 수 있다.' }
    };

    if (items[item]) {
        nameEl.innerText = `[ ${items[item].name} ]`;
        descEl.innerText = items[item].desc;
        modal.style.display = 'flex';
    }
}

function closeItemInfo() {
    const modal = document.getElementById('item-modal');
    modal.style.display = 'none';
}

/* 게임 선택 메뉴 제어 */
function openGameSelect() {
    document.getElementById('game-select-modal').style.display = 'flex';
}

function closeGameSelect() {
    document.getElementById('game-select-modal').style.display = 'none';
}

/* 미니 게임 (Tetris) 로직 */
let tetrisActive = false;
let tetrisGrid = [];
const TETRIS_ROWS = 20;
const TETRIS_COLS = 10;
const BLOCK_SIZE = 20;
let currentPiece = null;

const SHAPES = {
    'I': [[1, 1, 1, 1]],
    'J': [[1, 0, 0], [1, 1, 1]],
    'L': [[0, 0, 1], [1, 1, 1]],
    'O': [[1, 1], [1, 1]],
    'S': [[0, 1, 1], [1, 1, 0]],
    'T': [[0, 1, 0], [1, 1, 1]],
    'Z': [[1, 1, 0], [0, 1, 1]]
};

const SHAPE_COLORS = {
    'I': '#00ffff', 'J': '#0000ff', 'L': '#ffaa00',
    'O': '#ffff00', 'S': '#00ff00', 'T': '#aa00ff', 'Z': '#ff0000'
};

function startTetris() {
    tetrisActive = true;
    score = 0;
    tetrisGrid = Array.from({ length: TETRIS_ROWS }, () => Array(TETRIS_COLS).fill(0));
    spawnPiece();
    
    canvas = document.getElementById('tetrisCanvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    
    document.addEventListener('keydown', handleTetrisInput);
    tetrisLoop();
}

function spawnPiece() {
    const types = Object.keys(SHAPES);
    const type = types[Math.floor(Math.random() * types.length)];
    currentPiece = {
        type: type,
        shape: SHAPES[type],
        x: Math.floor(TETRIS_COLS / 2) - 1,
        y: 0,
        color: SHAPE_COLORS[type]
    };
    if (checkCollision(0, 0, currentPiece.shape)) {
        alert("GAME OVER! SCORE: " + score);
        tetrisActive = false;
        navigateTo('dashboard.html');
    }
}

function handleTetrisInput(e) {
    if (!tetrisActive) return;
    if (e.key === 'ArrowLeft') movePiece(-1, 0);
    if (e.key === 'ArrowRight') movePiece(1, 0);
    if (e.key === 'ArrowDown') movePiece(0, 1);
    if (e.key === 'ArrowUp') rotatePiece();
}

function movePiece(dx, dy) {
    if (!checkCollision(dx, dy, currentPiece.shape)) {
        currentPiece.x += dx;
        currentPiece.y += dy;
        return true;
    }
    if (dy > 0) {
        lockPiece();
        checkLines();
        spawnPiece();
    }
    return false;
}

function rotatePiece() {
    const rotated = currentPiece.shape[0].map((_, i) => currentPiece.shape.map(row => row[i]).reverse());
    if (!checkCollision(0, 0, rotated)) {
        currentPiece.shape = rotated;
    }
}

function checkCollision(dx, dy, shape) {
    for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
            if (shape[r][c]) {
                let nextX = currentPiece.x + c + dx;
                let nextY = currentPiece.y + r + dy;
                if (nextX < 0 || nextX >= TETRIS_COLS || nextY >= TETRIS_ROWS || (nextY >= 0 && tetrisGrid[nextY][nextX])) {
                    return true;
                }
            }
        }
    }
    return false;
}

function lockPiece() {
    currentPiece.shape.forEach((row, r) => {
        row.forEach((val, c) => {
            if (val) {
                const y = currentPiece.y + r;
                const x = currentPiece.x + c;
                if (y >= 0) tetrisGrid[y][x] = currentPiece.color;
            }
        });
    });
}

function checkLines() {
    let linesCleared = 0;
    for (let r = TETRIS_ROWS - 1; r >= 0; r--) {
        if (tetrisGrid[r].every(cell => cell !== 0)) {
            tetrisGrid.splice(r, 1);
            tetrisGrid.unshift(Array(TETRIS_COLS).fill(0));
            linesCleared++;
            r++;
        }
    }
    if (linesCleared > 0) {
        score += [0, 100, 300, 500, 800][linesCleared];
        document.getElementById('game-score').innerText = 'SCORE: ' + score;
    }
}

let lastDropTime = 0;
function tetrisLoop(timestamp = 0) {
    if (!tetrisActive) return;
    
    const deltaTime = timestamp - lastDropTime;
    if (deltaTime > 800) {
        movePiece(0, 1);
        lastDropTime = timestamp;
    }
    
    drawTetris();
    animationId = requestAnimationFrame(tetrisLoop);
}

function drawTetris() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 격자 그리기
    ctx.strokeStyle = '#111';
    for(let i=0; i<=TETRIS_COLS; i++) {
        ctx.beginPath(); ctx.moveTo(i*BLOCK_SIZE, 0); ctx.lineTo(i*BLOCK_SIZE, canvas.height); ctx.stroke();
    }
    for(let i=0; i<=TETRIS_ROWS; i++) {
        ctx.beginPath(); ctx.moveTo(0, i*BLOCK_SIZE); ctx.lineTo(canvas.width, i*BLOCK_SIZE); ctx.stroke();
    }

    // 쌓인 블록
    tetrisGrid.forEach((row, r) => {
        row.forEach((color, c) => {
            if (color) drawBlock(c, r, color);
        });
    });
    
    // 현재 블록
    if (currentPiece) {
        currentPiece.shape.forEach((row, r) => {
            row.forEach((val, c) => {
                if (val) drawBlock(currentPiece.x + c, currentPiece.y + r, currentPiece.color);
            });
        });
    }
}

function drawBlock(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
}

function stopTetris() {
    tetrisActive = false;
    cancelAnimationFrame(animationId);
    document.removeEventListener('keydown', handleTetrisInput);
}



/* 미니 게임 (Puzzle Bobble 스타일 고도화) 로직 */
let gameActive = false;
let score = 0;
let animationId;
let canvas, ctx;

const BUBBLE_RADIUS = 16;
const COLS = 10;
const COLORS = ['#39ff14', '#ff00ff', '#00ffff', '#ffff00', '#ff0000'];
let grid = []; 
let shootingBubble = null;
let nextColor = COLORS[0];
let mousePos = { x: 150, y: 0 };
let particles = [];

function startGame() {
    gameActive = true;
    score = 0;
    grid = [];
    particles = [];
    shootingBubble = null;
    
    document.getElementById('game-modal').style.display = 'flex';
    const scoreEl = document.getElementById('game-score');
    if (scoreEl) scoreEl.innerText = 'SCORE: 0';
    
    canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    
    // 초기 지그재그 그리드 생성 (8줄)
    for(let r = 0; r < 8; r++) {
        grid[r] = [];
        for(let c = 0; c < COLS; c++) {
            grid[r][c] = COLORS[Math.floor(Math.random() * COLORS.length)];
        }
    }
    
    nextColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    
    canvas.onmousemove = (e) => {
        const rect = canvas.getBoundingClientRect();
        mousePos.x = e.clientX - rect.left;
        mousePos.y = e.clientY - rect.top;
    };
    
    canvas.onclick = () => {
        if (shootingBubble) return;
        const angle = Math.atan2(mousePos.y - (canvas.height - 25), mousePos.x - 160);
        shootingBubble = {
            x: 160, y: canvas.height - 25,
            vx: Math.cos(angle) * 10,
            vy: Math.sin(angle) * 10,
            color: nextColor
        };
        nextColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    };
    
    gameLoop();
}

function gameLoop() {
    if (!gameActive) return;
    
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    drawLauncher();
    drawGrid();
    if (shootingBubble) updateShootingBubble();
    updateParticles();
    
    animationId = requestAnimationFrame(gameLoop);
}

function drawLauncher() {
    // 가이드 라인
    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.moveTo(160, canvas.height - 25);
    ctx.lineTo(mousePos.x, mousePos.y);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.stroke();
    ctx.setLineDash([]);
    
    // 발사기 화살표
    const angle = Math.atan2(mousePos.y - (canvas.height - 25), mousePos.x - 160);
    ctx.save();
    ctx.translate(160, canvas.height - 25);
    ctx.rotate(angle);
    ctx.fillStyle = '#555';
    ctx.fillRect(0, -5, 30, 10);
    // 화살표 끝부분
    ctx.beginPath();
    ctx.moveTo(30, -8);
    ctx.lineTo(40, 0);
    ctx.lineTo(30, 8);
    ctx.fill();
    ctx.restore();

    drawPixelBubble(160, canvas.height - 25, nextColor);
}

function drawGrid() {
    for(let r = 0; r < grid.length; r++) {
        for(let c = 0; c < COLS; c++) {
            if (grid[r][c]) {
                const offset = (r % 2 === 0) ? 0 : BUBBLE_RADIUS;
                const x = c * (BUBBLE_RADIUS * 2) + BUBBLE_RADIUS + offset;
                const y = r * (BUBBLE_RADIUS * 1.7) + BUBBLE_RADIUS;
                drawPixelBubble(x, y, grid[r][c]);
            }
        }
    }
}

function drawPixelBubble(x, y, color) {
    // 기본 원
    ctx.beginPath();
    ctx.arc(x, y, BUBBLE_RADIUS - 1, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    
    // 테두리
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 픽셀 광택 디테일
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillRect(x - 8, y - 8, 5, 5);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(x + 2, y + 2, 6, 6);
}

function updateShootingBubble() {
    shootingBubble.x += shootingBubble.vx;
    shootingBubble.y += shootingBubble.vy;
    
    if (shootingBubble.x < BUBBLE_RADIUS || shootingBubble.x > canvas.width - BUBBLE_RADIUS) {
        shootingBubble.vx *= -1;
    }
    
    let collided = false;
    if (shootingBubble.y < BUBBLE_RADIUS) collided = true;

    // 인접 구슬 충돌 체크
    for(let r = 0; r < grid.length; r++) {
        for(let c = 0; c < COLS; c++) {
            if (grid[r][c]) {
                const offset = (r % 2 === 0) ? 0 : BUBBLE_RADIUS;
                const x = c * (BUBBLE_RADIUS * 2) + BUBBLE_RADIUS + offset;
                const y = r * (BUBBLE_RADIUS * 1.7) + BUBBLE_RADIUS;
                const dist = Math.sqrt((shootingBubble.x - x)**2 + (shootingBubble.y - y)**2);
                if (dist < BUBBLE_RADIUS * 1.6) {
                    collided = true;
                    break;
                }
            }
        }
        if (collided) break;
    }
    
    if (collided) {
        const r = Math.round((shootingBubble.y - BUBBLE_RADIUS) / (BUBBLE_RADIUS * 1.7));
        const offset = (r % 2 === 0) ? 0 : BUBBLE_RADIUS;
        const c = Math.round((shootingBubble.x - BUBBLE_RADIUS - offset) / (BUBBLE_RADIUS * 2));
        
        const finalR = Math.max(0, r);
        const finalC = Math.max(0, Math.min(c, COLS - 1));
        
        if (!grid[finalR]) grid[finalR] = [];
        grid[finalR][finalC] = shootingBubble.color;
        
        handleMatch(finalR, finalC, shootingBubble.color);
        shootingBubble = null;
        
        if (grid.length > 15) {
            alert("GAME OVER! SCORE: " + score);
            stopGame();
        }
    }
    if (shootingBubble) drawPixelBubble(shootingBubble.x, shootingBubble.y, shootingBubble.color);
}

function handleMatch(row, col, color) {
    let matched = findGroup(row, col, color);
    if (matched.length >= 3) {
        matched.forEach(p => {
            createExplosion(p.r, p.c, grid[p.r][p.c]);
            grid[p.r][p.c] = null;
        });
        score += matched.length * 50;
        dropFloatingBubbles();
        document.getElementById('game-score').innerText = 'SCORE: ' + score;
    }
}

function findGroup(row, col, color) {
    let group = [];
    let queue = [{r: row, c: col}];
    let visited = new Set([`${row},${col}`]);
    
    while(queue.length > 0) {
        let {r, c} = queue.shift();
        if (grid[r] && grid[r][c] === color) {
            group.push({r, c});
            getNeighbors(r, c).forEach(n => {
                if (!visited.has(`${n.r},${n.c}`) && grid[n.r] && grid[n.r][n.c] === color) {
                    visited.add(`${n.r},${n.c}`);
                    queue.push(n);
                }
            });
        }
    }
    return group;
}

function getNeighbors(r, c) {
    const isOdd = r % 2 !== 0;
    return isOdd ? 
        [{r: r-1, c}, {r: r-1, c+1}, {r, c-1}, {r, c+1}, {r+1, c}, {r+1, c+1}] :
        [{r: r-1, c-1}, {r: r-1, c}, {r, c-1}, {r, c+1}, {r+1, c-1}, {r+1, c}];
}

function dropFloatingBubbles() {
    let connected = new Set();
    let queue = [];
    if (grid[0]) {
        for(let c = 0; c < COLS; c++) {
            if (grid[0][c]) {
                connected.add(`0,${c}`);
                queue.push({r: 0, c: c});
            }
        }
    }
    while(queue.length > 0) {
        let {r, c} = queue.shift();
        getNeighbors(r, c).forEach(n => {
            if (!connected.has(`${n.r},${n.c}`) && grid[n.r] && grid[n.r][n.c]) {
                connected.add(`${n.r},${n.c}`);
                queue.push(n);
            }
        });
    }
    for(let r = 0; r < grid.length; r++) {
        for(let c = COLS - 1; c >= 0; c--) {
            if (grid[r] && grid[r][c] && !connected.has(`${r},${c}`)) {
                createExplosion(r, c, grid[r][c]);
                grid[r][c] = null;
                score += 100;
            }
        }
    }
}

function createExplosion(r, c, color) {
    const offset = (r % 2 === 0) ? 0 : BUBBLE_RADIUS;
    const x = c * (BUBBLE_RADIUS * 2) + BUBBLE_RADIUS + offset;
    const y = r * (BUBBLE_RADIUS * 1.7) + BUBBLE_RADIUS;
    for(let i = 0; i < 8; i++) {
        particles.push({
            x, y, 
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 1, color
        });
    }
}

function updateParticles() {
    for(let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx; p.y += p.vy;
        p.life -= 0.05;
        if (p.life <= 0) particles.splice(i, 1);
        else {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life;
            ctx.fillRect(p.x, p.y, 4, 4);
            ctx.globalAlpha = 1;
        }
    }
}

function stopGame() {
    gameActive = false;
    cancelAnimationFrame(animationId);
    document.getElementById('game-modal').style.display = 'none';
}
