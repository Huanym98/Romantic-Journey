const profileForm = document.querySelector('#profileForm');
const tripForm = document.querySelector('#tripForm');
const mediaForm = document.querySelector('#mediaForm');
const mediaType = document.querySelector('#mediaType');
const coverFileInput = document.querySelector('#coverFile');
const checkinInput = document.querySelector('#checkinInput');
const checkinNowBtn = document.querySelector('#checkinNowBtn');
const tripList = document.querySelector('#tripList');
const tripTemplate = document.querySelector('#tripTemplate');
const mediaTemplate = document.querySelector('#mediaTemplate');
const mediaList = document.querySelector('#mediaList');
const searchInput = document.querySelector('#searchInput');
const styleFilter = document.querySelector('#styleFilter');
const mbtiFilter = document.querySelector('#mbtiFilter');
const zodiacFilter = document.querySelector('#zodiacFilter');
const sortFilter = document.querySelector('#sortFilter');
const seedBtn = document.querySelector('#seedBtn');
const profileToggle = document.querySelector('#profileToggle');
const currentNickname = document.querySelector('#currentNickname');
const headerAvatar = document.querySelector('#profileToggle img');
const avatarFileInput = document.querySelector('#avatarFile');
const switchAccountBtn = document.querySelector('#switchAccountBtn');
const logoutBtn = document.querySelector('#logoutBtn');
const profilePanel = document.querySelector('#profilePanel');
const panelClose = document.querySelector('#panelClose');
const statsBox = document.querySelector('#stats');
const countryList = document.querySelector('#countryList');
const badgeList = document.querySelector('#badgeList');

const STORAGE_KEY = 'romanticJourneyState';
const USERS_KEY = 'romanticJourneyUsers';
const CURRENT_USER_KEY = 'romanticJourneyCurrentUser';
const defaultAvatar = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=160&q=80';

const sampleTrips = [
  {
    id: crypto.randomUUID(),
    user: 'Mia',
    avatar: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=200&q=80',
    destination: '纽约',
    departDate: '2026-03-06',
    returnDate: '2026-03-10',
    budget: 6800,
    tags: ['citywalk', '摄影', '美食'],
    spots: ['中央公园', '大都会博物馆', '时代广场'],
    itinerary: 'D1 上午中央公园慢走，午餐 Joe\'s Pizza，晚上时代广场夜景。D2 上午大都会博物馆，下午SoHo逛街。',
    pace: '平衡',
    wakeUp: '自然醒',
    social: '适中',
    profile: { birthday: '1998-07-14', mbti: 'ENFP', zodiac: '巨蟹座', skills: ['会拍照', '有相机', '会日语'] },
    countries: ['美国', '日本'],
    badges: ['🤝 初次结伴', '📸 旅行记录官'],
    review: { score: 4.9, count: 26, highlights: ['守时', '会拍照'] },
    trust: { score: 4.8, completion: 96, verified: true },
    likeCount: 16,
    createdAt: '2026-02-20T09:30:00.000Z'
  },
  {
    id: crypto.randomUUID(),
    user: '阿曜',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    destination: '阿那亚',
    departDate: '2026-04-01',
    returnDate: '2026-04-05',
    budget: 2800,
    tags: ['海边', '自驾', '轻徒步'],
    spots: ['礼堂', '海边市集', '沙丘美术馆'],
    itinerary: 'D1 中午集合自驾，傍晚看落日；D2 上午沙丘美术馆，午餐海鲜，晚上营地聊天。',
    pace: '慢游',
    wakeUp: '早起',
    social: '外向',
    profile: { birthday: '1995-11-02', mbti: 'ENTJ', zodiac: '天蝎座', skills: ['海外自驾经验', '有驾照', '会韩语'] },
    countries: ['中国', '韩国'],
    badges: ['✈️ 出境初体验'],
    review: { score: 4.7, count: 14, highlights: ['路线规划清晰', '沟通主动'] },
    trust: { score: 4.4, completion: 91, verified: true },
    likeCount: 11,
    createdAt: '2026-02-23T15:20:00.000Z'
  }
];

