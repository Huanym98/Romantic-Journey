const STORAGE_KEY = 'romanticJourneyState';
const CURRENT_USER_KEY = 'romanticJourneyCurrentUser';
const SOCIAL_KEY = 'romanticJourneySocial';
const LANG_KEY = 'romanticJourneyLang';
const ADMIN_EVENTS_KEY = 'romanticJourneyAdminEvents';
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
const profileToggle = document.querySelector('#profileToggle');
const headerAvatar = document.querySelector('#profileToggle img');
const langSelect = document.querySelector('#langSelect');
const myTripsList = document.querySelector('#myTripsList');

const profilePanel = document.querySelector('#profilePanel');
const panelClose = document.querySelector('#panelClose');
const profileForm = document.querySelector('#profileForm');
const avatarPreview = document.querySelector('#avatarPreview');
const avatarFile = document.querySelector('#avatarFile');
const avatarPickBtn = document.querySelector('#avatarPickBtn');
const switchAccountBtn = document.querySelector('#switchAccountBtn');
const logoutBtn = document.querySelector('#logoutBtn');

const likerDialog = document.querySelector('#likerDialog');
const likerDialogClose = document.querySelector('#likerDialogClose');
const likerAvatar = document.querySelector('#likerAvatar');
const likerMeta = document.querySelector('#likerMeta');
const likerRelation = document.querySelector('#likerRelation');
const likerSkills = document.querySelector('#likerSkills');
const likerHomeBtn = document.querySelector('#likerHomeBtn');

const currentUser = requireCurrentNickname();
let state = loadState();
let social = loadSocial();

if (currentNickname) currentNickname.textContent = currentUser;
if (headerAvatar) headerAvatar.src = state.profile?.avatar || defaultAvatar;
if (langSelect) {
  langSelect.value = localStorage.getItem(LANG_KEY) || 'zh-CN';
  langSelect.addEventListener('change', () => localStorage.setItem(LANG_KEY, langSelect.value));
}

hydrateProfileForm();
updateMediaInputByType();
render();

profileToggle?.addEventListener('click', () => {
  if (!profilePanel) return;
  profilePanel.hidden ? openProfilePanel() : closeProfilePanel();
});
panelClose?.addEventListener('click', closeProfilePanel);
switchAccountBtn?.addEventListener('click', () => {
  closeProfilePanel();
  window.location.href = 'register.html';
});
logoutBtn?.addEventListener('click', () => {
  closeProfilePanel();
  localStorage.removeItem(CURRENT_USER_KEY);
  window.location.href = 'register.html';
});

document.addEventListener('click', (event) => {
  if (!profilePanel || profilePanel.hidden) return;
  if (profilePanel.contains(event.target) || profileToggle?.contains(event.target)) return;
  closeProfilePanel();
});
avatarPickBtn?.addEventListener('click', () => avatarFile?.click());
avatarFile?.addEventListener('change', async () => {
  const file = avatarFile.files?.[0];
  if (!file || !file.type.startsWith('image/')) return;
  const dataUrl = await fileToDataUrl(file);
  if (avatarPreview) avatarPreview.src = dataUrl;
  state.profile.avatar = dataUrl;
});
profileForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const form = new FormData(profileForm);
  state.profile = {
    ...state.profile,
    birthday: String(form.get('birthday') || ''),
    mbti: String(form.get('mbti') || ''),
    zodiac: String(form.get('zodiac') || ''),
    pace: String(form.get('pace') || ''),
    budgetLevel: String(form.get('budgetLevel') || ''),
    wakeUp: String(form.get('wakeUp') || ''),
    social: String(form.get('social') || '')
  };
  persist();
  render();
  closeProfilePanel();
});

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
  recordAdminEvent('publish-diary', { count: payload.length });
  persist();
  mediaForm.reset();
  updateMediaInputByType();
  render();
});

