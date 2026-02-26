const USERS_KEY = 'romanticJourneyUsers';
const CURRENT_USER_KEY = 'romanticJourneyCurrentUser';

const registerForm = document.querySelector('#registerForm');
const message = document.querySelector('#registerMessage');

registerForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const form = new FormData(registerForm);
  const nickname = String(form.get('nickname') || '').trim();
  const username = String(form.get('username') || '').trim();
  const password = String(form.get('password') || '').trim();
  if (!nickname || !username || !password) return;

  const users = getUsers();
  const existingByUsername = users.find((user) => user.username === username);

  if (existingByUsername) {
    if (existingByUsername.password !== password) {
      message.textContent = '账号已存在，但密码错误。';
      return;
    }
    localStorage.setItem(CURRENT_USER_KEY, existingByUsername.username);
    window.location.href = 'index.html';
    return;
  }

  if (users.some((user) => user.nickname === nickname)) {
    message.textContent = '昵称已被使用，请换一个昵称。';
    return;
  }

  users.push({
    username,
    password,
    nickname,
    firstLogin: true
  });
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  localStorage.setItem(CURRENT_USER_KEY, username);
  window.location.href = 'index.html';
});

function getUsers() {
  try {
    const parsed = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    if (!parsed.length) return [];

    if (typeof parsed[0] === 'string') {
      return parsed.map((nickname) => ({
        username: nickname,
        nickname,
        password: '123456',
        firstLogin: false
      }));
    }

    return parsed.map((user) => ({
      username: user.username,
      nickname: user.nickname || user.username,
      password: user.password || '123456',
      firstLogin: Boolean(user.firstLogin)
    })).filter((user) => user.username);
  } catch {
    return [];
  }
}
