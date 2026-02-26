const USERS_KEY = 'romanticJourneyUsers';
const CURRENT_USER_KEY = 'romanticJourneyCurrentUser';

const registerForm = document.querySelector('#registerForm');
const message = document.querySelector('#registerMessage');

registerForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const form = new FormData(registerForm);
  const nickname = String(form.get('nickname') || '').trim();
  const password = String(form.get('password') || '').trim();
  if (!nickname || !password) return;

  const users = getUsers();
  const existing = users.find((user) => user.nickname === nickname);

  if (existing) {
    if (existing.password !== password) {
      message.textContent = '昵称已存在，但密码错误。';
      return;
    }
    localStorage.setItem(CURRENT_USER_KEY, existing.nickname);
    window.location.href = 'index.html';
    return;
  }

  users.push({
    nickname,
    password,
    firstLogin: true
  });
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  localStorage.setItem(CURRENT_USER_KEY, nickname);
  window.location.href = 'index.html';
});

function getUsers() {
  try {
    const parsed = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    if (!parsed.length) return [];

    if (typeof parsed[0] === 'string') {
      return parsed.map((nickname) => ({
        nickname,
        password: '123456',
        firstLogin: false
      }));
    }

    return parsed
      .map((user) => ({
        nickname: user.nickname || user.username,
        password: user.password || '123456',
        firstLogin: Boolean(user.firstLogin)
      }))
      .filter((user) => user.nickname);
  } catch {
    return [];
  }
}
