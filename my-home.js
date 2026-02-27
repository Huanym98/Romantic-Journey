const STORAGE_KEY = 'romanticJourneyState';
const CURRENT_USER_KEY = 'romanticJourneyCurrentUser';
const SOCIAL_KEY = 'romanticJourneySocial';
const LANG_KEY = 'romanticJourneyLang';
const defaultAvatar = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=160&q=80';

const mediaForm = document.querySelector('#mediaForm');
const mediaType = document.querySelector('#mediaType');
const coverFileInput = document.querySelector('#coverFile');
const checkinInput = document.querySelector('#checkinInput');
const checkinNowBtn = document.querySelector('#checkinNowBtn');
const mediaList = document.querySelector('#mediaList');
const mediaTemplate = document.querySelector('#mediaTemplate');
const countryList = document.querySelector('#countryList');
const badgeList = document.querySelector('#badgeList');
const currentNickname = document.querySelector('#currentNickname');
const headerAvatar = document.querySelector('#profileToggle img');
const langSelect = document.querySelector('#langSelect');

const currentUser = requireCurrentNickname();
let state = loadState();
let social = loadSocial();

if (currentNickname) currentNickname.textContent = currentUser;
if (headerAvatar) headerAvatar.src = state.profile?.avatar || defaultAvatar;
if (langSelect) {
  langSelect.value = localStorage.getItem(LANG_KEY) || 'zh-CN';
  langSelect.addEventListener('change', () => localStorage.setItem(LANG_KEY, langSelect.value));
}

updateMediaInputByType();
render();

mediaType?.addEventListener('change', updateMediaInputByType);
checkinNowBtn?.addEventListener('click', () => {
  if (!checkinInput) return;
  checkinInput.value = `${checkinInput.value || '当前位置'} · ${formatTime(new Date().toISOString())}`;
});

mediaForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(mediaForm).entries());
  const type = String(data.type);
  const location = String(data.location || '').trim();
  const caption = String(data.caption || '').trim();
  const checkin = String(data.checkin || '').trim();
  const files = Array.from(coverFileInput.files || []);
  const allowed = type === '视频' ? files.filter((file) => file.type.startsWith('video/')) : files.filter((file) => file.type.startsWith('image/'));
  if (!allowed.length) return;

  const payload = [];
  for (const [index, file] of allowed.entries()) {
    payload.push({
      id: crypto.randomUUID(),
      type,
      location,
      cover: await fileToDataUrl(file),
      caption: type === '图片' && allowed.length > 1 ? `${caption} · ${index + 1}` : caption,
      createdAt: new Date().toISOString(),
      checkin: checkin || `${location} · ${formatTime(new Date().toISOString())}`,
      user: currentUser,
      likes: []
    });
  }

  state.mediaPosts = [...payload, ...state.mediaPosts].slice(0, 30);
  persist();
  mediaForm.reset();
  updateMediaInputByType();
  render();
});

mediaList?.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const id = button.closest('[data-id]')?.dataset.id;
  const post = state.mediaPosts.find((item) => item.id === id);
  if (!post) return;

  if (button.dataset.action === 'delete-media') {
    state.mediaPosts = state.mediaPosts.filter((item) => item.id !== id);
    persist();
    render();
    return;
  }

  if (button.dataset.action === 'like-media') {
    post.likes = Array.isArray(post.likes) ? post.likes : [];
    const liked = post.likes.includes(currentUser);
    post.likes = liked ? post.likes.filter((name) => name !== currentUser) : [...post.likes, currentUser];
    persist();
    render();
  }
});

function render() {
  renderMedia();
  renderCountries();
  renderBadges();
  if (headerAvatar) headerAvatar.src = state.profile?.avatar || defaultAvatar;
}

function renderMedia() {
  mediaList.innerHTML = '';
  state.mediaPosts.forEach((post) => {
    const fragment = mediaTemplate.content.cloneNode(true);
    const article = fragment.querySelector('.media-item');
    article.dataset.id = post.id;
    const coverEl = fragment.querySelector('img');
    if (post.type === '视频') {
      coverEl.src = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80';
      coverEl.alt = '视频封面';
    } else {
      coverEl.src = post.cover;
      coverEl.alt = post.caption;
    }
    fragment.querySelector('.media-title').textContent = post.caption;
    fragment.querySelector('.media-meta').textContent = `${post.type} · ${post.location} · ${formatTime(post.createdAt)}`;
    fragment.querySelector('.media-checkin').textContent = `📍 ${post.checkin || `${post.location} · ${formatTime(post.createdAt)}`}`;
    fragment.querySelector('.media-like').textContent = `👍 赞主页 (${(post.likes || []).length})`;
    mediaList.append(fragment);
  });
}

