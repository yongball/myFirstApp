/* --- 공통 유틸리티 및 전역 변수 --- */
function navigateTo(url) {
    window.location.href = url;
}

// 중복 선언 방지를 위해 전역 변수 통합
let score = 0;
let animationId = null;
let canvas = null;
let ctx = null;

/* --- 회원가입 및 로그인 로직 --- */
function handleSignup(event) {
    if (event) event.preventDefault();
    const name = document.getElementById('name')?.value;
    const email = document.getElementById('email')?.value;
    const password = document.getElementById('password')?.value;
    const passwordConfirm = document.getElementById('password-confirm')?.value;

    if (!name || !email || !password) {
        alert('모든 항목을 입력해주세요.');
        return;
    }

    if (password !== passwordConfirm) {
        alert('비밀번호가 일치하지 않습니다.');
        return;
    }

    const userData = { name, email, password, createdAt: new Date().toISOString() };
    const users = JSON.parse(localStorage.getItem('users') || '[]');

    if (users.some(user => user.email === email)) {
        alert('이미 가입된 이메일입니다.');
        return;
    }

    users.push(userData);
    localStorage.setItem('users', JSON.stringify(users));
    alert('회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.');
    navigateTo('index.html');
}

function handleLogin() {
    const emailInput = document.getElementById('email')?.value;
    const passwordInput = document.getElementById('password')?.value;
    
    if (!emailInput || !passwordInput) {
        alert('이메일과 비밀번호를 입력해주세요.');
        return;
    }

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.email === emailInput && u.password === passwordInput);

    if (user) {
        localStorage.setItem('name', user.name);
        window.location.href = 'dashboard.html';
    } else {
        alert('이메일 또는 비밀번호가 일치하지 않습니다.');
    }
}

function handleGuestLogin() {
    localStorage.setItem('name', '게스트');
    window.location.href = 'dashboard.html';
}

function handleLogout() {
    localStorage.removeItem('name');
    window.location.replace('index.html');
}

/* --- 대시보드 및 모달 제어 --- */
function showItemInfo(item) {
    const modal = document.getElementById('item-modal');
    if (!modal) return;
    const items = {
        'sword': { name: '낡은 검', desc: '초보 용사의 낡은 검. 녹이 슬었지만 아직 날카롭다.' },
        'shield': { name: '나무 방패', desc: '튼튼한 나무 방패. 웬만한 공격은 막아낼 수 있다.' },
        'potion': { name: '빨간 물약', desc: '신비로운 물약. 마시면 체력이 솟구친다!' },
        'gold': { name: '금화', desc: '반짝이는 금화. 시장에서 맛있는 걸 살 수 있다.' }
    };
    const info = items[item];
    if (info) {
        document.getElementById('modal-item-name').innerText = `[ ${info.name} ]`;
        document.getElementById('modal-item-desc').innerText = info.desc;
        modal.style.display = 'flex';
    }
}

function closeItemInfo() {
    const modal = document.getElementById('item-modal');
    if (modal) modal.style.display = 'none';
}

function openGameSelect() {
    const modal = document.getElementById('game-select-modal');
    if (modal) modal.style.display = 'flex';
}

function closeGameSelect() {
    const modal = document.getElementById('game-select-modal');
    if (modal) modal.style.display = 'none';
}

/* --- 미니 게임 1: TETRIS --- */
let tetrisActive = false;
let tetrisGrid = [];
const TETRIS_ROWS = 20;
const TETRIS_COLS = 10;
const BLOCK_SIZE = 20;
let currentPiece = null;

const SHAPES = {
    'I': [[1, 1, 1, 1]], 'J': [[1, 0, 0], [1, 1, 1]], 'L': [[0, 0, 1], [1, 1, 1]],
    'O': [[1, 1], [1, 1]], 'S': [[0, 1, 1], [1, 1, 0]], 'T': [[0, 1, 0], [1, 1, 1]], 'Z': [[1, 1, 0], [0, 1, 1]]
};
const SHAPE_COLORS = { 'I': '#00ffff', 'J': '#0000ff', 'L': '#ffaa00', 'O': '#ffff00', 'S': '#00ff00', 'T': '#aa00ff', 'Z': '#ff0000' };