const sampleMedia = [
  {
    id: crypto.randomUUID(),
    type: '图片',
    location: '瑞士',
    cover: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=800&q=80',
    caption: '雪山火车窗景',
    createdAt: '2026-02-22T08:30:00.000Z',
    checkin: '瑞士·少女峰观景台 · 2026-02-22 08:30'
  }
];

const defaultState = {
  profile: {
    birthday: '1998-01-01',
    mbti: 'ENFP',
    zodiac: '摩羯座',
    pace: '平衡',
    budgetLevel: '舒适',
    wakeUp: '自然醒',
    social: '适中',
    skills: ['会拍照', '有相机'],
    avatar: defaultAvatar
  },
  trips: sampleTrips,
  mediaPosts: sampleMedia,
  actions: { like: [], dislike: [], save: [], connect: [] }
};

const currentNicknameAuth = requireCurrentNickname();
const users = getUsers();
const currentUserRecord = ensureUserRegistered(currentNicknameAuth, users);
persistUsers(users);
let forceProfileCompletion = Boolean(currentUserRecord.firstLogin);

let state = loadState();
hydrateProfile();
hydratePersonaFilters();
render();
syncUserChip();
updateMediaInputByType();
if (forceProfileCompletion) openProfilePanel();

profileForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(profileForm);
  const profile = Object.fromEntries(formData.entries());
  profile.skills = formData.getAll('skills');

  const avatarFile = avatarFileInput.files?.[0];
  if (avatarFile) {
    profile.avatar = await fileToDataUrl(avatarFile);
  } else {
    profile.avatar = state.profile.avatar || defaultAvatar;
  }

  if (currentUserRecord.firstLogin && !profile.avatar) {
    alert('首次登录请上传头像后再继续。');
    return;
  }

  state.profile = profile;
  if (currentUserRecord.firstLogin) {
    currentUserRecord.firstLogin = false;
    forceProfileCompletion = false;
    persistUsers(users);
  }
  persist();
  render();
  syncUserChip();
  closeProfilePanel();
});

tripForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(tripForm).entries());
  const newTrip = {
    id: crypto.randomUUID(),
    user: currentUserRecord.nickname,
    avatar: state.profile.avatar || defaultAvatar,
    destination: data.destination.trim(),
    departDate: data.departDate,
    returnDate: data.returnDate,
    budget: Number(data.budget),
    tags: toList(data.tags),
    spots: toList(data.spots),
    itinerary: data.itinerary.trim(),
    pace: data.pace,
    wakeUp: data.wakeUp,
    social: data.social,
    profile: {
      birthday: state.profile.birthday,
      mbti: state.profile.mbti,
      zodiac: state.profile.zodiac,
      skills: [...(state.profile.skills || [])]
    },
    countries: ['中国'],
    badges: ['🆕 新搭子'],
    review: { score: 5.0, count: 1, highlights: ['新用户首帖'] },
    trust: { score: 5.0, completion: 100, verified: false },
    likeCount: 0,
    createdAt: new Date().toISOString()
  };

  state.trips = [newTrip, ...state.trips];
  tripForm.reset();
  hydratePersonaFilters();
  persist();
  render();
});

mediaForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(mediaForm);
  const files = Array.from(coverFileInput.files || []);
  if (!files.length) return;

  const type = String(formData.get('type'));
  const location = String(formData.get('location')).trim();
  const checkin = String(formData.get('checkin') || '').trim();
  const caption = String(formData.get('caption')).trim();

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
      checkin: checkin || `${location} · ${formatTime(new Date().toISOString())}`
    });
  }

  state.mediaPosts = [...payload, ...state.mediaPosts].slice(0, 20);
  mediaForm.reset();
  updateMediaInputByType();
  persist();
  render();
});

