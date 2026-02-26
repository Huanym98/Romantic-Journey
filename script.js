const profileForm = document.querySelector('#profileForm');
const tripForm = document.querySelector('#tripForm');
const mediaForm = document.querySelector('#mediaForm');
const tripList = document.querySelector('#tripList');
const tripTemplate = document.querySelector('#tripTemplate');
const mediaTemplate = document.querySelector('#mediaTemplate');
const mediaList = document.querySelector('#mediaList');
const searchInput = document.querySelector('#searchInput');
const styleFilter = document.querySelector('#styleFilter');
const seedBtn = document.querySelector('#seedBtn');
const statsBox = document.querySelector('#stats');
const countryList = document.querySelector('#countryList');
const badgeList = document.querySelector('#badgeList');

const STORAGE_KEY = 'romanticJourneyState';

const sampleTrips = [
  {
    id: crypto.randomUUID(),
    user: 'Mia',
    destination: '成都',
    departDate: '2026-03-06',
    returnDate: '2026-03-10',
    budget: 2600,
    spots: ['宽窄巷子', '熊猫基地', '都江堰'],
    pace: '平衡',
    wakeUp: '自然醒',
    social: '适中',
    trust: { score: 4.8, completion: 96, verified: true }
  },
  {
    id: crypto.randomUUID(),
    user: '阿曜',
    destination: '张家界',
    departDate: '2026-04-01',
    returnDate: '2026-04-05',
    budget: 1800,
    spots: ['天门山', '玻璃栈道', '国家森林公园'],
    pace: '特种兵式',
    wakeUp: '早起',
    social: '外向',
    trust: { score: 4.4, completion: 91, verified: true }
  },
  {
    id: crypto.randomUUID(),
    user: 'Luna',
    destination: '京都',
    departDate: '2026-05-14',
    returnDate: '2026-05-20',
    budget: 7000,
    spots: ['清水寺', '伏见稻荷', '岚山'],
    pace: '慢游',
    wakeUp: '夜猫',
    social: '安静',
    trust: { score: 4.9, completion: 98, verified: true }
  }
];

const sampleMedia = [
  {
    id: crypto.randomUUID(),
    type: '图片',
    location: '瑞士',
    cover: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=800&q=80',
    caption: '雪山火车窗景'
  },
  {
    id: crypto.randomUUID(),
    type: '视频',
    location: '泰国',
    cover: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=800&q=80',
    caption: '海边落日 Vlog'
  }
];

const defaultState = {
  profile: { pace: '平衡', budgetLevel: '舒适', wakeUp: '自然醒', social: '适中' },
  trips: sampleTrips,
  mediaPosts: sampleMedia,
  actions: { like: [], dislike: [], save: [], connect: [] }
};

let state = loadState();
hydrateProfile();
render();

profileForm.addEventListener('submit', (event) => {
  event.preventDefault();
  state.profile = Object.fromEntries(new FormData(profileForm).entries());
  persist();
  render();
});

tripForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(tripForm).entries());
  const budget = Number(data.budget);
  const newTrip = {
    id: crypto.randomUUID(),
    user: '你',
    destination: data.destination.trim(),
    departDate: data.departDate,
    returnDate: data.returnDate,
    budget,
    spots: data.spots.split(',').map((item) => item.trim()).filter(Boolean),
    pace: data.pace,
    wakeUp: data.wakeUp,
    social: data.social,
    trust: { score: 5.0, completion: 100, verified: false }
  };
  state.trips = [newTrip, ...state.trips];
  tripForm.reset();
  persist();
  render();
});

mediaForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(mediaForm).entries());
  const newMedia = {
    id: crypto.randomUUID(),
    type: data.type,
    location: data.location.trim(),
    cover: data.cover.trim(),
    caption: data.caption.trim()
  };

  state.mediaPosts = [newMedia, ...state.mediaPosts].slice(0, 12);
  mediaForm.reset();
  persist();
  render();
});

seedBtn.addEventListener('click', () => {
  state = structuredClone(defaultState);
  hydrateProfile();
  persist();
  render();
});

searchInput.addEventListener('input', render);
styleFilter.addEventListener('change', render);

