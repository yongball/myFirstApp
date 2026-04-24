/* game_bobble.js - 낙하 애니메이션 추가 버전 (v15) */
var canvas, ctx, animId;
var score = 0, active = false;
var grid = [], shooting = null, nextColor = '#39ff14';
var mouse = { x: 160, y: 0 };
var particles = []; // 터지는 조각들
var fallingBubbles = []; // 떨어지는 버블들
var colors = ['#39ff14', '#ff00ff', '#00ffff', '#ffff00', '#ff0000'];
var BUBBLE_RADIUS = 16;
var ROW_HEIGHT = 28;

function startGame() {
    canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    active = true; score = 0; grid = []; shooting = null; particles = []; fallingBubbles = [];
    
    document.getElementById('game-score').innerText = '0';
    document.getElementById('high-score').innerText = (localStorage.getItem('bubbleHighScore') || '0');

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
        shooting = { x: 160, y: canvas.height - 25, vx: Math.cos(angle) * 12, vy: Math.sin(angle) * 12, color: nextColor };
        nextColor = colors[Math.floor(Math.random() * colors.length)];
    };
    loop();
}

function loop() {
    if (!active) return;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    drawGrid();
    if (shooting) updateShooting();
    updateFallingBubbles(); // 떨어지는 버블 업데이트
    updateParticles();
    
    drawBubble(160, canvas.height - 25, nextColor);
    ctx.setLineDash([5, 5]); ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath(); ctx.moveTo(160, canvas.height - 25); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
    ctx.setLineDash([]);
    
    animId = requestAnimationFrame(loop);
}

