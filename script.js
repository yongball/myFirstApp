console.log("YONGBALL WORLD Script Loaded - v5");

/* ==========================================
   1. 최우선 실행 로직 (로그인/페이지 이동)
   ========================================== */
function navigateTo(url) {
    window.location.href = url;
}

function handleGuestLogin() {
    console.log("Guest login triggered");
    localStorage.setItem('name', '게스트');
    window.location.href = 'dashboard.html';
}

function handleLogin() {
    console.log("Login triggered");
    var emailInput = document.getElementById('email');
    var passwordInput = document.getElementById('password');
    
    if (!emailInput || !passwordInput || !emailInput.value || !passwordInput.value) {
        alert('이메일과 비밀번호를 입력해주세요.');
        return;
    }

    var users = JSON.parse(localStorage.getItem('users') || '[]');
    var user = null;
    for (var i = 0; i < users.length; i++) {
        if (users[i].email === emailInput.value && users[i].password === passwordInput.value) {
            user = users[i];
            break;
        }
    }

    if (user) {
        localStorage.setItem('name', user.name);
        window.location.href = 'dashboard.html';
    } else {
        alert('이메일 또는 비밀번호가 일치하지 않습니다.');
    }
}

function handleLogout() {
    localStorage.removeItem('name');
    window.location.replace('index.html');
}

function handleSignup(event) {
    if (event) event.preventDefault();
    var name = document.getElementById('name');
    var email = document.getElementById('email');
    var password = document.getElementById('password');
    var passwordConfirm = document.getElementById('password-confirm');

    if (!name || !email || !password || !name.value || !email.value || !password.value) {
        alert('모든 항목을 입력해주세요.');
        return;
    }

    if (password.value !== passwordConfirm.value) {
        alert('비밀번호가 일치하지 않습니다.');
        return;
    }

    var userData = { name: name.value, email: email.value, password: password.value, createdAt: new Date().toISOString() };
    var users = JSON.parse(localStorage.getItem('users') || '[]');

    for (var i = 0; i < users.length; i++) {
        if (users[i].email === email.value) {
            alert('이미 가입된 이메일입니다.');
            return;
        }
    }

    users.push(userData);
    localStorage.setItem('users', JSON.stringify(users));
    alert('회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.');
    navigateTo('index.html');
}

/* ==========================================
   2. UI 및 모달 제어
   ========================================== */
function showItemInfo(item) {
    var modal = document.getElementById('item-modal');
    if (!modal) return;
    var items = {
        'sword': { name: '낡은 검', desc: '초보 용사의 낡은 검. 녹이 슬었지만 아직 날카롭다.' },
        'shield': { name: '나무 방패', desc: '튼튼한 나무 방패. 웬만한 공격은 막아낼 수 있다.' },
        'potion': { name: '빨간 물약', desc: '신비로운 물약. 마시면 체력이 솟구친다!' },
        'gold': { name: '금화', desc: '반짝이는 금화. 시장에서 맛있는 걸 살 수 있다.' }
    };
    var info = items[item];
    if (info) {
        document.getElementById('modal-item-name').innerText = "[ " + info.name + " ]";
        document.getElementById('modal-item-desc').innerText = info.desc;
        modal.style.display = 'flex';
    }
}

function closeItemInfo() {
    var modal = document.getElementById('item-modal');
    if (modal) modal.style.display = 'none';
}

function openGameSelect() {
    var modal = document.getElementById('game-select-modal');
    if (modal) modal.style.display = 'flex';
}

function closeGameSelect() {
    var modal = document.getElementById('game-select-modal');
    if (modal) modal.style.display = 'none';
}

/* ==========================================
   3. 게임 엔진 (전역 변수)
   ========================================== */
var globalScore = 0;
var globalAnimId = null;
var globalCanvas = null;
var globalCtx = null;

/* --- 미니 게임 1: TETRIS --- */
var tetrisActive = false;
var tetrisGrid = [];
var currentPiece = null;
var SHAPES = {
    'I': [[1, 1, 1, 1]], 'J': [[1, 0, 0], [1, 1, 1]], 'L': [[0, 0, 1], [1, 1, 1]],
    'O': [[1, 1], [1, 1]], 'S': [[0, 1, 1], [1, 1, 0]], 'T': [[0, 1, 0], [1, 1, 1]], 'Z': [[1, 1, 0], [0, 1, 1]]
};
var SHAPE_COLORS = { 'I': '#00ffff', 'J': '#0000ff', 'L': '#ffaa00', 'O': '#ffff00', 'S': '#00ff00', 'T': '#aa00ff', 'Z': '#ff0000' };