seedBtn.addEventListener('click', () => {
  state = structuredClone(defaultState);
  hydrateProfile();
  hydratePersonaFilters();
  persist();
  render();
  syncUserChip();
  closeProfilePanel();
});

profileToggle.addEventListener('click', toggleProfilePanel);
panelClose.addEventListener('click', closeProfilePanel);
document.addEventListener('click', (event) => {
  if (profilePanel.hidden) return;
  if (profilePanel.contains(event.target) || profileToggle.contains(event.target)) return;
  closeProfilePanel();
});


switchAccountBtn.addEventListener('click', () => {
  closeProfilePanel();
  window.location.href = 'register.html';
});

logoutBtn.addEventListener('click', () => {
  closeProfilePanel();
  localStorage.removeItem(CURRENT_USER_KEY);
  window.location.href = 'register.html';
});

mediaType.addEventListener('change', updateMediaInputByType);
checkinNowBtn.addEventListener('click', () => {
  const location = checkinInput.value.trim() || String(mediaForm.elements.namedItem('location').value || '未命名地点');
  checkinInput.value = `${location} · ${formatTime(new Date().toISOString())}`;
});

[searchInput, styleFilter, mbtiFilter, zodiacFilter, sortFilter].forEach((el) => el.addEventListener('input', render));
[styleFilter, mbtiFilter, zodiacFilter, sortFilter].forEach((el) => el.addEventListener('change', render));

tripList.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const id = event.target.closest('[data-id]')?.dataset.id;
  const action = button.dataset.action;
  const trip = state.trips.find((item) => item.id === id);
  if (!id || !action || !trip) return;

  if (action === 'like') {
    const liked = state.actions.like.includes(id);
    state.actions.like = liked ? state.actions.like.filter((item) => item !== id) : [...state.actions.like, id];
    trip.likeCount = Math.max(0, (trip.likeCount || 0) + (liked ? -1 : 1));
  } else {
    Object.keys(state.actions).forEach((key) => {
      if (key !== action) state.actions[key] = state.actions[key].filter((item) => item !== id);
    });
    state.actions[action] = state.actions[action].includes(id)
      ? state.actions[action].filter((item) => item !== id)
      : [...state.actions[action], id];
  }

  persist();
  render();
});

mediaList.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action="delete-media"]');
  if (!button) return;
  const id = event.target.closest('[data-id]')?.dataset.id;
  if (!id) return;
  state.mediaPosts = state.mediaPosts.filter((post) => post.id !== id);
  persist();
  render();
});


function requireCurrentNickname() {
  const nickname = localStorage.getItem(CURRENT_USER_KEY);
  if (!nickname) {
    window.location.href = 'register.html';
    throw new Error('No current user');
  }
  return nickname;
}

function ensureUserRegistered(nickname, list) {
  const found = list.find((user) => user.nickname === nickname);
  if (found) return found;
  const fallback = { nickname, password: '123456', firstLogin: false };
  list.push(fallback);
  return fallback;
}

function getUsers() {
  try {
    const parsed = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    if (!parsed.length) return [];
    if (typeof parsed[0] === 'string') {
      return parsed.map((nickname) => ({ nickname, password: '123456', firstLogin: false }));
    }
    return parsed.map((user) => ({
      nickname: user.nickname || user.username,
      password: user.password || '123456',
      firstLogin: Boolean(user.firstLogin)
    })).filter((user) => user.nickname);
  } catch {
    return [];
  }
}

function persistUsers(list) {
  localStorage.setItem(USERS_KEY, JSON.stringify(list));
}

function userStorageKey() {
  return `${STORAGE_KEY}:${currentNicknameAuth}`;
}