function countryToFlag(country) {
  const map = { 中国: '🇨🇳', 美国: '🇺🇸', 日本: '🇯🇵', 韩国: '🇰🇷', 英国: '🇬🇧', 法国: '🇫🇷', 德国: '🇩🇪', 意大利: '🇮🇹', 西班牙: '🇪🇸', 瑞士: '🇨🇭', 冰岛: '🇮🇸', 泰国: '🇹🇭', 新加坡: '🇸🇬', 马来西亚: '🇲🇾', 印度尼西亚: '🇮🇩', 澳大利亚: '🇦🇺', 新西兰: '🇳🇿', 加拿大: '🇨🇦' };
  return map[country] || '🌍';
}

function renderCountries() {
  const countries = [...new Set(state.mediaPosts.map((post) => post.location).filter(Boolean))];
  countryList.innerHTML = countries.length
    ? countries.map((country) => `<span class="country-pill">${countryToFlag(country)} ${country}</span>`).join('')
    : '<p class="hint">先发布一条旅行图片/视频，点亮你的国家足迹。</p>';
}

function renderBadges() {
  const badges = [];
  if (state.actions?.like?.length) badges.push(['👍 人气观察员', '第一次给行程点赞']);
  if (state.mediaPosts.length) badges.push(['📸 旅行记录官', '首次上传图片/视频内容']);
  if (state.mediaPosts.some((post) => isOverseas(post.location))) badges.push(['✈️ 出境初体验', '首次记录出国旅行']);
  if (getFriends().length) badges.push(['🫶 默契好友', '至少互相关注 1 位好友']);
  badgeList.innerHTML = badges.length
    ? badges.map(([name, desc]) => `<article class="badge-item"><h4>${name}</h4><p>${desc}</p></article>`).join('')
    : '<p class="hint">完成互动后可解锁你的旅行勋章。</p>';
}

function getFriends() {
  const follows = social.follows || {};
  const mine = new Set(follows[currentUser] || []);
  return [...mine].filter((name) => (follows[name] || []).includes(currentUser));
}

function updateMediaInputByType() {
  if (!mediaType || !coverFileInput) return;
  if (mediaType.value === '视频') {
    coverFileInput.accept = 'video/*';
    coverFileInput.multiple = false;
  } else {
    coverFileInput.accept = 'image/*';
    coverFileInput.multiple = true;
  }
}

function requireCurrentNickname() {
  const nickname = localStorage.getItem(CURRENT_USER_KEY);
  if (!nickname) {
    window.location.href = 'register.html';
    throw new Error('No current user');
  }
  return nickname;
}

function userStorageKey() { return `${STORAGE_KEY}:${currentUser}`; }

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(userStorageKey()) || '{}');
    return {
      profile: parsed.profile || { avatar: defaultAvatar },
      actions: parsed.actions || { like: [], dislike: [], save: [] },
      mediaPosts: Array.isArray(parsed.mediaPosts) ? parsed.mediaPosts : []
    };
  } catch {
    return { profile: { avatar: defaultAvatar }, actions: { like: [], dislike: [], save: [] }, mediaPosts: [] };
  }
}

function loadSocial() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SOCIAL_KEY) || '{}');
    return {
      follows: parsed.follows && typeof parsed.follows === 'object' ? parsed.follows : {}
    };
  } catch {
    return { follows: {} };
  }
}

function persist() {
  const raw = localStorage.getItem(userStorageKey());
  const base = raw ? JSON.parse(raw) : {};
  base.profile = state.profile;
  base.actions = state.actions;
  base.mediaPosts = state.mediaPosts;
  localStorage.setItem(userStorageKey(), JSON.stringify(base));
}

function isOverseas(location) {
  const cn = ['北京', '上海', '广州', '深圳', '成都', '杭州', '重庆', '西安', '南京', '武汉', '苏州', '长沙'];
  return location && !cn.some((city) => String(location).includes(city));
}
function formatTime(iso) {
  const date = new Date(iso);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day} ${hour}:${minute}`;
}
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
