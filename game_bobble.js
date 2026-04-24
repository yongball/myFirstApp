/* game_bobble.js - 스테이지 시스템 도입 및 버그 수정 (v40) */
var canvas, ctx, animId;
var score = 0, active = false, stage = 1;
var grid = [], shooting = null, nextColor = '#39ff14';
var mouse = { x: 160, y: 0 };
var particles = []; 
var fallingBubbles = []; 
var baseColors = ['#39ff14', '#ff00ff', '#00ffff', '#ffff00', '#ff0000'];
var currentColors = [...baseColors];
var BUBBLE_RADIUS = 16;
var ROW_HEIGHT = 28;

function startGame() {
    canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    score = 0; stage = 1; currentColors = [...baseColors];
    
    document.getElementById('game-score').innerText = '0';
    document.getElementById('high-score').innerText = (localStorage.getItem('bubbleHighScore') || '0');

    canvas.onmousemove = function(e) {
        var rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left; mouse.y = e.clientY - rect.top;
    };
    canvas.onclick = function() {
        if (shooting || !active) return;
        var angle = Math.atan2(mouse.y - (canvas.height - 25), mouse.x - 160);
        // 속도를 약간 증가
        shooting = { x: 160, y: canvas.height - 25, vx: Math.cos(angle) * 14, vy: Math.sin(angle) * 14, color: nextColor };
        nextColor = currentColors[Math.floor(Math.random() * currentColors.length)];
    };
    
    initStage();
}

function initStage() {
    active = true; grid = []; shooting = null; particles = []; fallingBubbles = [];
    
    // 스테이지가 오를수록 시작 줄 수가 늘어남 (최대 12줄)
    var rowsToFill = Math.min(5 + stage, 12); 
    
    // 난이도 상승: 색상 추가
    if (stage === 3 && currentColors.length === 5) currentColors.push('#ffaa00'); // 주황
    if (stage === 5 && currentColors.length === 6) currentColors.push('#ffffff'); // 하양

    for(var r = 0; r < rowsToFill; r++) {
        grid[r] = [];
        var cols = (r % 2 === 0) ? 10 : 9; // 버그 수정: 홀수 줄은 9개로 제한하여 캔버스 이탈 방지
        for(var c = 0; c < cols; c++) grid[r][c] = currentColors[Math.floor(Math.random() * currentColors.length)];
    }
    nextColor = currentColors[Math.floor(Math.random() * currentColors.length)];
    
    if (animId) cancelAnimationFrame(animId);
    loop();
}

function loop() {
    if (!active) return;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 배경 그리드 텍스처 (옵션)
    ctx.strokeStyle = '#111'; ctx.lineWidth = 1;
    for(var i=0; i<=10; i++) { ctx.beginPath(); ctx.moveTo(i*32, 0); ctx.lineTo(i*32, 480); ctx.stroke(); }

    drawGrid();
    if (shooting) updateShooting();
    updateFallingBubbles(); 
    updateParticles();
    
    // 현재 점수 및 스테이지 표시
    ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.font = '20px sans-serif'; ctx.textAlign = 'right';
    ctx.fillText('STAGE ' + stage, canvas.width - 10, canvas.height - 10);

    // 발사기 그리기
    drawBubble(160, canvas.height - 25, nextColor);
    ctx.setLineDash([5, 5]); ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath(); ctx.moveTo(160, canvas.height - 25); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
    ctx.setLineDash([]);
    
    animId = requestAnimationFrame(loop);
}

function drawBubble(x, y, color) {
    if (!color) return;
    ctx.beginPath(); ctx.arc(x, y, BUBBLE_RADIUS - 2, 0, Math.PI * 2);
    ctx.fillStyle = color; ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
    // 광택
    ctx.beginPath(); ctx.arc(x - 5, y - 5, 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fill();
}

function drawGrid() {
    for(var r = 0; r < grid.length; r++) {
        if (!grid[r]) continue;
        var cols = (r % 2 === 0) ? 10 : 9;
        for(var c = 0; c < cols; c++) {
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
    if (shooting.y < BUBBLE_RADIUS) collided = true; // 천장 충돌
    else {
        for (var r = 0; r < grid.length + 1; r++) {
            var cols = (r % 2 === 0) ? 10 : 9;
            for (var c = 0; c < cols; c++) {
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
        var maxC = (bestR % 2 === 0) ? 9 : 8;
        var bestC = Math.max(0, Math.min(Math.round((shooting.x - BUBBLE_RADIUS - off) / (BUBBLE_RADIUS * 2)), maxC));
        if (bestR < 0) bestR = 0;
        if (!grid[bestR]) grid[bestR] = [];
        grid[bestR][bestC] = shooting.color;
        
        // 게임 오버 체크 (14행 이상 내려오면 종료)
        if (bestR >= 14) {
            active = false;
            saveGameScore('bobble', score);
            return;
        }

        checkMatch(bestR, bestC, shooting.color);
        dropOrphans();
        checkWinCondition(); // 승리 조건(클리어) 체크
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
        var maxCols = (nr % 2 === 0) ? 10 : 9;
        if (nr >= 0 && nc >= 0 && nc < maxCols) neighbors.push({r: nr, c: nc});
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
        var cols = (r % 2 === 0) ? 10 : 9;
        for(var c=0; c<cols; c++) {
            if (grid[r][c] && !connected.has(r+','+c)) {
                var pos = getBubblePos(r, c);
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

function checkWinCondition() {
    var empty = true;
    for (var r=0; r<grid.length; r++) {
        if (grid[r] && grid[r].some(v => v !== null && v !== undefined)) { 
            empty = false; break; 
        }
    }
    if (empty) {
        active = false; // 게임 일시 정지
        score += 1000 * stage; // 클리어 보너스
        updateScore();
        
        // 스테이지 클리어 모달 호출 (v40)
        showStageClearModal('bobble', score, 
            () => { stage++; initStage(); }, // NEXT STAGE
            () => { saveGameScore('bobble', score); } // SAVE SCORE
        );
    }
}

function updateFallingBubbles() {
    for (var i = fallingBubbles.length - 1; i >= 0; i--) {
        var b = fallingBubbles[i];
        b.x += b.vx; b.y += b.vy; b.vy += 0.5; 
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

