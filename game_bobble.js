/* game_bobble.js - 퍼즐 보블 전용 로직 */
var canvas, ctx, animId;
var score = 0, active = false;
var grid = [], shooting = null, nextColor = '#39ff14';
var mouse = { x: 160, y: 0 };
var colors = ['#39ff14', '#ff00ff', '#00ffff', '#ffff00', '#ff0000'];

function startGame() {
    canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    active = true; score = 0; grid = []; shooting = null;
    
    // 초기화
    document.getElementById('game-score').innerText = '0';
    document.getElementById('high-score').innerText = (localStorage.getItem('bubbleHighScore') || '0');

    // 그리드 생성 (8줄)
    for(var r = 0; r < 8; r++) {
        grid[r] = [];
        for(var c = 0; c < 10; c++) grid[r][c] = colors[Math.floor(Math.random() * colors.length)];
    }
    nextColor = colors[Math.floor(Math.random() * colors.length)];

    canvas.onmousemove = function(e) {
        var rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left; mouse.y = e.clientY - rect.top;
    };
    canvas.onclick = function() {
        if (shooting) return;
        var angle = Math.atan2(mouse.y - (canvas.height - 25), mouse.x - 160);
        shooting = { x: 160, y: canvas.height - 25, vx: Math.cos(angle) * 10, vy: Math.sin(angle) * 10, color: nextColor };
        nextColor = colors[Math.floor(Math.random() * colors.length)];
    };
    loop();
}

function loop() {
    if (!active) return;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    if (shooting) updateShooting();
    // 조준 가이드 라인 (디테일 추가)
    ctx.setLineDash([5, 5]); ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath(); ctx.moveTo(160, canvas.height - 25); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
    ctx.setLineDash([]);
    
    animId = requestAnimationFrame(loop);
}

function drawGrid() {
    for(var r = 0; r < grid.length; r++) {
        for(var c = 0; c < 10; c++) {
            if (grid[r][c]) {
                var off = (r % 2 === 0) ? 0 : 16;
                drawBubble(c * 32 + 16 + off, r * 28 + 16, grid[r][c]);
            }
        }
    }
}

function drawBubble(x, y, color) {
    ctx.beginPath(); ctx.arc(x, y, 14, 0, Math.PI * 2);
    ctx.fillStyle = color; ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
    // 하이라이트 (디테일)
    ctx.beginPath(); ctx.arc(x - 5, y - 5, 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fill();
}

function updateShooting() {
    shooting.x += shooting.vx; shooting.y += shooting.vy;
    if (shooting.x < 16 || shooting.x > canvas.width - 16) shooting.vx *= -1;
    
    var r = Math.round((shooting.y - 16) / 28);
    var off = (r % 2 === 0) ? 0 : 16;
    var c = Math.max(0, Math.min(Math.round((shooting.x - 16 - off) / 32), 9));

    // 충돌 체크
    if (shooting.y < 16 || (grid[r] && grid[r][c])) {
        if (shooting.y < 16) r = 0;
        else {
            // 빈 공간 찾기
            if (grid[r][c]) r++;
        }
        if (!grid[r]) grid[r] = [];
        grid[r][c] = shooting.color;
        checkMatch(r, c, shooting.color);
        shooting = null;
    }
    if (shooting) drawBubble(shooting.x, shooting.y, shooting.color);
}

function checkMatch(row, col, color) {
    var group = [], queue = [{r: row, c: col}], visited = new Set([row + ',' + col]);
    while(queue.length > 0) {
        var p = queue.shift();
        if (grid[p.r] && grid[p.r][p.c] === color) {
            group.push(p);
            var neighbors = getNeighbors(p.r, p.c);
            neighbors.forEach(n => {
                if (!visited.has(n.r + ',' + n.c) && grid[n.r] && grid[n.r][n.c] === color) {
                    visited.add(n.r + ',' + n.c); queue.push(n);
                }
            });
        }
    }
    if (group.length >= 3) {
        group.forEach(p => { grid[p.r][p.c] = null; });
        score += group.length * 100;
        document.getElementById('game-score').innerText = score;
        var hs = parseInt(localStorage.getItem('bubbleHighScore') || '0');
        if (score > hs) {
            localStorage.setItem('bubbleHighScore', score);
            document.getElementById('high-score').innerText = score;
        }
    }
}

function getNeighbors(r, c) {
    var neighbors = [];
    var off = (r % 2 === 0) ? [-1, 0] : [0, 1];
    var ds = [[-1, 0], [1, 0], [0, -1], [0, 1], [off[0], -1], [off[1], 1]];
    ds.forEach(d => { neighbors.push({ r: r + d[0], c: c + d[1] }); });
    return neighbors;
}