tripList.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const card = event.target.closest('[data-id]');
  const id = card?.dataset.id;
  const action = button.dataset.action;
  if (!id || !action) return;

  Object.keys(state.actions).forEach((key) => {
    if (key !== action) {
      state.actions[key] = state.actions[key].filter((item) => item !== id);
    }
  });

  if (state.actions[action].includes(id)) {
    state.actions[action] = state.actions[action].filter((item) => item !== id);
  } else {
    state.actions[action].push(id);
  }

  persist();
  render();
});

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return structuredClone(defaultState);
  try {
    const parsed = JSON.parse(raw);
    return {
      ...structuredClone(defaultState),
      ...parsed,
      profile: { ...defaultState.profile, ...parsed.profile },
      actions: { ...defaultState.actions, ...parsed.actions },
      mediaPosts: Array.isArray(parsed.mediaPosts) ? parsed.mediaPosts : defaultState.mediaPosts
    };
  } catch {
    return structuredClone(defaultState);
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function hydrateProfile() {
  Object.entries(state.profile).forEach(([key, value]) => {
    const field = profileForm.elements.namedItem(key);
    if (field) field.value = value;
  });
}

function matchScore(trip) {
  let score = 40;
  if (trip.pace === state.profile.pace) score += 25;
  if (trip.wakeUp === state.profile.wakeUp) score += 15;
  if (trip.social === state.profile.social) score += 15;

  const budgetDelta = Math.abs(levelBudget(state.profile.budgetLevel) - trip.budget);
  if (budgetDelta <= 1000) score += 10;
  else if (budgetDelta <= 2500) score += 5;

  if (state.actions.like.includes(trip.id)) score += 5;
  if (state.actions.dislike.includes(trip.id)) score -= 20;

  return Math.max(1, Math.min(99, score));
}

function levelBudget(level) {
  if (level === '经济') return 1800;
  if (level === '舒适') return 3500;
  return 7000;
}

function render() {
  const keyword = searchInput.value.trim();
  const style = styleFilter.value;
  const trips = state.trips
    .filter((trip) => (keyword ? trip.destination.includes(keyword) : true))
    .filter((trip) => (style === 'all' ? true : trip.pace === style))
    .sort((a, b) => matchScore(b) - matchScore(a));

  tripList.innerHTML = '';
  trips.forEach((trip) => {
    const fragment = tripTemplate.content.cloneNode(true);
    const article = fragment.querySelector('.trip-item');
    const title = fragment.querySelector('h3');
    const score = fragment.querySelector('.score');
    const meta = fragment.querySelector('.meta');
    const spots = fragment.querySelector('.spots');
    const chips = fragment.querySelector('.chips');
    const trust = fragment.querySelector('.trust');

    article.dataset.id = trip.id;
    title.textContent = `${trip.user} · ${trip.destination}`;
    score.textContent = `匹配度 ${matchScore(trip)} 分`;
    meta.textContent = `${trip.departDate} → ${trip.returnDate} ｜预算 ¥${trip.budget}`;
    spots.textContent = `想去：${trip.spots.join('、')}`;
    trust.textContent = `信用评分 ${trip.trust.score} ｜守约率 ${trip.trust.completion}% ｜${trip.trust.verified ? '实名认证' : '待认证'}`;

    ['pace', 'wakeUp', 'social'].forEach((key) => {
      const li = document.createElement('li');
      li.textContent = `${key === 'pace' ? '节奏' : key === 'wakeUp' ? '作息' : '社交'}: ${trip[key]}`;
      chips.append(li);
    });

    ['like', 'dislike', 'save', 'connect'].forEach((action) => {
      const btn = fragment.querySelector(`button[data-action="${action}"]`);
      if (state.actions[action].includes(trip.id)) {
        btn.textContent = `✓ ${btn.textContent}`;
      }
    });

    tripList.append(fragment);
  });

  renderStats();
  renderMedia();
  renderCountries();
  renderBadges();
}

function renderStats() {
  const items = [
    ['喜欢', state.actions.like.length],
    ['不喜欢', state.actions.dislike.length],
    ['收藏', state.actions.save.length],
    ['私聊意向', state.actions.connect.length]
  ];
  statsBox.innerHTML = items
    .map(([name, count]) => `<div>${name}<strong>${count}</strong></div>`)
    .join('');
}

function renderMedia() {
  mediaList.innerHTML = '';
  state.mediaPosts.forEach((post) => {
    const fragment = mediaTemplate.content.cloneNode(true);
    const image = fragment.querySelector('img');
    const title = fragment.querySelector('.media-title');
    const meta = fragment.querySelector('.media-meta');

    image.src = post.cover;
    title.textContent = post.caption;
    meta.textContent = `${post.type} · ${post.location}`;

    mediaList.append(fragment);
  });
}

function renderCountries() {
  const countries = [...new Set(state.mediaPosts.map((post) => post.location))];
  if (!countries.length) {
    countryList.innerHTML = '<p class="hint">先发布一条旅行图片/视频，点亮你的国家足迹。</p>';
    return;
  }

  countryList.innerHTML = countries
    .map((country) => `<span class="country-pill">🌍 ${country}</span>`)
    .join('');
}

function renderBadges() {
  const unlocked = [];

  if (state.actions.connect.length >= 1) unlocked.push(['🤝 初次结伴', '第一次对某个行程发起私聊意向']);
  if (state.actions.like.length >= 1) unlocked.push(['👍 人气观察员', '第一次点赞其他旅行者']);
  if (state.mediaPosts.length >= 1) unlocked.push(['📸 旅行记录官', '首次上传图片/视频内容']);

  const hasOverseas = state.mediaPosts.some((post) => isOverseas(post.location));
  if (hasOverseas) unlocked.push(['✈️ 出境初体验', '首次记录出国旅行']);

  if (!unlocked.length) {
    badgeList.innerHTML = '<p class="hint">完成互动后可解锁你的旅行勋章。</p>';
    return;
  }

  badgeList.innerHTML = unlocked
    .map(([name, desc]) => `<article class="badge-item"><h4>${name}</h4><p>${desc}</p></article>`)
    .join('');
}

function isOverseas(location) {
  const domesticKeywords = ['中国', '北京', '上海', '广州', '深圳', '成都', '杭州', '南京', '西安', '重庆', '武汉', '苏州', '厦门', '长沙', '青岛', '三亚', '张家界'];
  return !domesticKeywords.some((city) => location.includes(city));
}
