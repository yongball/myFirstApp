/* game_mines.js - 스테이지 시스템 및 점수 기반 랭킹 도입 (v40) */
var mGrid = [], mRows = 10, mCols = 10, mCount = 15, mStage = 1, mTotalScore = 0;
var mGameOver = false, mFirst = true, mTimer = null, mSec = 0, mRem = 15;

function startMines(isNextStage = false) {
    if (!isNextStage) { mStage = 1; mCount = 15; mTotalScore = 0; }
    mGameOver = false; mFirst = true; mSec = 0; mRem = mCount;
    clearInterval(mTimer);
    document.getElementById('game-status').innerText = '🙂';
    document.getElementById('mine-timer').innerText = '000';
    document.getElementById('mine-count').innerText = ("00" + mCount).slice(-3);
    document.getElementById('remaining-count').innerText = ("00" + mCount).slice(-3);
    
    // 점수 시스템 도입으로 UI 업데이트 (최고점수는 이제 최고 점수)
    document.getElementById('high-score').innerText = (localStorage.getItem('minesHighScore') || '0');

    mGrid = [];
    var board = document.getElementById('minesBoard');
    board.innerHTML = ''; board.style.gridTemplateColumns = `repeat(${mCols}, 1fr)`;

    for (var r = 0; r < mRows; r++) {
        mGrid[r] = [];
        for (var c = 0; c < mCols; c++) {
            mGrid[r][c] = { r, c, mine: false, revealed: false, flagged: false, count: 0 };
            var cell = document.createElement('div');
            cell.id = `cell-${r}-${c}`; cell.className = "mine-cell";
            cell.onmousedown = (function(rr, cc) { return function(e) {
                if (mGameOver) return;
                document.getElementById('game-status').innerText = '😮';
                if (e.button === 0) reveal(rr, cc); else if (e.button === 2) flag(rr, cc);
            }; })(r, c);
            cell.onmouseup = () => { if (!mGameOver) document.getElementById('game-status').innerText = '🙂'; };
            cell.oncontextmenu = (e) => e.preventDefault();
            board.appendChild(cell);
        }
    }
}

function init(safeR, safeC) {
    var p = 0;
    while (p < mCount) {
        var rr = Math.floor(Math.random() * mRows), rc = Math.floor(Math.random() * mCols);
        if (!mGrid[rr][rc].mine && (Math.abs(rr-safeR)>1 || Math.abs(rc-safeC)>1)) { mGrid[rr][rc].mine = true; p++; }
    }
    for (var r = 0; r < mRows; r++) {
        for (var c = 0; c < mCols; c++) {
            if (!mGrid[r][c].mine) {
                var cnt = 0;
                for (var dr = -1; dr <= 1; dr++) { for (var dc = -1; dc <= 1; dc++) {
                    var nr = r+dr, nc = c+dc;
                    if (nr>=0 && nr<mRows && nc>=0 && nc<mCols && mGrid[nr][nc].mine) cnt++;
                } }
                mGrid[r][c].count = cnt;
            }
        }
    }
}

function reveal(r, c) {
    if (mFirst) {
        mFirst = false; init(r, c);
        mTimer = setInterval(() => { mSec++; document.getElementById('mine-timer').innerText = ("00"+mSec).slice(-3); }, 1000);
    }
    var data = mGrid[r][c]; if (data.revealed || data.flagged) return;
    data.revealed = true;
    var el = document.getElementById(`cell-${r}-${c}`);
    el.classList.add('revealed');
    if (data.mine) {
        el.innerText = '💣'; el.style.backgroundColor = '#f00';
        clearInterval(mTimer); document.getElementById('game-status').innerText = '😵';
        mGameOver = true; revealAll(); return;
    }
    if (data.count > 0) { el.innerText = data.count; el.setAttribute('data-count', data.count); }
    else {
        for (var dr = -1; dr <= 1; dr++) { for (var dc = -1; dc <= 1; dc++) {
            var nr = r+dr, nc = c+dc; if (nr>=0 && nr<mRows && nc>=0 && nc<mCols) reveal(nr, nc);
        } }
    }
    checkWin();
}

function flag(r, c) {
    var data = mGrid[r][c]; if (data.revealed) return;
    data.flagged = !data.flagged;
    var el = document.getElementById(`cell-${r}-${c}`);
    el.innerText = data.flagged ? '🚩' : '';
    mRem += data.flagged ? -1 : 1;
    var s = ("00" + Math.max(0, mRem)).slice(-3);
    document.getElementById('mine-count').innerText = s;
    document.getElementById('remaining-count').innerText = s;
}

function revealAll() {
    for (var r = 0; r < mRows; r++) { for (var c = 0; c < mCols; c++) {
        var el = document.getElementById(`cell-${r}-${c}`);
        if (mGrid[r][c].mine) { if (!mGrid[r][c].flagged) el.innerText = '💣'; }
        else if (mGrid[r][c].flagged) el.innerText = '❌';
    } }
}

function checkWin() {
    var win = true;
    for (var r = 0; r < mRows; r++) { for (var c = 0; c < mCols; c++) {
        if (!mGrid[r][c].mine && !mGrid[r][c].revealed) win = false;
    } }
    if (win) {
        clearInterval(mTimer); document.getElementById('game-status').innerText = '😎';
        mGameOver = true;
        
        // 점수 계산: (지뢰 1개당 100점) + (보너스: 100초 이내 클리어 시 남은 시간 * 10점)
        let stageScore = (mCount * 100) + Math.max(0, 100 - mSec) * 10;
        mTotalScore += stageScore;
        
        var best = parseInt(localStorage.getItem('minesHighScore') || '0');
        if (mTotalScore > best) { 
            localStorage.setItem('minesHighScore', mTotalScore.toString()); 
            document.getElementById('high-score').innerText = mTotalScore; 
        }
        
        showStageClearModal('mines', mTotalScore, 
            () => { mStage++; mCount += 5; startMines(true); }, // NEXT STAGE
            () => { saveGameScore('mines', mTotalScore); } // SAVE SCORE
        );
    }
}