function startTetris() {
    canvas = document.getElementById('tetrisCanvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    tetrisActive = true;
    score = 0;
    tetrisGrid = Array.from({ length: TETRIS_ROWS }, () => Array(TETRIS_COLS).fill(0));
    spawnPiece();
    document.addEventListener('keydown', handleTetrisInput);
    tetrisLoop();
}

function spawnPiece() {
    const types = Object.keys(SHAPES);
    const type = types[Math.floor(Math.random() * types.length)];
    currentPiece = { type, shape: SHAPES[type], x: Math.floor(TETRIS_COLS/2)-1, y: 0, color: SHAPE_COLORS[type] };
    if (checkTetrisCollision(0, 0, currentPiece.shape)) { alert("GAME OVER!"); stopTetris(); navigateTo('dashboard.html'); }
}

function handleTetrisInput(e) {
    if (!tetrisActive) return;
    if (e.key === 'ArrowLeft') movePiece(-1, 0);
    if (e.key === 'ArrowRight') movePiece(1, 0);
    if (e.key === 'ArrowDown') movePiece(0, 1);
    if (e.key === 'ArrowUp') rotatePiece();
}

function movePiece(dx, dy) {
    if (!checkTetrisCollision(dx, dy, currentPiece.shape)) { currentPiece.x += dx; currentPiece.y += dy; return true; }
    if (dy > 0) { lockPiece(); checkLines(); spawnPiece(); }
    return false;
}

function rotatePiece() {
    const rotated = currentPiece.shape[0].map((_, i) => currentPiece.shape.map(row => row[i]).reverse());
    if (!checkTetrisCollision(0, 0, rotated)) currentPiece.shape = rotated;
}

function checkTetrisCollision(dx, dy, shape) {
    for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
            if (shape[r][c]) {
                let nx = currentPiece.x + c + dx, ny = currentPiece.y + r + dy;
                if (nx < 0 || nx >= TETRIS_COLS || ny >= TETRIS_ROWS || (ny >= 0 && tetrisGrid[ny][nx])) return true;
            }
        }
    }
    return false;
}

function lockPiece() {
    currentPiece.shape.forEach((row, r) => {
        row.forEach((val, c) => { if (val && currentPiece.y + r >= 0) tetrisGrid[currentPiece.y + r][currentPiece.x + c] = currentPiece.color; });
    });
}

function checkLines() {
    let cleared = 0;
    for (let r = TETRIS_ROWS - 1; r >= 0; r--) {
        if (tetrisGrid[r].every(cell => cell !== 0)) { tetrisGrid.splice(r, 1); tetrisGrid.unshift(Array(TETRIS_COLS).fill(0)); cleared++; r++; }
    }
    if (cleared > 0) {
        score += [0, 100, 300, 500, 800][cleared];
        const scoreEl = document.getElementById('game-score');
        if (scoreEl) scoreEl.innerText = 'SCORE: ' + score;
    }
}

let lastDrop = 0;
function tetrisLoop(time = 0) {
    if (!tetrisActive) return;
    if (time - lastDrop > 800) { movePiece(0, 1); lastDrop = time; }
    drawTetris();
    animationId = requestAnimationFrame(tetrisLoop);
}

function drawTetris() {
    if (!ctx) return;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    tetrisGrid.forEach((row, r) => row.forEach((col, c) => { if(col) drawBlock(c, r, col); }));
    if (currentPiece) currentPiece.shape.forEach((row, r) => row.forEach((val, c) => { if(val) drawBlock(currentPiece.x+c, currentPiece.y+r, currentPiece.color); }));
}

