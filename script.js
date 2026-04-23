function navigateTo(url) {
    window.location.href = url;
}

function handleSignup(event) {
    event.preventDefault(); // 폼 제출 시 페이지 새로고침 방지

    // 입력된 각 항목의 데이터 가져오기
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;

    // 비밀번호 확인 체크
    if (password !== passwordConfirm) {
        alert('비밀번호가 일치하지 않습니다.');
        return;
    }

    // 사용자 객체 생성
    const userData = {
        name: name,
        email: email,
        password: password,
        createdAt: new Date().toISOString()
    };

    // 기존 사용자 목록 가져오기 (없으면 빈 배열)
    const users = JSON.parse(localStorage.getItem('users') || '[]');

    // 이메일 중복 체크
    if (users.some(user => user.email === email)) {
        alert('이미 가입된 이메일입니다.');
        return;
    }

    // 새로운 사용자 추가 및 저장
    users.push(userData);
    localStorage.setItem('users', JSON.stringify(users));

    alert('회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.');
    navigateTo('index.html');
}

function handleLogin() {
    const emailInput = document.getElementById('email').value;
    const passwordInput = document.getElementById('password').value;

    // 기존 사용자 목록 가져오기 (없으면 빈 배열)
    const users = JSON.parse(localStorage.getItem('users') || '[]');

    // 입력된 이메일과 비밀번호가 일치하는 사용자 찾기
    const user = users.find(u => u.email === emailInput && u.password === passwordInput);

    if (user) {
        // 대시보드 표시를 위해 로그인된 유저의 이름 임시 저장
        localStorage.setItem('name', user.name);
        // 로그인 성공 시 대시보드로 이동
        window.location.href = 'dashboard.html';
    } else {
        alert('이메일 또는 비밀번호가 일치하지 않습니다.');
    }
}

function handleGuestLogin() {
    // 게스트용 임시 이름 저장
    localStorage.setItem('name', '게스트');
    // 로그인 성공 시 대시보드로 이동
    window.location.href = 'dashboard.html';
}

function handleLogout() {
    // 로그아웃 시 로그인 상태(이름) 삭제
    localStorage.removeItem('name');
    // 로그아웃 시 로그인 페이지로 이동
    window.location.replace('index.html');
}
