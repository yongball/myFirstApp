/* auth.js - 인증 및 공통 로직 */
function navigateTo(url) {
    window.location.href = url;
}

function handleGuestLogin() {
    localStorage.setItem('name', '게스트');
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
function openGameSelect() { document.getElementById('game-select-modal').style.display = 'flex'; }
function closeGameSelect() { document.getElementById('game-select-modal').style.display = 'none'; }