function drawBlock(x, y, color) {
    ctx.fillStyle = color; ctx.fillRect(x*BLOCK_SIZE, y*BLOCK_SIZE, BLOCK_SIZE-1, BLOCK_SIZE-1);
    ctx.strokeStyle = '#fff'; ctx.strokeRect(x*BLOCK_SIZE, y*BLOCK_SIZE, BLOCK_SIZE-1, BLOCK_SIZE-1);
}

function stopTetris() { tetrisActive = false; cancelAnimationFrame(animationId); document.removeEventListener('keydown', handleTetrisInput); }

/* --- 미니 게임 2: PUZZLE BOBBLE --- */
let gameActive = false;
const BUBBLE_RADIUS = 16, COLS = 10;
const B_COLORS = ['#39ff14', '#ff00ff', '#00ffff', '#ffff00', '#ff0000'];
let bubbleGrid = [], shootingBubble = null, nextColor = B_COLORS[0], mousePos = { x: 160, y: 0 }, particles = [];

function startGame() {
    canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    gameActive = true; score = 0; bubbleGrid = []; particles = []; shootingBubble = null;
    const scoreEl = document.getElementById('game-score');
    if (scoreEl) scoreEl.innerText = 'SCORE: 0';
    for(let r = 0; r < 8; r++) {
        bubbleGrid[r] = [];
        for(let c = 0; c < COLS; c++) bubbleGrid[r][c] = B_COLORS[Math.floor(Math.random() * B_COLORS.length)];
    }
    nextColor = B_COLORS[Math.floor(Math.random() * B_COLORS.length)];
    canvas.onmousemove = (e) => { const rect = canvas.getBoundingClientRect(); mousePos.x = e.clientX - rect.left; mousePos.y = e.clientY - rect.top; };
    canvas.onclick = () => {
        if (shootingBubble) return;
        const angle = Math.atan2(mousePos.y - (canvas.height - 25), mousePos.x - 160);
        shootingBubble = { x: 160, y: canvas.height - 25, vx: Math.cos(angle) * 10, vy: Math.sin(angle) * 10, color: nextColor };
        nextColor = B_COLORS[Math.floor(Math.random() * B_COLORS.length)];
    };
    gameLoop();
}

function gameLoop() {
    if (!gameActive || !ctx) return;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawLauncher(); drawGrid();
    if (shootingBubble) updateShootingBubble();
    updateParticles();
    animationId = requestAnimationFrame(gameLoop);
}

function drawLauncher() {
    const angle = Math.atan2(mousePos.y - (canvas.height - 25), mousePos.x - 160);
    ctx.save(); ctx.translate(160, canvas.height - 25); ctx.rotate(angle);
    ctx.fillStyle = '#555'; ctx.fillRect(0, -5, 30, 10);
    ctx.beginPath(); ctx.moveTo(30, -8); ctx.lineTo(40, 0); ctx.lineTo(30, 8); ctx.fill(); ctx.restore();
    drawPixelBubble(160, canvas.height - 25, nextColor);
}

function drawGrid() {
    for(let r = 0; r < bubbleGrid.length; r++) {
        for(let c = 0; c < COLS; c++) {
            if (bubbleGrid[r][c]) {
                const off = (r % 2 === 0) ? 0 : BUBBLE_RADIUS;
                drawPixelBubble(c * BUBBLE_RADIUS * 2 + BUBBLE_RADIUS + off, r * BUBBLE_RADIUS * 1.7 + BUBBLE_RADIUS, bubbleGrid[r][c]);
            }
        }
    }
}

function drawPixelBubble(x, y, color) {
    ctx.beginPath(); ctx.arc(x, y, BUBBLE_RADIUS - 1, 0, Math.PI * 2);
    ctx.fillStyle = color; ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.stroke();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'; ctx.fillRect(x - 8, y - 8, 5, 5);
}

