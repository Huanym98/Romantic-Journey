const USERS_KEY = 'romanticJourneyUsers';
const CURRENT_USER_KEY = 'romanticJourneyCurrentUser';

const registerForm = document.querySelector('#registerForm');
const accountList = document.querySelector('#accountList');
const message = document.querySelector('#registerMessage');

renderAccounts();

registerForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const nickname = String(new FormData(registerForm).get('nickname') || '').trim();
  if (!nickname) return;

  const users = getUsers();
  if (users.includes(nickname)) {
    message.textContent = '昵称已存在，请换一个昵称。';
    return;
  }

  users.push(nickname);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  localStorage.setItem(CURRENT_USER_KEY, nickname);
  window.location.href = 'index.html';
});

accountList.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-user]');
  if (!button) return;
  localStorage.setItem(CURRENT_USER_KEY, button.dataset.user);
  window.location.href = 'index.html';
});

function getUsers() {
  try {
    const parsed = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function renderAccounts() {
  const users = getUsers();
  if (!users.length) {
    accountList.innerHTML = '<p class="hint">暂无账户，请先注册一个昵称。</p>';
    return;
  }
  accountList.innerHTML = users
    .map((name) => `<button data-user="${name}" type="button">进入：${name}</button>`)
    .join('');
}