function loadState() {
  const raw = localStorage.getItem(userStorageKey());
  if (!raw) return structuredClone(defaultState);
  try {
    const parsed = JSON.parse(raw);
    return {
      ...structuredClone(defaultState),
      ...parsed,
      profile: {
        ...defaultState.profile,
        ...parsed.profile,
        skills: Array.isArray(parsed.profile?.skills) ? parsed.profile.skills : defaultState.profile.skills,
        avatar: parsed.profile?.avatar || defaultState.profile.avatar
      },
      actions: { ...defaultState.actions, ...parsed.actions },
      mediaPosts: (Array.isArray(parsed.mediaPosts) ? parsed.mediaPosts : defaultState.mediaPosts).map((post) => ({
        ...post,
        createdAt: post.createdAt || new Date().toISOString(),
        checkin: post.checkin || `${post.location || '未知地点'} · ${formatTime(new Date().toISOString())}`
      })),
      trips: (Array.isArray(parsed.trips) ? parsed.trips : defaultState.trips).map((trip) => ({
        ...trip,
        tags: Array.isArray(trip.tags) ? trip.tags : [],
        spots: Array.isArray(trip.spots) ? trip.spots : [],
        itinerary: trip.itinerary || '',
        likeCount: Number(trip.likeCount || 0),
        createdAt: trip.createdAt || new Date().toISOString(),
        countries: Array.isArray(trip.countries) ? trip.countries : [],
        badges: Array.isArray(trip.badges) ? trip.badges : [],
        avatar: trip.avatar || defaultAvatar,
        review: trip.review || { score: 5.0, count: 1, highlights: [] }
      }))
    };
  } catch {
    return structuredClone(defaultState);
  }
}

function persist() { localStorage.setItem(userStorageKey(), JSON.stringify(state)); }

function hydrateProfile() {
  Object.entries(state.profile).forEach(([key, value]) => {
    if (key === 'skills' || key === 'avatar' || key === 'avatarFile') return;
    const field = profileForm.elements.namedItem(key);
    if (field) field.value = value;
  });
  const selectedSkills = new Set(state.profile.skills || []);
  profileForm.querySelectorAll('input[name="skills"]').forEach((input) => { input.checked = selectedSkills.has(input.value); });
}

function hydratePersonaFilters() {
  fillSelect(mbtiFilter, '全部 MBTI', [...new Set(state.trips.map((trip) => trip.profile?.mbti).filter(Boolean))].sort());
  fillSelect(zodiacFilter, '全部星座', [...new Set(state.trips.map((trip) => trip.profile?.zodiac).filter(Boolean))].sort());
}

function fillSelect(select, defaultLabel, values) {
  const previous = select.value;
  select.innerHTML = `<option value="all">${defaultLabel}</option>`;
  values.forEach((value) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    select.append(option);
  });
  select.value = values.includes(previous) ? previous : 'all';
}

function toggleProfilePanel() { profilePanel.hidden ? openProfilePanel() : closeProfilePanel(); }
function openProfilePanel() { profilePanel.hidden = false; profileToggle.setAttribute('aria-expanded', 'true'); }
function closeProfilePanel() {
  if (forceProfileCompletion) return;
  profilePanel.hidden = true;
  profileToggle.setAttribute('aria-expanded', 'false');
}

function syncUserChip() {
  const age = calculateAge(state.profile.birthday);
  currentNickname.textContent = currentUserRecord.nickname;
  headerAvatar.src = state.profile.avatar || defaultAvatar;
  profileToggle.querySelector('small').textContent = `${state.profile.mbti} · ${state.profile.zodiac} · ${age}岁 · ${(state.profile.skills || []).length}技能`;
}

function matchScore(trip) {
  let score = 40;
  if (trip.pace === state.profile.pace) score += 20;
  if (trip.wakeUp === state.profile.wakeUp) score += 12;
  if (trip.social === state.profile.social) score += 12;
  if (trip.profile?.mbti === state.profile.mbti) score += 8;
  if (trip.profile?.zodiac === state.profile.zodiac) score += 6;
  const budgetDelta = Math.abs(levelBudget(state.profile.budgetLevel) - trip.budget);
  if (budgetDelta <= 1000) score += 8;
  else if (budgetDelta <= 2500) score += 4;
  if (state.actions.like.includes(trip.id)) score += 5;
  if (state.actions.dislike.includes(trip.id)) score -= 20;
  return Math.max(1, Math.min(99, score));
}

