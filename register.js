const USERS_KEY = 'romanticJourneyUsers';
const CURRENT_USER_KEY = 'romanticJourneyCurrentUser';
const LANG_KEY = 'romanticJourneyLang';

const registerForm = document.querySelector('#registerForm');
const message = document.querySelector('#registerMessage');
const langSelect = document.querySelector('#langSelect');

const I18N = {
  'zh-CN': {
    title: 'Romantic Journey · 登录 / 注册',
    heading: '账号登录 / 注册',
    hint: '输入昵称和密码后，系统会自动判断是新注册还是已有账号登录。',
    nicknameLabel: '昵称（展示名，需唯一）',
    nicknamePlaceholder: '输入昵称，例如：旅行喵喵',
    passwordLabel: '密码',
    passwordPlaceholder: '至少8位，含大小写字母+数字+符号',
    submit: '继续',
    suggestion: '密码复杂度建议：至少8位，包含大写、小写、数字和特殊符号。',
    wrongPassword: '昵称已存在，但密码错误。',
    min8: '密码至少 8 位。',
    needUpper: '密码需包含大写字母。',
    needLower: '密码需包含小写字母。',
    needNumber: '密码需包含数字。',
    needSymbol: '密码需包含特殊符号。'
  },
  en: {
    title: 'Romantic Journey · Sign in / Sign up',
    heading: 'Sign in / Sign up',
    hint: 'Enter nickname and password. The app will detect whether to log in or create a new account.',
    nicknameLabel: 'Nickname (display name, unique)',
    nicknamePlaceholder: 'Enter nickname, e.g. TravelCat',
    passwordLabel: 'Password',
    passwordPlaceholder: 'At least 8 chars with upper/lowercase, number and symbol',
    submit: 'Continue',
    suggestion: 'Password suggestion: at least 8 characters, including uppercase, lowercase, number and symbol.',
    wrongPassword: 'Nickname exists, but password is incorrect.',
    min8: 'Password must be at least 8 characters.',
    needUpper: 'Password must include an uppercase letter.',
    needLower: 'Password must include a lowercase letter.',
    needNumber: 'Password must include a number.',
    needSymbol: 'Password must include a symbol.'
  }
};

let currentLang = localStorage.getItem(LANG_KEY) || 'zh-CN';
if (!I18N[currentLang]) currentLang = 'zh-CN';
const t = (k) => I18N[currentLang][k] || I18N['zh-CN'][k] || k;

function applyI18n() {
  document.documentElement.lang = currentLang;
  document.title = t('title');
  if (langSelect) langSelect.value = currentLang;
  const h1 = document.querySelector('.auth-card h1');
  const hints = document.querySelectorAll('.auth-card .hint');
  const nickLabel = document.querySelector('label.full-width:first-child');
  const nickInput = document.querySelector('input[name="nickname"]');
  const pwdLabel = document.querySelector('label.full-width:nth-child(2)');
  const pwdInput = document.querySelector('input[name="password"]');
  const submit = document.querySelector('#registerForm button[type="submit"]');
  if (h1) h1.textContent = t('heading');
  if (hints[0]) hints[0].textContent = t('hint');
  if (hints[1]) hints[1].textContent = t('suggestion');
  if (nickLabel) nickLabel.childNodes[0].nodeValue = t('nicknameLabel');
  if (nickInput) nickInput.placeholder = t('nicknamePlaceholder');
  if (pwdLabel) pwdLabel.childNodes[0].nodeValue = t('passwordLabel');
  if (pwdInput) pwdInput.placeholder = t('passwordPlaceholder');
  if (submit) submit.textContent = t('submit');
}

applyI18n();
if (langSelect) {
  langSelect.value = currentLang;
  langSelect.addEventListener('change', () => {
    currentLang = langSelect.value;
    localStorage.setItem(LANG_KEY, currentLang);
    applyI18n();
  });
}

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
      message.textContent = t('wrongPassword');
      return;
    }
    localStorage.setItem(CURRENT_USER_KEY, existing.nickname);
    window.location.href = 'index.html';
    return;
  }

  const complexity = validatePasswordComplexity(password);
  if (!complexity.ok) {
    message.textContent = complexity.message;
    return;
  }

  users.push({ nickname, password, firstLogin: true });
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
      return parsed.map((nickname) => ({ nickname, password: '123456', firstLogin: false }));
    }

    return parsed
      .map((user) => ({ nickname: user.nickname || user.username, password: user.password || '123456', firstLogin: Boolean(user.firstLogin) }))
      .filter((user) => user.nickname);
  } catch {
    return [];
  }
}

function validatePasswordComplexity(password) {
  if (password.length < 8) return { ok: false, message: t('min8') };
  if (!/[A-Z]/.test(password)) return { ok: false, message: t('needUpper') };
  if (!/[a-z]/.test(password)) return { ok: false, message: t('needLower') };
  if (!/[0-9]/.test(password)) return { ok: false, message: t('needNumber') };
  if (!/[^A-Za-z0-9]/.test(password)) return { ok: false, message: t('needSymbol') };
  return { ok: true, message: '' };
}