function drawBubble(x, y, color) {
    if (!color) return;
    ctx.beginPath(); ctx.arc(x, y, BUBBLE_RADIUS - 2, 0, Math.PI * 2);
    ctx.fillStyle = color; ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath(); ctx.arc(x - 5, y - 5, 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fill();
}

function drawGrid() {
    for(var r = 0; r < grid.length; r++) {
        if (!grid[r]) continue;
        for(var c = 0; c < 10; c++) {
            if (grid[r][c]) {
                var pos = getBubblePos(r, c);
                drawBubble(pos.x, pos.y, grid[r][c]);
            }
        }
    }
}

function getBubblePos(r, c) {
    var off = (r % 2 === 0) ? 0 : BUBBLE_RADIUS;
    return { x: c * BUBBLE_RADIUS * 2 + BUBBLE_RADIUS + off, y: r * ROW_HEIGHT + BUBBLE_RADIUS };
}

function updateShooting() {
    shooting.x += shooting.vx; shooting.y += shooting.vy;
    if (shooting.x < BUBBLE_RADIUS || shooting.x > canvas.width - BUBBLE_RADIUS) shooting.vx *= -1;

    var collided = false;
    if (shooting.y < BUBBLE_RADIUS) collided = true;
    else {
        for (var r = 0; r < grid.length + 1; r++) {
            for (var c = 0; c < 10; c++) {
                if (grid[r] && grid[r][c]) {
                    var pos = getBubblePos(r, c);
                    var dist = Math.sqrt((shooting.x - pos.x)**2 + (shooting.y - pos.y)**2);
                    if (dist < BUBBLE_RADIUS * 1.8) { collided = true; break; }
                }
            }
            if (collided) break;
        }
    }

    if (collided) {
        var bestR = Math.round((shooting.y - BUBBLE_RADIUS) / ROW_HEIGHT);
        var off = (bestR % 2 === 0) ? 0 : BUBBLE_RADIUS;
        var bestC = Math.max(0, Math.min(Math.round((shooting.x - BUBBLE_RADIUS - off) / (BUBBLE_RADIUS * 2)), 9));
        if (bestR < 0) bestR = 0;
        if (!grid[bestR]) grid[bestR] = [];
        grid[bestR][bestC] = shooting.color;
        
        // 게임 오버 체크 (14행 이상 내려오면 종료)
        if (bestR >= 14) {
            active = false;
            saveGameScore('bobble', score); // 랭킹 저장 (v37)
            return;
        }

        checkMatch(bestR, bestC, shooting.color);
        dropOrphans();
        shooting = null;
    } else {
        drawBubble(shooting.x, shooting.y, shooting.color);
    }
}

function checkMatch(row, col, color) {
    var group = [], queue = [{r: row, c: col}], visited = new Set([row + ',' + col]);
    while(queue.length > 0) {
        var p = queue.shift();
        if (grid[p.r] && grid[p.r][p.c] === color) {
            group.push(p);
            getNeighbors(p.r, p.c).forEach(n => {
                if (!visited.has(n.r + ',' + n.c) && grid[n.r] && grid[n.r][n.c] === color) {
                    visited.add(n.r + ',' + n.c); queue.push(n);
                }
            });
        }
    }
    if (group.length >= 3) {
        group.forEach(p => { 
            createPopEffect(p.r, p.c, grid[p.r][p.c]);
            grid[p.r][p.c] = null; 
        });
        score += group.length * 100;
        updateScore();
    }
}

function getNeighbors(r, c) {
    var neighbors = [];
    var isEven = (r % 2 === 0);
    var ds = isEven ? [[-1, 0], [-1, -1], [0, -1], [0, 1], [1, 0], [1, -1]] 
                    : [[-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1]];
    ds.forEach(d => {
        var nr = r + d[0], nc = c + d[1];
        if (nr >= 0 && nc >= 0 && nc < 10) neighbors.push({r: nr, c: nc});
    });
    return neighbors;
}

function dropOrphans() {
    var connected = new Set();
    var queue = [];
    if (grid[0]) {
        for(var c=0; c<10; c++) {
            if (grid[0][c]) { connected.add('0,'+c); queue.push({r:0, c:c}); }
        }
    }
    while(queue.length > 0) {
        var p = queue.shift();
        getNeighbors(p.r, p.c).forEach(n => {
            if (!connected.has(n.r+','+n.c) && grid[n.r] && grid[n.r][n.c]) {
                connected.add(n.r+','+n.c); queue.push(n);
            }
        });
    }
    for(var r=0; r<grid.length; r++) {
        if (!grid[r]) continue;
        for(var c=0; c<10; c++) {
            if (grid[r][c] && !connected.has(r+','+c)) {
                var pos = getBubblePos(r, c);
                // vx를 랜덤하게 주어 흩어지게 함, vy는 살짝 튀어오르는 느낌으로 시작
                fallingBubbles.push({ 
                    x: pos.x, y: pos.y, 
                    vx: (Math.random() - 0.5) * 8, 
                    vy: -2 - Math.random() * 3, 
                    color: grid[r][c] 
                });
                grid[r][c] = null;
                score += 50;
            }
        }
    }
    updateScore();
}

function updateFallingBubbles() {
    for (var i = fallingBubbles.length - 1; i >= 0; i--) {
        var b = fallingBubbles[i];
        b.x += b.vx; b.y += b.vy; b.vy += 0.5; // 중력 및 수평 속도 적용
        if (b.y > canvas.height + BUBBLE_RADIUS || b.x < -BUBBLE_RADIUS || b.x > canvas.width + BUBBLE_RADIUS) {
            fallingBubbles.splice(i, 1);
        } else {
            drawBubble(b.x, b.y, b.color);
        }
    }
}

function createPopEffect(r, c, color) {
    var pos = getBubblePos(r, c);
    for (var i = 0; i < 8; i++) {
        particles.push({
            x: pos.x, y: pos.y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            life: 1.0, color: color
        });
    }
}

function updateParticles() {
    for (var i = particles.length - 1; i >= 0; i--) {
        var p = particles[i];
        p.x += p.vx; p.y += p.vy; p.life -= 0.05;
        if (p.life <= 0) particles.splice(i, 1);
        else {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, 4, 4);
            ctx.globalAlpha = 1.0;
        }
    }
}

function updateScore() {
    document.getElementById('game-score').innerText = score;
    var hs = parseInt(localStorage.getItem('bubbleHighScore') || '0');
    if (score > hs) {
        localStorage.setItem('bubbleHighScore', score);
        document.getElementById('high-score').innerText = score;
    }
}