function hotScore(trip) {
  const days = Math.max(1, (Date.now() - new Date(trip.createdAt).getTime()) / 86400000);
  return (trip.likeCount || 0) * 3 + (state.actions.connect.includes(trip.id) ? 6 : 0) + 30 / days;
}

function sortTrips(trips, mode) {
  if (mode === 'newest') return trips.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  if (mode === 'hottest') return trips.sort((a, b) => hotScore(b) - hotScore(a));
  return trips.sort((a, b) => matchScore(b) + hotScore(b) * 0.6 - (matchScore(a) + hotScore(a) * 0.6));
}

function render() {
  const keyword = searchInput.value.trim();
  const style = styleFilter.value;
  const mbti = mbtiFilter.value;
  const zodiac = zodiacFilter.value;
  const mode = sortFilter.value;

  const trips = sortTrips(
    state.trips
      .filter((trip) => (keyword ? trip.destination.includes(keyword) : true))
      .filter((trip) => (style === 'all' ? true : trip.pace === style))
      .filter((trip) => (mbti === 'all' ? true : trip.profile?.mbti === mbti))
      .filter((trip) => (zodiac === 'all' ? true : trip.profile?.zodiac === zodiac)),
    mode
  );

  tripList.innerHTML = '';
  trips.forEach((trip) => {
    const fragment = tripTemplate.content.cloneNode(true);
    const article = fragment.querySelector('.trip-item');
    article.dataset.id = trip.id;

    fragment.querySelector('h3').textContent = `${trip.user} · ${trip.destination}`;
    fragment.querySelector('.score').textContent = `匹配度 ${matchScore(trip)} 分`;
    fragment.querySelector('.author-avatar').src = trip.avatar || defaultAvatar;
    fragment.querySelector('.meta').textContent = `${trip.departDate} → ${trip.returnDate} ｜预算 ¥${trip.budget} ｜点赞 ${trip.likeCount || 0}`;
    fragment.querySelector('.publish').textContent = `发布时间：${formatTime(trip.createdAt)}`;
    const review = trip.review || { score: 5.0, count: 1, highlights: [] };
    fragment.querySelector('.review').textContent = `搭子评价：⭐ ${review.score.toFixed(1)}（${review.count}条）｜${(review.highlights || []).join(' / ')}`;
    fragment.querySelector('.spots').textContent = `想去：${trip.spots.join('、')}`;
    fragment.querySelector('.itinerary').textContent = `安排：${trip.itinerary}`;
    fragment.querySelector('.trust').textContent = `信用评分 ${trip.trust.score} ｜守约率 ${trip.trust.completion}% ｜${trip.trust.verified ? '实名认证' : '待认证'}`;
    fragment.querySelector('.footprint').textContent = `国家足迹：${(trip.countries || []).join('、') || '暂无'}`;
    fragment.querySelector('.badges').textContent = `成就勋章：${(trip.badges || []).join(' ｜ ') || '暂无'}`;

    const tagsEl = fragment.querySelector('.tags');
    (trip.tags || []).forEach((tag) => {
      const li = document.createElement('li');
      li.textContent = `#${tag}`;
      tagsEl.append(li);
    });

    const chips = fragment.querySelector('.chips');
    const age = trip.profile?.birthday ? `${calculateAge(trip.profile.birthday)} 岁` : '年龄未知';
    [
      `年龄: ${age}`,
      `MBTI: ${trip.profile?.mbti || '未填写'}`,
      `星座: ${trip.profile?.zodiac || '未填写'}`,
      `节奏: ${trip.pace}`,
      `作息: ${trip.wakeUp}`,
      `社交: ${trip.social}`,
      ...((trip.profile?.skills || []).map((skill) => `技能: ${skill}`))
    ].forEach((text) => {
      const li = document.createElement('li');
      li.textContent = text;
      chips.append(li);
    });

    ['like', 'dislike', 'save', 'connect'].forEach((action) => {
      const btn = fragment.querySelector(`button[data-action="${action}"]`);
      if (state.actions[action].includes(trip.id)) btn.textContent = `✓ ${btn.textContent}`;
    });

    tripList.append(fragment);
  });

  renderStats();
  renderMedia();
  renderCountries();
  renderBadges();
}