mediaList?.addEventListener('click', (event) => {
  const likerAvatarEl = event.target.closest('.liker-chip img[data-user]');
  if (likerAvatarEl) {
    openLikerDialog(likerAvatarEl.dataset.user || '');
    return;
  }

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

myTripsList?.addEventListener('click', (event) => {
  const tripCard = event.target.closest('[data-trip-id]');
  if (!tripCard) return;
  const tripId = tripCard.dataset.tripId;
  const actionBtn = event.target.closest('button[data-action]');
  if (actionBtn?.dataset.action === 'delete-trip') {
    state.trips = state.trips.filter((trip) => trip.id !== tripId);
    recordAdminEvent('delete-trip', { tripId });
    persist();
    render();
    return;
  }
  window.location.href = `trip-detail.html?id=${encodeURIComponent(tripId)}&user=${encodeURIComponent(currentUser)}`;
});


likerDialogClose?.addEventListener('click', () => likerDialog?.close());

function openLikerDialog(nickname) {
  if (!likerDialog || !nickname) return;
  const userState = loadStateByNickname(nickname);
  const profile = userState?.profile || {};
  if (likerAvatar) likerAvatar.src = profile.avatar || defaultAvatar;
  if (likerMeta) likerMeta.textContent = `${nickname} ｜ MBTI: ${profile.mbti || '未知'} ｜ 星座: ${profile.zodiac || '未知'}`;
  if (likerRelation) likerRelation.textContent = `旅行节奏：${profile.pace || '未知'} ｜ 作息：${profile.wakeUp || '未知'}`;
  const skills = Array.isArray(profile.skills) && profile.skills.length ? profile.skills.join('、') : '暂无';
  if (likerSkills) likerSkills.textContent = `技能标签：${skills}`;
  if (likerHomeBtn) likerHomeBtn.onclick = () => { window.location.href = `account.html?user=${encodeURIComponent(nickname)}`; };
  likerDialog.showModal();
}

function loadStateByNickname(nickname) {
  try {
    const parsed = JSON.parse(localStorage.getItem(`${STORAGE_KEY}:${nickname}`) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function render() {
  renderMedia();
  renderCountries();
  renderBadges();
  renderMyTrips();
  if (headerAvatar) headerAvatar.src = state.profile?.avatar || defaultAvatar;
  if (avatarPreview) avatarPreview.src = state.profile?.avatar || defaultAvatar;
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
    const likes = Array.isArray(post.likes) ? post.likes : [];
    fragment.querySelector('.media-like').textContent = `👍 赞主页 (${likes.length})`;
    const likersEl = fragment.querySelector('.media-likers');
    if (likersEl) {
      likersEl.innerHTML = likes.length
        ? likes.map((nickname) => {
          const avatar = getUserAvatarByNickname(nickname);
          return `<span class="liker-chip" title="${escapeHtml(nickname)}"><img data-user="${escapeHtml(nickname)}" src="${escapeHtml(avatar)}" alt="${escapeHtml(nickname)}头像" /><small>${escapeHtml(nickname)}</small></span>`;
        }).join('')
        : '<p class="hint">还没有人点赞</p>';
    }
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

function renderMyTrips() {
  if (!myTripsList) return;
  const myTrips = (Array.isArray(state.trips) ? state.trips : []).filter((trip) => trip.user === currentUser);
  myTripsList.innerHTML = myTrips.length
    ? myTrips.map((trip) => `
      <article class="msg-item my-trip-item" data-trip-id="${trip.id}">
        <div class="my-trip-head">
          <strong>${escapeHtml(trip.destination || '未知目的地')}</strong>
          <button class="danger" data-action="delete-trip" type="button">删除</button>
        </div>
        <p class="hint">${escapeHtml(trip.departDate || '未知')} → ${escapeHtml(trip.returnDate || '未知')} ｜ 预算 ¥${escapeHtml(trip.budget || 0)}</p>
        <p class="hint">发布者：${escapeHtml(trip.user || currentUser)} ｜ 点赞：${trip.likeCount || 0} ｜ 评论：${Array.isArray(trip.comments) ? trip.comments.length : 0}</p>
        <p class="hint">${escapeHtml(trip.itinerary || '暂无安排')}</p>
      </article>
    `).join('')
    : '<p class="hint">你还没有发布行程。</p>';
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

function hydrateProfileForm() {
  if (!profileForm) return;
  const profile = state.profile || {};
  profileForm.elements.birthday.value = profile.birthday || '';
  profileForm.elements.mbti.value = profile.mbti || 'ENFP';
  profileForm.elements.zodiac.value = profile.zodiac || '白羊座';
  profileForm.elements.pace.value = profile.pace || '平衡';
  profileForm.elements.budgetLevel.value = profile.budgetLevel || '舒适';
  profileForm.elements.wakeUp.value = profile.wakeUp || '自然醒';
  profileForm.elements.social.value = profile.social || '适中';
  if (avatarPreview) avatarPreview.src = profile.avatar || defaultAvatar;
}

function openProfilePanel() {
  profilePanel.hidden = false;
  profilePanel.classList.add('open');
  profileToggle?.setAttribute('aria-expanded', 'true');
}

function closeProfilePanel() {
  profilePanel.hidden = true;
  profilePanel.classList.remove('open');
  profileToggle?.setAttribute('aria-expanded', 'false');
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
      mediaPosts: Array.isArray(parsed.mediaPosts) ? parsed.mediaPosts : [],
      trips: Array.isArray(parsed.trips) ? parsed.trips : []
    };
  } catch {
    return { profile: { avatar: defaultAvatar }, actions: { like: [], dislike: [], save: [] }, mediaPosts: [], trips: [] };
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
  base.trips = state.trips;
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

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function getUserAvatarByNickname(nickname) {
  if (!nickname) return defaultAvatar;
  if (nickname === currentUser) return state.profile?.avatar || defaultAvatar;
  try {
    const parsed = JSON.parse(localStorage.getItem(`${STORAGE_KEY}:${nickname}`) || '{}');
    return parsed?.profile?.avatar || defaultAvatar;
  } catch {
    return defaultAvatar;
  }
}

function recordAdminEvent(type, payload = {}) {
  try {
    const list = JSON.parse(localStorage.getItem(ADMIN_EVENTS_KEY) || '[]');
    const next = Array.isArray(list) ? list : [];
    next.push({ id: crypto.randomUUID(), user: currentUser, type, payload, createdAt: new Date().toISOString() });
    localStorage.setItem(ADMIN_EVENTS_KEY, JSON.stringify(next.slice(-500)));
  } catch {
    // ignore
  }
}
