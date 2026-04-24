/* game_tetris.js - 테트리스 전용 로직 */
var canvas, ctx, nextCanvas, nextCtx, animId;
var score = 0, active = false;
var grid = [], current = null, next = null;
var lastDrop = 0;

var SHAPES = {
    'I': [[1, 1, 1, 1]], 'J': [[1, 0, 0], [1, 1, 1]], 'L': [[0, 0, 1], [1, 1, 1]],
    'O': [[1, 1], [1, 1]], 'S': [[0, 1, 1], [1, 1, 0]], 'T': [[0, 1, 0], [1, 1, 1]], 'Z': [[1, 1, 0], [0, 1, 1]]
};
var COLORS = { 'I': '#00ffff', 'J': '#0000ff', 'L': '#ffaa00', 'O': '#ffff00', 'S': '#00ff00', 'T': '#aa00ff', 'Z': '#ff0000' };

function startTetris() {
    canvas = document.getElementById('tetrisCanvas');
    nextCanvas = document.getElementById('nextCanvas');
    if (!canvas || !nextCanvas) return;
    ctx = canvas.getContext('2d');
    nextCtx = nextCanvas.getContext('2d');
    active = true; score = 0;
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
    return { type: t, shape: SHAPES[t], x: 3, y: 0, color: COLORS[t] };
}

function spawn() {
    current = next;
    next = getRandomPiece();
    drawNext();
    if (collision(0, 0, current.shape)) {
        alert("GAME OVER!");
        active = false;
        window.location.href = 'dashboard.html';
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
                nextCtx.fillStyle = next.color; nextCtx.fillRect(ox + c*s, oy + r*s, s-1, s-1);
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
    if (!collision(0, 0, r)) current.shape = r;
    else if (!collision(-1, 0, r)) { current.x -= 1; current.shape = r; }
    else if (!collision(1, 0, r)) { current.x += 1; current.shape = r; }
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
        row.forEach((v, c) => { if (v && current.y + r >= 0) grid[current.y + r][current.x + c] = current.color; });
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
    grid.forEach((row, r) => { row.forEach((v, c) => { if(v) drawBlock(c, r, v); }); });
    if (current) current.shape.forEach((row, r) => { row.forEach((v, c) => { if(v) drawBlock(current.x+c, current.y+r, current.color); }); });
}

function drawBlock(x, y, color) {
    ctx.fillStyle = color; ctx.fillRect(x*20, y*20, 19, 19);
    ctx.strokeStyle = '#fff'; ctx.strokeRect(x*20, y*20, 19, 19);
}