function renderStats() {
  statsBox.innerHTML = [
    ['点赞', state.actions.like.length],
    ['不喜欢', state.actions.dislike.length],
    ['收藏', state.actions.save.length],
    ['私聊意向', state.actions.connect.length]
  ].map(([name, count]) => `<div>${name}<strong>${count}</strong></div>`).join('');
}

function renderMedia() {
  mediaList.innerHTML = '';
  state.mediaPosts.forEach((post) => {
    const fragment = mediaTemplate.content.cloneNode(true);
    const article = fragment.querySelector('.media-item');
    article.dataset.id = post.id;
    fragment.querySelector('img').src = post.cover;
    fragment.querySelector('.media-title').textContent = post.caption;
    fragment.querySelector('.media-meta').textContent = `${post.type} · ${post.location} · 创建于 ${formatTime(post.createdAt)}`;
    fragment.querySelector('.media-checkin').textContent = `📍 打卡：${post.checkin || '未打卡'}`;
    mediaList.append(fragment);
  });
}

function renderCountries() {
  const countries = [...new Set(state.mediaPosts.map((post) => post.location))];
  countryList.innerHTML = countries.length
    ? countries.map((country) => `<span class="country-pill">🌍 ${country}</span>`).join('')
    : '<p class="hint">先发布一条旅行图片/视频，点亮你的国家足迹。</p>';
}

function renderBadges() {
  const unlocked = [];
  if (state.actions.connect.length >= 1) unlocked.push(['🤝 初次结伴', '第一次对某个行程发起私聊意向']);
  if (state.actions.like.length >= 1) unlocked.push(['👍 人气观察员', '第一次给行程点赞']);
  if (state.mediaPosts.length >= 1) unlocked.push(['📸 旅行记录官', '首次上传图片/视频内容']);
  if (state.mediaPosts.some((post) => isOverseas(post.location))) unlocked.push(['✈️ 出境初体验', '首次记录出国旅行']);
  badgeList.innerHTML = unlocked.length
    ? unlocked.map(([name, desc]) => `<article class="badge-item"><h4>${name}</h4><p>${desc}</p></article>`).join('')
    : '<p class="hint">完成互动后可解锁你的旅行勋章。</p>';
}

function updateMediaInputByType() {
  const type = mediaType.value;
  if (type === '视频') {
    coverFileInput.accept = 'video/*';
    coverFileInput.multiple = false;
  } else {
    coverFileInput.accept = 'image/*';
    coverFileInput.multiple = true;
  }
}

function toList(value) { return String(value).split(',').map((item) => item.trim()).filter(Boolean); }
function calculateAge(birthday) {
  const birth = new Date(birthday);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) age -= 1;
  return Math.max(0, age);
}
function levelBudget(level) { if (level === '经济') return 1800; if (level === '舒适') return 3500; return 7000; }
function isOverseas(location) {
  const domesticKeywords = ['中国', '北京', '上海', '广州', '深圳', '成都', '杭州', '南京', '西安', '重庆', '武汉', '苏州', '厦门', '长沙', '青岛', '三亚', '张家界'];
  return !domesticKeywords.some((city) => String(location).includes(city));
}
function formatTime(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
