/* auth.js - 인증 및 공통 로직 */
function navigateTo(url) {
    window.location.href = url;
}

function handleGuestLogin() {
    localStorage.setItem('name', '용환'); // 요청하신 대로 '용환'으로 수정
    window.location.href = 'dashboard.html';
}

function handleLogin() {
    var emailInput = document.getElementById('email');
    var passwordInput = document.getElementById('password');
    if (!emailInput || !passwordInput) return;
    
    var users = JSON.parse(localStorage.getItem('users') || '[]');
    var user = users.find(u => u.email === emailInput.value && u.password === passwordInput.value);
    
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
    
    if (password.value !== passwordConfirm.value) {
        alert('비밀번호가 일치하지 않습니다.');
        return;
    }
    
    var users = JSON.parse(localStorage.getItem('users') || '[]');
    if (users.find(u => u.email === email.value)) {
        alert('이미 가입된 이메일입니다.');
        return;
    }
    
    users.push({ name: name.value, email: email.value, password: password.value });
    localStorage.setItem('users', JSON.stringify(users));
    alert('회원가입 완료! 로그인 해주세요.');
    navigateTo('index.html');
}

/* 모달 제어 */
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
function closeItemInfo() { document.getElementById('item-modal').style.display = 'none'; }
/* 랭킹 시스템 (v37) */
function saveGameScore(gameId, score) {
    const rankings = JSON.parse(localStorage.getItem(`rankings_${gameId}`) || '[]');
    const isMines = (gameId === 'mines');
    
    // 기록 달성 여부 확인 (Top 5 이내)
    const qualifies = rankings.length < 5 || 
                     (isMines ? score < rankings[rankings.length-1].score : score > rankings[rankings.length-1].score);

    if (qualifies) {
        showRecordModal(gameId, score, rankings);
    } else {
        updateLeaderboardUI(gameId);
    }
}

function showRecordModal(gameId, score, rankings) {
    // 기존 모달이 있다면 제거
    const oldModal = document.getElementById('record-modal');
    if (oldModal) oldModal.remove();

    const modal = document.createElement('div');
    modal.id = 'record-modal';
    modal.style = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 10000; backdrop-filter: blur(5px);";
    
    modal.innerHTML = `
        <div class="container" style="width: 300px; text-align: center; border: 4px solid #ffcc00; box-shadow: 0 0 30px rgba(255, 204, 0, 0.4);">
            <h2 style="color: #ffcc00; margin-bottom: 15px; font-size: 20px;">🏆 NEW RECORD!</h2>
            <p style="font-size: 14px; color: #fff; margin-bottom: 20px;">당신의 기록: <span style="color: #ffff00; font-weight: bold;">${score}${gameId === 'mines' ? 's' : ''}</span></p>
            <input type="text" id="record-nickname" maxlength="8" placeholder="NICKNAME (8자)" 
                   style="width: 100%; padding: 12px; background: #222; border: 2px solid #555; color: #fff; text-align: center; margin-bottom: 20px; font-family: inherit;">
            <button class="btn" onclick="confirmRecord('${gameId}', ${score})" style="width: 100%;">REGISTER</button>
        </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('record-nickname').focus();
}

function confirmRecord(gameId, score) {
    const nickname = document.getElementById('record-nickname').value.trim() || '[무명]';
    const rankings = JSON.parse(localStorage.getItem(`rankings_${gameId}`) || '[]');
    
    rankings.push({ name: nickname, score: Math.floor(score), date: new Date().toLocaleDateString() });
    
    // 지뢰찾기도 점수제로 변경되었으므로 모든 게임을 내림차순(점수 높은 순) 정렬 (v40)
    rankings.sort((a, b) => b.score - a.score);
    
    localStorage.setItem(`rankings_${gameId}`, JSON.stringify(rankings.slice(0, 5)));
    
    document.getElementById('record-modal').remove();
    updateLeaderboardUI(gameId);
    
    // 대시보드로 이동 여부 (지뢰찾기 등은 alert 후 이동하므로 여기서 처리)
    setTimeout(() => {
        if (confirm('기록이 등록되었습니다! 대시보드로 돌아가시겠습니까?')) {
            window.location.href = 'dashboard.html';
        }
    }, 100);
}

function updateLeaderboardUI(gameId) {
    const listElement = document.getElementById('leaderboard-list');
    if (!listElement) return;
    
    const rankings = JSON.parse(localStorage.getItem(`rankings_${gameId}`) || '[]');
    let leaderboardHtml = '';
    rankings.forEach((r, i) => {
        leaderboardHtml += `
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 13px;">
                <span style="color: #fff;">${i+1}. ${r.name}</span>
                <span style="color: #39ff14;">${r.score}${gameId === 'mines' ? 'pts' : ''}</span>
            </div>
        `;
    });
    listElement.innerHTML = leaderboardHtml || '<div style="color: #555; font-size: 12px; text-align: center; padding: 10px;">기록이 없습니다.</div>';
}

// 통합 스테이지 클리어 모달 (v40)
function showStageClearModal(gameId, currentScore, onNextStage, onSaveScore) {
    const oldModal = document.getElementById('record-modal');
    if (oldModal) oldModal.remove();

    const modal = document.createElement('div');
    modal.id = 'record-modal';
    modal.style = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 10000; backdrop-filter: blur(5px);";
    
    modal.innerHTML = `
        <div class="container" style="width: 320px; text-align: center; border: 4px solid #39ff14; box-shadow: 0 0 30px rgba(57, 255, 20, 0.4);">
            <h2 style="color: #39ff14; margin-bottom: 15px; font-size: 22px;">🚀 CHECKPOINT!</h2>
            <p style="font-size: 14px; color: #fff; margin-bottom: 25px;">현재 달성 점수: <span style="color: #ffff00; font-weight: bold; font-size: 20px;">${currentScore}</span></p>
            <div style="display: flex; flex-direction: column; gap: 15px;">
                <button id="btn-next-stage" class="btn" style="width: 100%; border-color: #39ff14; color: #39ff14; padding: 12px; font-size: 14px;">▶ NEXT STAGE (난이도 상승)</button>
                <button id="btn-save-score" class="btn" style="width: 100%; border-color: #ffcc00; color: #ffcc00; padding: 12px; font-size: 14px;">💾 SAVE SCORE & QUIT</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('btn-next-stage').onclick = () => {
        modal.remove();
        if (typeof onNextStage === 'function') onNextStage();
    };

    document.getElementById('btn-save-score').onclick = () => {
        modal.remove();
        if (typeof onSaveScore === 'function') onSaveScore();
    };
}

function openGameSelect() {
    const modal = document.getElementById('game-select-modal');
    if (modal) {
        modal.style.display = 'flex'; // flex로 설정해야 정중앙 정렬이 작동함
    }
}

function closeGameSelect() {
    const modal = document.getElementById('game-select-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}
