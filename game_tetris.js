/* game_tetris.js - 테트리스 고도화 버전 (그리드 & 테마 변환) */
var canvas, ctx, nextCanvas, nextCtx, animId;
var score = 0, active = false;
var grid = [], current = null, next = null;
var lastDrop = 0;

// 테마별 색상 세트
var THEMES = [
    { 'I': '#00ffff', 'J': '#0000ff', 'L': '#ffaa00', 'O': '#ffff00', 'S': '#00ff00', 'T': '#aa00ff', 'Z': '#ff0000' }, // Classic
    { 'I': '#ff00ff', 'J': '#7df9ff', 'L': '#ffef00', 'O': '#39ff14', 'S': '#ff3131', 'T': '#bc13fe', 'Z': '#ff5e00' }, // Neon 2
    { 'I': '#ffb3ba', 'J': '#bae1ff', 'L': '#ffffba', 'O': '#baffc9', 'S': '#ffdfba', 'T': '#eecbff', 'Z': '#ffc3a0' }  // Pastel
];
var currentTheme = THEMES[0];

var SHAPES = {
    'I': [[1, 1, 1, 1]], 'J': [[1, 0, 0], [1, 1, 1]], 'L': [[0, 0, 1], [1, 1, 1]],
    'O': [[1, 1], [1, 1]], 'S': [[0, 1, 1], [1, 1, 0]], 'T': [[0, 1, 0], [1, 1, 1]], 'Z': [[1, 1, 0], [0, 1, 1]]
};

function startTetris() {
    canvas = document.getElementById('tetrisCanvas');
    nextCanvas = document.getElementById('nextCanvas');
    if (!canvas || !nextCanvas) return;
    ctx = canvas.getContext('2d');
    nextCtx = nextCanvas.getContext('2d');
    active = true; score = 0; currentTheme = THEMES[0];
    grid = Array.from({ length: 20 }, () => Array(10).fill(0));
    
    document.getElementById('game-score').innerText = '0';
    document.getElementById('high-score').innerText = (localStorage.getItem('tetrisHighScore') || '0');

    next = getRandomPiece();
    spawn();
    document.addEventListener('keydown', handleInput);
    loop();
}

function getRandomPiece() {
    var types = Object.keys(SHAPES);
    var t = types[Math.floor(Math.random() * types.length)];
    return { type: t, shape: SHAPES[t], x: 3, y: 0, color: currentTheme[t] };
}

function spawn() {
    current = next;
    // 테마 체크 (2000점 단위로 변경)
    var themeIdx = Math.min(Math.floor(score / 2000), THEMES.length - 1);
    currentTheme = THEMES[themeIdx];
    
    next = getRandomPiece();
    drawNext();
    if (collision(0, 0, current.shape)) {
        active = false;
        saveGameScore('tetris', score); // 랭킹 저장 (v37)
    }
}

function drawNext() {
    nextCtx.fillStyle = '#000'; nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
    var s = 15;
    var ox = (nextCanvas.width - next.shape[0].length * s) / 2;
    var oy = (nextCanvas.height - next.shape.length * s) / 2;
    next.shape.forEach((row, r) => {
        row.forEach((v, c) => {
            if (v) {
                nextCtx.fillStyle = currentTheme[next.type]; // 현재 테마 색상 적용
                nextCtx.fillRect(ox + c*s, oy + r*s, s-1, s-1);
                nextCtx.strokeStyle = '#fff'; nextCtx.strokeRect(ox + c*s, oy + r*s, s-1, s-1);
            }
        });
    });
}

function handleInput(e) {
    if (!active) return;
    if (e.key === 'ArrowLeft') move(-1, 0);
    if (e.key === 'ArrowRight') move(1, 0);
    if (e.key === 'ArrowDown') move(0, 1);
    if (e.key === 'ArrowUp') rotate();
    if (e.key === ' ') { e.preventDefault(); while(move(0,1)); }
}

function move(dx, dy) {
    if (!collision(dx, dy, current.shape)) {
        current.x += dx; current.y += dy;
        return true;
    }
    if (dy > 0) {
        lock(); checkLines(); spawn();
    }
    return false;
}

function rotate() {
    var r = current.shape[0].map((_, i) => current.shape.map(row => row[i]).reverse());
    // 멀티 오프셋 월 킥 (회전 시 빈 공간 찾기)
    var offsets = [0, -1, 1, -2, 2];
    for (var i = 0; i < offsets.length; i++) {
        if (!collision(offsets[i], 0, r)) {
            current.x += offsets[i];
            current.shape = r;
            return;
        }
    }
}

function collision(dx, dy, s) {
    for (var r = 0; r < s.length; r++) {
        for (var c = 0; c < s[r].length; c++) {
            if (s[r][c]) {
                var nx = current.x + c + dx, ny = current.y + r + dy;
                if (nx < 0 || nx >= 10 || ny >= 20 || (ny >= 0 && grid[ny][nx])) return true;
            }
        }
    }
    return false;
}

function lock() {
    current.shape.forEach((row, r) => {
        row.forEach((v, c) => { 
            if (v && current.y + r >= 0) {
                // 고정될 때의 색상도 현재 테마 색상으로 저장
                grid[current.y + r][current.x + c] = currentTheme[current.type]; 
            }
        });
    });
}

function checkLines() {
    var cleared = 0;
    for (var r = 19; r >= 0; r--) {
        if (grid[r].every(v => v !== 0)) { grid.splice(r, 1); grid.unshift(Array(10).fill(0)); cleared++; r++; }
    }
    if (cleared > 0) {
        score += [0, 100, 300, 500, 800][cleared];
        document.getElementById('game-score').innerText = score;
        var hs = parseInt(localStorage.getItem('tetrisHighScore') || '0');
        if (score > hs) { localStorage.setItem('tetrisHighScore', score); document.getElementById('high-score').innerText = score; }
    }
}

function loop(t) {
    if (!active) return;
    if (t - lastDrop > 800) { move(0, 1); lastDrop = t; }
    draw();
    animId = requestAnimationFrame(loop);
}

function draw() {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 배경 그리드 그리기
    ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 1;
    for(var i=0; i<=10; i++) { ctx.beginPath(); ctx.moveTo(i*20, 0); ctx.lineTo(i*20, 400); ctx.stroke(); }
    for(var j=0; j<=20; j++) { ctx.beginPath(); ctx.moveTo(0, j*20); ctx.lineTo(200, j*20); ctx.stroke(); }

    grid.forEach((row, r) => { row.forEach((v, c) => { if(v) drawBlock(c, r, v); }); });
    if (current) current.shape.forEach((row, r) => { row.forEach((v, c) => { if(v) drawBlock(current.x+c, current.y+r, currentTheme[current.type]); }); });
}

function drawBlock(x, y, color) {
    ctx.fillStyle = color; ctx.fillRect(x*20, y*20, 19, 19);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.strokeRect(x*20, y*20, 19, 19);
    // 블록 내부 광택 효과
    ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(x*20, y*20, 19, 5);
}