function startTetris() {
    globalCanvas = document.getElementById('tetrisCanvas');
    if (!globalCanvas) return;
    globalCtx = globalCanvas.getContext('2d');
    tetrisActive = true;
    globalScore = 0;
    tetrisGrid = Array.from({ length: 20 }, function() { return Array(10).fill(0); });
    spawnTetrisPiece();
    document.addEventListener('keydown', handleTetrisInput);
    tetrisLoop();
}

function spawnTetrisPiece() {
    var types = Object.keys(SHAPES);
    var type = types[Math.floor(Math.random() * types.length)];
    currentPiece = { type: type, shape: SHAPES[type], x: 4, y: 0, color: SHAPE_COLORS[type] };
    if (checkTetrisCollision(0, 0, currentPiece.shape)) {
        alert("GAME OVER!");
        stopTetris();
        navigateTo('dashboard.html');
    }
}

function handleTetrisInput(e) {
    if (!tetrisActive) return;
    if (e.key === 'ArrowLeft') moveTetrisPiece(-1, 0);
    if (e.key === 'ArrowRight') moveTetrisPiece(1, 0);
    if (e.key === 'ArrowDown') moveTetrisPiece(0, 1);
    if (e.key === 'ArrowUp') rotateTetrisPiece();
}

function moveTetrisPiece(dx, dy) {
    if (!checkTetrisCollision(dx, dy, currentPiece.shape)) {
        currentPiece.x += dx;
        currentPiece.y += dy;
        return true;
    }
    if (dy > 0) {
        lockTetrisPiece();
        checkTetrisLines();
        spawnTetrisPiece();
    }
    return false;
}

function rotateTetrisPiece() {
    var rotated = currentPiece.shape[0].map(function(_, i) { return currentPiece.shape.map(function(row) { return row[i]; }).reverse(); });
    if (!checkTetrisCollision(0, 0, rotated)) currentPiece.shape = rotated;
}

function checkTetrisCollision(dx, dy, shape) {
    for (var r = 0; r < shape.length; r++) {
        for (var c = 0; c < shape[r].length; c++) {
            if (shape[r][c]) {
                var nx = currentPiece.x + c + dx, ny = currentPiece.y + r + dy;
                if (nx < 0 || nx >= 10 || ny >= 20 || (ny >= 0 && tetrisGrid[ny][nx])) return true;
            }
        }
    }
    return false;
}

function lockTetrisPiece() {
    currentPiece.shape.forEach(function(row, r) {
        row.forEach(function(val, c) {
            if (val && currentPiece.y + r >= 0) tetrisGrid[currentPiece.y + r][currentPiece.x + c] = currentPiece.color;
        });
    });
}

function checkTetrisLines() {
    var cleared = 0;
    for (var r = 19; r >= 0; r--) {
        if (tetrisGrid[r].every(function(cell) { return cell !== 0; })) {
            tetrisGrid.splice(r, 1);
            tetrisGrid.unshift(Array(10).fill(0));
            cleared++; r++;
        }
    }
    if (cleared > 0) {
        globalScore += [0, 100, 300, 500, 800][cleared];
        var scoreEl = document.getElementById('game-score');
        if (scoreEl) scoreEl.innerText = 'SCORE: ' + globalScore;
    }
}

var lastTetrisDrop = 0;
function tetrisLoop(time) {
    if (!tetrisActive) return;
    if (time - lastTetrisDrop > 800) { moveTetrisPiece(0, 1); lastTetrisDrop = time; }
    drawTetris();
    globalAnimId = requestAnimationFrame(tetrisLoop);
}

function drawTetris() {
    if (!globalCtx) return;
    globalCtx.fillStyle = '#000';
    globalCtx.fillRect(0, 0, globalCanvas.width, globalCanvas.height);
    tetrisGrid.forEach(function(row, r) { row.forEach(function(col, c) { if(col) drawTetrisBlock(c, r, col); }); });
    if (currentPiece) currentPiece.shape.forEach(function(row, r) { row.forEach(function(val, c) { if(val) drawTetrisBlock(currentPiece.x+c, currentPiece.y+r, currentPiece.color); }); });
}