function updateShootingBubble() {
    shootingBubble.x += shootingBubble.vx; shootingBubble.y += shootingBubble.vy;
    if (shootingBubble.x < BUBBLE_RADIUS || shootingBubble.x > canvas.width - BUBBLE_RADIUS) shootingBubble.vx *= -1;
    let collided = shootingBubble.y < BUBBLE_RADIUS;
    if(!collided) {
        for(let r = 0; r < bubbleGrid.length; r++) {
            for(let c = 0; c < COLS; c++) {
                if (bubbleGrid[r][c]) {
                    const off = (r % 2 === 0) ? 0 : BUBBLE_RADIUS;
                    const bx = c * BUBBLE_RADIUS * 2 + BUBBLE_RADIUS + off, by = r * BUBBLE_RADIUS * 1.7 + BUBBLE_RADIUS;
                    const dist = Math.sqrt((shootingBubble.x - bx)**2 + (shootingBubble.y - by)**2);
                    if (dist < BUBBLE_RADIUS * 1.5) { collided = true; break; }
                }
            }
            if (collided) break;
        }
    }
    if (collided) {
        const r = Math.round((shootingBubble.y - BUBBLE_RADIUS) / (BUBBLE_RADIUS * 1.7));
        const off = (r % 2 === 0) ? 0 : BUBBLE_RADIUS;
        const c = Math.max(0, Math.min(Math.round((shootingBubble.x - BUBBLE_RADIUS - off) / (BUBBLE_RADIUS * 2)), COLS - 1));
        if(!bubbleGrid[r]) bubbleGrid[r] = [];
        bubbleGrid[r][c] = shootingBubble.color;
        checkBubbleMatch(r, c, shootingBubble.color);
        shootingBubble = null;
        if(bubbleGrid.length > 15) { alert("GAME OVER!"); stopGame(); }
    }
    if (shootingBubble) drawPixelBubble(shootingBubble.x, shootingBubble.y, shootingBubble.color);
}

function checkBubbleMatch(row, col, color) {
    let group = [], queue = [{r: row, c: col}], visited = new Set([`${row},${col}`]);
    while(queue.length > 0) {
        let {r, c} = queue.shift();
        if(bubbleGrid[r] && bubbleGrid[r][c] === color) {
            group.push({r, c});
            getBubbleNeighbors(r, c).forEach(n => { if(!visited.has(`${n.r},${n.c}`) && bubbleGrid[n.r] && bubbleGrid[n.r][n.c] === color) { visited.add(`${n.r},${n.c}`); queue.push(n); } });
        }
    }
    if(group.length >= 3) {
        group.forEach(p => { createBubbleExplosion(p.r, p.c, bubbleGrid[p.r][p.c]); bubbleGrid[p.r][p.c] = null; });
        score += group.length * 50;
        const scoreEl = document.getElementById('game-score');
        if (scoreEl) scoreEl.innerText = 'SCORE: ' + score;
    }
}

function getBubbleNeighbors(r, c) {
    const isOdd = r % 2 !== 0;
    return isOdd ? [{r:r-1,c},{r:r-1,c+1},{r,c-1},{r,c+1},{r+1,c},{r+1,c+1}] : [{r:r-1,c-1},{r:r-1,c},{r,c-1},{r,c+1},{r+1,c-1},{r+1,c}];
}

function createBubbleExplosion(r, c, color) {
    const off = (r % 2 === 0) ? 0 : BUBBLE_RADIUS, x = c * 32 + 16 + off, y = r * 27 + 16;
    for(let i=0; i<8; i++) particles.push({ x, y, vx: (Math.random()-0.5)*8, vy: (Math.random()-0.5)*8, life: 1, color });
}

function updateParticles() {
    for(let i = particles.length-1; i>=0; i--) {
        let p = particles[i]; p.x += p.vx; p.y += p.vy; p.life -= 0.05;
        if(p.life <= 0) particles.splice(i, 1);
        else { ctx.fillStyle = p.color; ctx.globalAlpha = p.life; ctx.fillRect(p.x, p.y, 4, 4); ctx.globalAlpha = 1; }
    }
}

function stopGame() { gameActive = false; cancelAnimationFrame(animationId); navigateTo('dashboard.html'); }