function drawTetrisBlock(x, y, color) {
    globalCtx.fillStyle = color;
    globalCtx.fillRect(x*20, y*20, 19, 19);
    globalCtx.strokeStyle = '#fff';
    globalCtx.strokeRect(x*20, y*20, 19, 19);
}

function stopTetris() { tetrisActive = false; cancelAnimationFrame(globalAnimId); document.removeEventListener('keydown', handleTetrisInput); }

/* --- 미니 게임 2: PUZZLE BOBBLE --- */
var gameActive = false;
var bubbleGrid = [], shootingBubble = null, nextBubbleColor = '#39ff14', b_particles = [];

function startGame() {
    globalCanvas = document.getElementById('gameCanvas');
    if (!globalCanvas) return;
    globalCtx = globalCanvas.getContext('2d');
    gameActive = true; globalScore = 0; bubbleGrid = []; b_particles = []; shootingBubble = null;
    var scoreEl = document.getElementById('game-score');
    if (scoreEl) scoreEl.innerText = 'SCORE: 0';
    var colors = ['#39ff14', '#ff00ff', '#00ffff', '#ffff00', '#ff0000'];
    for(var r = 0; r < 8; r++) {
        bubbleGrid[r] = [];
        for(var c = 0; c < 10; c++) bubbleGrid[r][c] = colors[Math.floor(Math.random() * colors.length)];
    }
    nextBubbleColor = colors[Math.floor(Math.random() * colors.length)];
    globalCanvas.onmousemove = function(e) {
        var rect = globalCanvas.getBoundingClientRect();
        mousePos.x = e.clientX - rect.left; mousePos.y = e.clientY - rect.top;
    };
    globalCanvas.onclick = function() {
        if (shootingBubble) return;
        var angle = Math.atan2(mousePos.y - (globalCanvas.height - 25), mousePos.x - 160);
        shootingBubble = { x: 160, y: globalCanvas.height - 25, vx: Math.cos(angle) * 10, vy: Math.sin(angle) * 10, color: nextBubbleColor };
        nextBubbleColor = colors[Math.floor(Math.random() * colors.length)];
    };
    var mousePos = { x: 160, y: 0 };
    bubbleLoop();
}

function bubbleLoop() {
    if (!gameActive || !globalCtx) return;
    globalCtx.fillStyle = '#000'; globalCtx.fillRect(0, 0, globalCanvas.width, globalCanvas.height);
    drawBubbleGrid();
    if (shootingBubble) updateShootingBubble();
    globalAnimId = requestAnimationFrame(bubbleLoop);
}

function drawBubbleGrid() {
    for(var r = 0; r < bubbleGrid.length; r++) {
        for(var c = 0; c < 10; c++) {
            if (bubbleGrid[r][c]) {
                var off = (r % 2 === 0) ? 0 : 16;
                drawPixelBubble(c * 32 + 16 + off, r * 27 + 16, bubbleGrid[r][c]);
            }
        }
    }
}

function drawPixelBubble(x, y, color) {
    globalCtx.beginPath(); globalCtx.arc(x, y, 15, 0, Math.PI * 2);
    globalCtx.fillStyle = color; globalCtx.fill();
    globalCtx.strokeStyle = '#fff'; globalCtx.stroke();
}

function updateShootingBubble() {
    shootingBubble.x += shootingBubble.vx; shootingBubble.y += shootingBubble.vy;
    if (shootingBubble.x < 16 || shootingBubble.x > globalCanvas.width - 16) shootingBubble.vx *= -1;
    var collided = shootingBubble.y < 16;
    if (collided) {
        var r = Math.round((shootingBubble.y - 16) / 27), off = (r % 2 === 0) ? 0 : 16;
        var c = Math.max(0, Math.min(Math.round((shootingBubble.x - 16 - off) / 32), 9));
        if(!bubbleGrid[r]) bubbleGrid[r] = [];
        bubbleGrid[r][c] = shootingBubble.color;
        shootingBubble = null;
    }
    if (shootingBubble) drawPixelBubble(shootingBubble.x, shootingBubble.y, shootingBubble.color);
}
