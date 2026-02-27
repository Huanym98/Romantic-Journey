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
const langSelect = document.querySelector('#langSelect');
const profileToggle = document.querySelector('#profileToggle');
const currentNickname = document.querySelector('#currentNickname');
const headerAvatar = document.querySelector('#profileToggle img');
const avatarFileInput = document.querySelector('#avatarFile');
const avatarPickBtn = document.querySelector('#avatarPickBtn');
const avatarPreview = document.querySelector('#avatarPreview');
const avatarHint = document.querySelector('#avatarHint');
const switchAccountBtn = document.querySelector('#switchAccountBtn');
const logoutBtn = document.querySelector('#logoutBtn');
const profilePanel = document.querySelector('#profilePanel');
const panelClose = document.querySelector('#panelClose');
const statsBox = document.querySelector('#stats');
const countryList = document.querySelector('#countryList');
const badgeList = document.querySelector('#badgeList');
const chatWorkspace = document.querySelector('#chatWorkspace');
const chatWorkspaceTitle = document.querySelector('#chatWorkspaceTitle');
const chatTabs = document.querySelector('#chatTabs');
const chatPlusBtn = document.querySelector('#chatPlusBtn');
const chatPlusMenu = document.querySelector('#chatPlusMenu');
const createGroupBtn = document.querySelector('#createGroupBtn');
const chatWorkspaceClose = document.querySelector('#chatWorkspaceClose');
const chatMessages = document.querySelector('#chatMessages');
const chatSendForm = document.querySelector('#chatSendForm');
const chatInput = document.querySelector('#chatInput');
const chatRuleHint = document.querySelector('#chatRuleHint');
const personDialog = document.querySelector('#personDialog');
const personDialogTitle = document.querySelector('#personDialogTitle');
const personDialogClose = document.querySelector('#personDialogClose');
const personAvatar = document.querySelector('#personAvatar');
const personMeta = document.querySelector('#personMeta');
const personRelation = document.querySelector('#personRelation');
const personSkills = document.querySelector('#personSkills');
const personBadges = document.querySelector('#personBadges');
const personTrust = document.querySelector('#personTrust');
const personFollowBtn = document.querySelector('#personFollowBtn');
const personBlockBtn = document.querySelector('#personBlockBtn');
const personChatBtn = document.querySelector('#personChatBtn');

const STORAGE_KEY = 'romanticJourneyState';
const USERS_KEY = 'romanticJourneyUsers';
const CURRENT_USER_KEY = 'romanticJourneyCurrentUser';
const SOCIAL_KEY = 'romanticJourneySocial';
const LANG_KEY = 'romanticJourneyLang';
const defaultAvatar = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=160&q=80';


const I18N = {
  'zh-CN': {
    title: 'Romantic Journey · 找旅行搭子', navHome: '首页', navMatch: '找搭子', navSquare: '行程广场', navCommunity: '旅行社区',
    profileSmall: '个人资料', heroTitle: '筛选更精准，结伴更靠谱', heroDesc: '支持行程标签、详细安排、点赞热度、头像信息和口碑评价。',
    sectionTrip: '1) 发布行程帖', sectionMatch: '2) 快速匹配区', sectionStats: '3) 我的互动记录', sectionHome: '4) 我的旅行主页',
    plusCreateGroup: '创建群组', chatWorkspaceTitle: '聊天', send: '发送', collapse: '收起',
    statsLike: '点赞', statsSave: '收藏', statsConnect: '私聊意向', statsFollowing: '我关注', statsFriends: '互相关注好友', statsBlocked: '已拉黑', statsChats: '聊天窗口',
    avatarHintDefault: '支持 jpg/png/webp，保存资料后生效。', avatarHintSelected: '已选择新头像，点击“保存资料”后生效。', avatarHintSaved: '头像已保存，可随时再次更换。',
    groupNeedFriend: '请先互相关注至少 1 位好友，再发起群聊。', groupPickPrompt: '请输入群成员昵称，逗号分隔。可选：', groupInvalid: '未选择有效好友。', groupNamePrompt: '请输入群聊名称（可选）',
    personTitle: ' 的个人信息', follow: '关注', unfollow: '取消关注', block: '拉黑', unblock: '取消拉黑', startChat: '发起聊天',
    noChats: '暂无聊天窗口，可先点行程卡头像查看个人信息并发起聊天。',
    languageLabel: '语言'
  },
  en: {
    title: 'Romantic Journey · Find Travel Buddies', navHome: 'Home', navMatch: 'Match', navSquare: 'Trip Square', navCommunity: 'Community',
    profileSmall: 'Profile', heroTitle: 'Smarter filters, better companions', heroDesc: 'Tag filters, detailed itineraries, likes, avatars and reputation in one place.',
    sectionTrip: '1) Publish a Trip', sectionMatch: '2) Quick Match', sectionStats: '3) My Interactions', sectionHome: '4) My Travel Home',
    plusCreateGroup: 'Create Group', chatWorkspaceTitle: 'Chats', send: 'Send', collapse: 'Hide',
    statsLike: 'Likes', statsSave: 'Saved', statsConnect: 'Chat intents', statsFollowing: 'Following', statsFriends: 'Mutual friends', statsBlocked: 'Blocked', statsChats: 'Chats',
    avatarHintDefault: 'Supports jpg/png/webp. Effective after saving profile.', avatarHintSelected: 'New avatar selected. Save profile to apply.', avatarHintSaved: 'Avatar saved. You can change it anytime.',
    groupNeedFriend: 'Please mutually follow at least one friend before creating a group.', groupPickPrompt: 'Enter member nicknames, comma-separated. Available: ', groupInvalid: 'No valid friend selected.', groupNamePrompt: 'Enter group name (optional)',
    personTitle: "'s profile", follow: 'Follow', unfollow: 'Unfollow', block: 'Block', unblock: 'Unblock', startChat: 'Start Chat',
    noChats: 'No chats yet. Click an avatar in trip cards to open profile and start chatting.',
    languageLabel: 'Language'
  }
};
let currentLang = localStorage.getItem(LANG_KEY) || 'zh-CN';
if (!I18N[currentLang]) currentLang = 'zh-CN';
const t = (k) => I18N[currentLang][k] || I18N['zh-CN'][k] || k;
function applyI18n() {
  document.documentElement.lang = currentLang;
  document.title = t('title');
  if (langSelect) langSelect.value = currentLang;
  const nav = document.querySelectorAll('.nav-links a');
  if (nav[0]) nav[0].textContent = t('navHome');
  if (nav[1]) nav[1].textContent = t('navMatch');
  if (nav[2]) nav[2].textContent = t('navSquare');
  if (nav[3]) nav[3].textContent = t('navCommunity');
  const chipSmall = document.querySelector('#profileToggle small');
  if (chipSmall) chipSmall.textContent = t('profileSmall');
  const heroTitle = document.querySelector('.hero-strip h1');
  const heroDesc = document.querySelector('.hero-strip p');
  if (heroTitle) heroTitle.textContent = t('heroTitle');
  if (heroDesc) heroDesc.textContent = t('heroDesc');
  const cards = document.querySelectorAll('main.layout > section.card > h2');
  if (cards[0]) cards[0].textContent = t('sectionTrip');
  if (cards[1]) cards[1].textContent = t('sectionMatch');
  if (cards[2]) cards[2].textContent = t('sectionStats');
  if (cards[3]) cards[3].textContent = t('sectionHome');
  if (createGroupBtn) createGroupBtn.textContent = t('plusCreateGroup');
  if (chatWorkspaceTitle) chatWorkspaceTitle.textContent = t('chatWorkspaceTitle');
  if (chatWorkspaceClose) chatWorkspaceClose.textContent = t('collapse');
  const sendBtn = chatSendForm?.querySelector('button[type="submit"]');
  if (sendBtn) sendBtn.textContent = t('send');
}

const sampleTrips = [
  {
    id: crypto.randomUUID(),
    user: 'Mia',
    avatar: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=200&q=80',
    destination: '纽约', departDate: '2026-03-06', returnDate: '2026-03-10', budget: 6800,
    tags: ['citywalk', '摄影', '美食'], spots: ['中央公园', '大都会博物馆', '时代广场'],
    itinerary: 'D1 中央公园慢走，晚上时代广场夜景。D2 大都会博物馆与SoHo。',
    pace: '平衡', wakeUp: '自然醒', social: '适中',
    profile: { birthday: '1998-07-14', mbti: 'ENFP', zodiac: '巨蟹座', skills: ['会拍照', '有相机', '会日语'] },
    countries: ['美国', '日本'], badges: ['🤝 初次结伴', '📸 旅行记录官'],
    review: { score: 4.9, count: 26, highlights: ['守时', '会拍照'] }, trust: { score: 4.8, completion: 96, verified: true },
    likeCount: 16, createdAt: '2026-02-20T09:30:00.000Z'
  },
  {
    id: crypto.randomUUID(),
    user: '阿曜',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    destination: '阿那亚', departDate: '2026-04-01', returnDate: '2026-04-05', budget: 2800,
    tags: ['海边', '自驾', '轻徒步'], spots: ['礼堂', '海边市集', '沙丘美术馆'],
    itinerary: 'D1 自驾看落日；D2 沙丘美术馆+海边市集。',
    pace: '慢游', wakeUp: '早起', social: '外向',
    profile: { birthday: '1995-11-02', mbti: 'ENTJ', zodiac: '天蝎座', skills: ['海外自驾经验', '有驾照', '会韩语'] },
    countries: ['中国', '韩国'], badges: ['✈️ 出境初体验'],
    review: { score: 4.7, count: 14, highlights: ['路线规划清晰', '沟通主动'] }, trust: { score: 4.4, completion: 91, verified: true },
    likeCount: 11, createdAt: '2026-02-23T15:20:00.000Z'
  }
];

const sampleMedia = [{
  id: crypto.randomUUID(), type: '图片', location: '瑞士',
  cover: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=800&q=80',
  caption: '雪山火车窗景', createdAt: '2026-02-22T08:30:00.000Z',
  checkin: '瑞士·少女峰观景台 · 2026-02-22 08:30'
}];

const defaultState = {
  profile: {
    birthday: '1998-01-01', mbti: 'ENFP', zodiac: '摩羯座', pace: '平衡', budgetLevel: '舒适', wakeUp: '自然醒', social: '适中',
    skills: ['会拍照', '有相机'], avatar: defaultAvatar
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
let social = loadSocial();
let activeChatId = null;
let activeProfileUser = null;

applyI18n();
hydrateProfile();
hydratePersonaFilters();
syncUserChip();
updateMediaInputByType();
render();
if (forceProfileCompletion) openProfilePanel();
if (langSelect) {
  langSelect.value = currentLang;
  langSelect.addEventListener('change', () => {
    currentLang = langSelect.value;
    localStorage.setItem(LANG_KEY, currentLang);
    applyI18n();
    hydrateProfile();
    render();
  });
}

avatarPickBtn.addEventListener('click', () => avatarFileInput.click());
avatarFileInput.addEventListener('change', async () => {
  const file = avatarFileInput.files?.[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    avatarHint.textContent = currentLang === 'en' ? 'Please choose an image file as avatar.' : '请选择图片文件作为头像。';
    avatarFileInput.value = '';
    return;
  }
  avatarPreview.src = await fileToDataUrl(file);
  avatarHint.textContent = t('avatarHintSelected');
});

profileForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(profileForm);
  const profile = Object.fromEntries(formData.entries());
  profile.skills = formData.getAll('skills');
  const avatarFile = avatarFileInput.files?.[0];
  profile.avatar = avatarFile ? await fileToDataUrl(avatarFile) : (state.profile.avatar || defaultAvatar);

  if (currentUserRecord.firstLogin && !profile.avatar) {
    alert(currentLang === 'en' ? 'Please upload an avatar on first login before continuing.' : '首次登录请上传头像后再继续。');
    return;
  }

  state.profile = profile;
  avatarHint.textContent = t('avatarHintSaved');
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
    profile: { birthday: state.profile.birthday, mbti: state.profile.mbti, zodiac: state.profile.zodiac, skills: state.profile.skills },
    countries: unique([...(state.mediaPosts.map((post) => post.location)), data.destination.trim()]).slice(0, 4),
    badges: collectBadges(),
    review: { score: 5.0, count: 1, highlights: ['资料完整'] },
    trust: { score: 4.6, completion: 95, verified: true },
    likeCount: 0,
    createdAt: new Date().toISOString()
  };
  state.trips = [newTrip, ...state.trips].slice(0, 30);
  tripForm.reset();
  hydratePersonaFilters();
  persist();
  render();
});

mediaForm.addEventListener('submit', async (event) => {
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
      id: crypto.randomUUID(), type, location,
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
  social = loadSocial();
  applyI18n();
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

  if (action === 'connect') {
    state.actions.connect = state.actions.connect.includes(id) ? state.actions.connect : [...state.actions.connect, id];
    openDirectChat(trip.user);
    persist();
    render();
    return;
  }

  if (action === 'like') {
    const liked = state.actions.like.includes(id);
    state.actions.like = liked ? state.actions.like.filter((item) => item !== id) : [...state.actions.like, id];
    trip.likeCount = Math.max(0, (trip.likeCount || 0) + (liked ? -1 : 1));
  } else {
    ['dislike', 'save'].forEach((key) => {
      if (key !== action) state.actions[key] = state.actions[key].filter((item) => item !== id);
    });
    state.actions[action] = state.actions[action].includes(id)
      ? state.actions[action].filter((item) => item !== id)
      : [...state.actions[action], id];
  }

  persist();
  render();
});

tripList.addEventListener('click', (event) => {
  const avatar = event.target.closest('.author-avatar');
  if (!avatar) return;
  const id = event.target.closest('[data-id]')?.dataset.id;
  const trip = state.trips.find((item) => item.id === id);
  if (!trip) return;
  openPersonDialog(trip.user);
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

createGroupBtn.addEventListener('click', () => {
  const friends = getFriends();
  if (!friends.length) {
    alert(t('groupNeedFriend'));
    return;
  }
  const picked = prompt(`${t('groupPickPrompt')}${friends.join('、')}`);
  if (!picked) return;
  const members = unique(toList(picked)).filter((name) => friends.includes(name));
  if (!members.length) {
    alert(t('groupInvalid'));
    return;
  }
  const customName = prompt(t('groupNamePrompt')) || '';
  const groupName = customName.trim() || `我的群聊-${formatTime(new Date().toISOString())}`;
  const chat = {
    id: crypto.randomUUID(),
    type: 'group',
    name: groupName,
    members: unique([currentNicknameAuth, ...members]),
    messages: [{ sender: currentNicknameAuth, text: '群聊已创建，欢迎大家~', createdAt: new Date().toISOString() }]
  };
  social.chats.unshift(chat);
  persistSocial();
  chatPlusMenu.hidden = true;
  chatPlusBtn.setAttribute('aria-expanded', 'false');
  openChat(chat.id);
  render();
});

chatPlusBtn.addEventListener('click', (event) => {
  event.stopPropagation();
  const isOpen = !chatPlusMenu.hidden;
  chatPlusMenu.hidden = isOpen;
  chatPlusBtn.setAttribute('aria-expanded', String(!isOpen));
});
document.addEventListener('click', (event) => {
  if (!chatPlusMenu || chatPlusMenu.hidden) return;
  if (chatPlusMenu.contains(event.target) || chatPlusBtn.contains(event.target)) return;
  chatPlusMenu.hidden = true;
  chatPlusBtn.setAttribute('aria-expanded', 'false');
});

chatWorkspaceClose.addEventListener('click', () => { chatWorkspace.hidden = true; activeChatId = null; });
chatSendForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!activeChatId) return;
  const text = chatInput.value.trim();
  if (!text) return;
  const chat = social.chats.find((item) => item.id === activeChatId);
  if (!chat) return;
  chatTabs.querySelectorAll('button[data-chat-id]').forEach((btn) => { btn.classList.toggle('secondary', btn.dataset.chatId === chat.id); });
  const rule = canSendMessage(chat, currentNicknameAuth);
  if (!rule.ok) {
    alert(rule.reason);
    return;
  }
  chat.messages.push({ sender: currentNicknameAuth, text, createdAt: new Date().toISOString() });
  chatInput.value = '';
  persistSocial();
  paintChat(chat);
  renderChatList();
});

chatTabs.addEventListener('click', (event) => {
  const btn = event.target.closest('button[data-chat-id]');
  if (!btn) return;
  openChat(btn.dataset.chatId);
});

function render() {
  renderTrips();
  renderStats();
  renderMedia();
  renderCountries();
  renderBadges();
  renderChatList();
}

function renderTrips() {
  tripList.innerHTML = '';
  const keyword = searchInput.value.trim();
  const style = styleFilter.value;
  const mbti = mbtiFilter.value;
  const zodiac = zodiacFilter.value;
  const sort = sortFilter.value;

  const list = sortTrips(state.trips
    .filter((trip) => !isBlockedEitherWay(currentNicknameAuth, trip.user))
    .filter((trip) => !keyword || `${trip.destination} ${(trip.tags || []).join(' ')}`.includes(keyword))
    .filter((trip) => style === 'all' || trip.pace === style)
    .filter((trip) => mbti === 'all' || trip.profile?.mbti === mbti)
    .filter((trip) => zodiac === 'all' || trip.profile?.zodiac === zodiac), sort);

  list.forEach((trip) => {
    const fragment = tripTemplate.content.cloneNode(true);
    const article = fragment.querySelector('.trip-item');
    article.dataset.id = trip.id;
    fragment.querySelector('h3').textContent = `${trip.user} · ${trip.destination}`;
    fragment.querySelector('.score').textContent = `匹配度 ${matchScore(trip)}%`;
    const avatarEl = fragment.querySelector('.author-avatar');
    avatarEl.src = trip.avatar || defaultAvatar;
    avatarEl.title = `点击查看 ${trip.user} 的个人信息`;
    fragment.querySelector('.meta').textContent = `${trip.departDate} → ${trip.returnDate} ｜预算 ¥${trip.budget} ｜点赞 ${trip.likeCount || 0}`;
    fragment.querySelector('.publish').textContent = `发布时间：${formatTime(trip.createdAt)}`;
    const review = trip.review || { score: 5.0, count: 1, highlights: [] };
    fragment.querySelector('.review').textContent = `搭子评价：⭐ ${review.score.toFixed(1)}（${review.count}条）｜${(review.highlights || []).join(' / ')}`;
    fragment.querySelector('.relationship').textContent = describeRelationship(trip.user);
    fragment.querySelector('.spots').textContent = `想去：${(trip.spots || []).join('、')}`;
    fragment.querySelector('.itinerary').textContent = `安排：${trip.itinerary}`;
    fragment.querySelector('.trust').textContent = `信用评分 ${trip.trust.score} ｜守约率 ${trip.trust.completion}% ｜${trip.trust.verified ? '实名认证' : '待认证'}`;
    fragment.querySelector('.footprint').textContent = `国家足迹：${(trip.countries || []).join('、') || '暂无'}`;
    fragment.querySelector('.badges').textContent = `成就勋章：${(trip.badges || []).join(' ｜ ') || '暂无'}`;

    (trip.tags || []).forEach((tag) => {
      const li = document.createElement('li');
      li.textContent = `#${tag}`;
      fragment.querySelector('.tags').append(li);
    });

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
      fragment.querySelector('.chips').append(li);
    });

    ['like', 'dislike', 'save', 'connect'].forEach((action) => {
      const btn = fragment.querySelector(`button[data-action="${action}"]`);
      if (state.actions[action].includes(trip.id)) btn.textContent = `✓ ${btn.textContent}`;
    });

    tripList.append(fragment);
  });
}

function renderStats() {
  const following = getFollowing(currentNicknameAuth).length;
  const friends = getFriends().length;
  const blocked = getBlocked(currentNicknameAuth).length;
  statsBox.innerHTML = [
    [t('statsLike'), state.actions.like.length], [t('statsSave'), state.actions.save.length], [t('statsConnect'), state.actions.connect.length],
    [t('statsFollowing'), following], [t('statsFriends'), friends], [t('statsBlocked'), blocked], [t('statsChats'), social.chats.length]
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
  if (getFriends().length >= 1) unlocked.push(['🫶 默契好友', '至少互相关注 1 位好友']);
  badgeList.innerHTML = unlocked.length
    ? unlocked.map(([name, desc]) => `<article class="badge-item"><h4>${name}</h4><p>${desc}</p></article>`).join('')
    : '<p class="hint">完成互动后可解锁你的旅行勋章。</p>';
}

function renderChatList() {
  const mine = social.chats.filter((chat) => chat.members.includes(currentNicknameAuth));
  if (!mine.length) {
    chatWorkspace.hidden = true;
    chatTabs.innerHTML = '';
    return;
  }
  chatWorkspace.hidden = false;
  chatTabs.innerHTML = mine.map((chat) => `<button class="ghost" data-chat-id="${chat.id}" type="button">${chat.type === 'group' ? '👥' : '💬'} ${chat.name || chat.members.filter((x) => x !== currentNicknameAuth).join('、')}</button>`).join('');
}

function openDirectChat(target) {
  if (target === currentNicknameAuth) return;
  let chat = social.chats.find((item) => item.type === 'dm' && item.members.includes(currentNicknameAuth) && item.members.includes(target));
  if (!chat) {
    chat = { id: crypto.randomUUID(), type: 'dm', name: `${currentNicknameAuth} 与 ${target}`, members: [currentNicknameAuth, target], messages: [] };
    social.chats.unshift(chat);
    persistSocial();
  }
  openChat(chat.id);
}

function openChat(chatId) {
  const chat = social.chats.find((item) => item.id === chatId);
  if (!chat || !chat.members.includes(currentNicknameAuth)) return;
  activeChatId = chat.id;
  chatWorkspace.hidden = false;
  paintChat(chat);
}

function paintChat(chat) {
  chatWorkspaceTitle.textContent = chat.type === 'group' ? `群聊：${chat.name}` : `私聊：${chat.members.filter((name) => name !== currentNicknameAuth).join('、')}`;
  chatMessages.innerHTML = chat.messages.length
    ? chat.messages.map((msg) => `<p class="${msg.sender === currentNicknameAuth ? 'mine' : ''}"><strong>${msg.sender}：</strong>${msg.text}<small>${formatTime(msg.createdAt)}</small></p>`).join('')
    : '<p class="hint">暂无消息，发送第一条吧。</p>';
  chatTabs.querySelectorAll('button[data-chat-id]').forEach((btn) => { btn.classList.toggle('secondary', btn.dataset.chatId === chat.id); });
  const rule = canSendMessage(chat, currentNicknameAuth);
  chatRuleHint.textContent = rule.ok ? rule.tip : rule.reason;
  chatInput.disabled = !rule.ok;
  chatSendForm.querySelector('button').disabled = !rule.ok;
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function canSendMessage(chat, sender) {
  const others = chat.members.filter((name) => name !== sender);
  if (others.some((name) => isBlockedEitherWay(sender, name))) {
    return { ok: false, reason: '存在拉黑关系，当前聊天不可发送消息。', tip: '' };
  }
  if (chat.type === 'group') {
    const allFriends = others.every((name) => isMutualFollow(sender, name));
    return allFriends
      ? { ok: true, reason: '', tip: '互相关注好友可正常群聊。' }
      : { ok: false, reason: '群聊成员中存在未互相关注关系，无法发送。', tip: '' };
  }
  const peer = others[0];
  if (isMutualFollow(sender, peer)) return { ok: true, reason: '', tip: '你们已互相关注，可自由发送消息。' };
  if (chat.messages.length >= 1) return { ok: false, reason: '陌生人聊天仅允许 1 条消息，互相关注后可继续。', tip: '' };
  return { ok: true, reason: '', tip: '陌生人仅限 1 条消息。' };
}

function describeRelationship(target) {
  if (target === currentNicknameAuth) return '这是你自己发布的行程。';
  if (isBlockedEitherWay(currentNicknameAuth, target)) return '关系：已拉黑（无法互发消息）';
  if (isMutualFollow(currentNicknameAuth, target)) return '关系：已互相关注（好友，可私聊/群聊）';
  if (isFollowing(currentNicknameAuth, target)) return '关系：你已关注对方，等待对方回关';
  return '关系：陌生人（仅可发送 1 条消息）';
}

function toggleFollow(target) {
  if (!target || target === currentNicknameAuth) return;
  const set = new Set(getFollowing(currentNicknameAuth));
  if (set.has(target)) set.delete(target); else set.add(target);
  social.follows[currentNicknameAuth] = [...set];
}
function toggleBlock(target) {
  if (!target || target === currentNicknameAuth) return;
  const set = new Set(getBlocked(currentNicknameAuth));
  if (set.has(target)) set.delete(target); else set.add(target);
  social.blocks[currentNicknameAuth] = [...set];
}
function getFollowing(user) { return social.follows[user] || []; }
function getBlocked(user) { return social.blocks[user] || []; }
function isFollowing(a, b) { return getFollowing(a).includes(b); }
function isBlocked(a, b) { return getBlocked(a).includes(b); }
function isBlockedEitherWay(a, b) { return isBlocked(a, b) || isBlocked(b, a); }
function isMutualFollow(a, b) { return isFollowing(a, b) && isFollowing(b, a); }
function getFriends() {
  return users.map((user) => user.nickname).filter((name) => name !== currentNicknameAuth && isMutualFollow(currentNicknameAuth, name) && !isBlockedEitherWay(currentNicknameAuth, name));
}

function openPersonDialog(targetUser) {
  if (!targetUser) return;
  activeProfileUser = targetUser;
  const trip = state.trips.find((item) => item.user === targetUser) || {};
  personDialogTitle.textContent = `${targetUser}${t('personTitle')}`;
  personAvatar.src = trip.avatar || defaultAvatar;
  personMeta.textContent = `${trip.destination || '暂未发布目的地'} ｜ ${trip.profile?.mbti || 'MBTI未填写'} ｜ ${trip.profile?.zodiac || '星座未填写'}`;
  personRelation.textContent = describeRelationship(targetUser);
  personSkills.textContent = `技能：${(trip.profile?.skills || []).join('、') || '暂无'}`;
  personBadges.textContent = `勋章：${(trip.badges || []).join(' ｜ ') || '暂无'}`;
  const trust = trip.trust || { score: 4.5, completion: 90, verified: false };
  personTrust.textContent = `信用评分 ${trust.score} ｜守约率 ${trust.completion}% ｜${trust.verified ? '实名认证' : '待认证'}`;
  const isSelf = targetUser === currentNicknameAuth;
  personFollowBtn.textContent = isFollowing(currentNicknameAuth, targetUser) ? t('unfollow') : t('follow');
  personBlockBtn.textContent = isBlocked(currentNicknameAuth, targetUser) ? t('unblock') : t('block');
  personFollowBtn.disabled = isSelf;
  personBlockBtn.disabled = isSelf;
  personChatBtn.disabled = isBlockedEitherWay(currentNicknameAuth, targetUser) || isSelf;
  personDialog.showModal();
}

personDialogClose.addEventListener('click', () => personDialog.close());
personFollowBtn.addEventListener('click', () => {
  if (!activeProfileUser) return;
  toggleFollow(activeProfileUser);
  persistSocial();
  render();
  openPersonDialog(activeProfileUser);
});
personBlockBtn.addEventListener('click', () => {
  if (!activeProfileUser) return;
  toggleBlock(activeProfileUser);
  persistSocial();
  render();
  openPersonDialog(activeProfileUser);
});
personChatBtn.addEventListener('click', () => {
  if (!activeProfileUser) return;
  if (isBlockedEitherWay(currentNicknameAuth, activeProfileUser)) {
    alert('拉黑关系下无法发起聊天。');
    return;
  }
  personDialog.close();
  openDirectChat(activeProfileUser);
});

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
    if (typeof parsed[0] === 'string') return parsed.map((nickname) => ({ nickname, password: '123456', firstLogin: false }));
    return parsed.map((user) => ({ nickname: user.nickname || user.username, password: user.password || '123456', firstLogin: Boolean(user.firstLogin) })).filter((user) => user.nickname);
  } catch {
    return [];
  }
}
function persistUsers(list) { localStorage.setItem(USERS_KEY, JSON.stringify(list)); }
function loadSocial() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SOCIAL_KEY) || '{}');
    return {
      follows: parsed.follows && typeof parsed.follows === 'object' ? parsed.follows : {},
      blocks: parsed.blocks && typeof parsed.blocks === 'object' ? parsed.blocks : {},
      chats: Array.isArray(parsed.chats) ? parsed.chats.map((chat) => ({
        id: chat.id || crypto.randomUUID(),
        type: chat.type === 'group' ? 'group' : 'dm',
        name: chat.name || '',
        members: Array.isArray(chat.members) ? unique(chat.members.filter(Boolean)) : [],
        messages: Array.isArray(chat.messages) ? chat.messages.map((m) => ({ sender: m.sender, text: m.text || '', createdAt: m.createdAt || new Date().toISOString() })) : []
      })) : []
    };
  } catch {
    return { follows: {}, blocks: {}, chats: [] };
  }
}
function persistSocial() { localStorage.setItem(SOCIAL_KEY, JSON.stringify(social)); }
function userStorageKey() { return `${STORAGE_KEY}:${currentNicknameAuth}`; }

function loadState() {
  const raw = localStorage.getItem(userStorageKey());
  if (!raw) return structuredClone(defaultState);
  try {
    const parsed = JSON.parse(raw);
    return {
      ...structuredClone(defaultState),
      ...parsed,
      profile: { ...defaultState.profile, ...parsed.profile, skills: Array.isArray(parsed.profile?.skills) ? parsed.profile.skills : defaultState.profile.skills, avatar: parsed.profile?.avatar || defaultState.profile.avatar },
      actions: { ...defaultState.actions, ...parsed.actions },
      mediaPosts: (Array.isArray(parsed.mediaPosts) ? parsed.mediaPosts : defaultState.mediaPosts).map((post) => ({ ...post, createdAt: post.createdAt || new Date().toISOString(), checkin: post.checkin || `${post.location || '未知地点'} · ${formatTime(new Date().toISOString())}` })),
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
        review: trip.review || { score: 5.0, count: 1, highlights: [] },
        trust: trip.trust || { score: 4.5, completion: 90, verified: false }
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
  avatarPreview.src = state.profile.avatar || defaultAvatar;
  avatarHint.textContent = state.profile.avatar ? t('avatarHintSaved') : t('avatarHintDefault');
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
function syncUserChip() {
  currentNickname.textContent = currentNicknameAuth;
  headerAvatar.src = state.profile.avatar || defaultAvatar;
}
function toggleProfilePanel() {
  if (profilePanel.hidden) openProfilePanel(); else closeProfilePanel();
}
function openProfilePanel() {
  profilePanel.hidden = false;
  profilePanel.classList.add('open');
  profileToggle.setAttribute('aria-expanded', 'true');
}
function closeProfilePanel() {
  if (forceProfileCompletion) return;
  profilePanel.hidden = true;
  profilePanel.classList.remove('open');
  profileToggle.setAttribute('aria-expanded', 'false');
}

function collectBadges() {
  const badges = [];
  if (state.actions.connect.length) badges.push('🤝 初次结伴');
  if (state.mediaPosts.length) badges.push('📸 旅行记录官');
  if (state.mediaPosts.some((post) => isOverseas(post.location))) badges.push('✈️ 出境初体验');
  if (getFriends().length) badges.push('🫶 默契好友');
  return badges;
}
function matchScore(trip) {
  let score = 60;
  if (trip.pace === state.profile.pace) score += 8;
  if (trip.wakeUp === state.profile.wakeUp) score += 6;
  if (trip.social === state.profile.social) score += 6;
  if (trip.profile?.mbti === state.profile.mbti) score += 8;
  if (trip.profile?.zodiac === state.profile.zodiac) score += 4;
  const overlap = (trip.profile?.skills || []).filter((skill) => state.profile.skills.includes(skill)).length;
  score += Math.min(8, overlap * 2);
  const budgetGap = Math.abs((trip.budget || 0) - levelBudget(state.profile.budgetLevel));
  if (budgetGap < 1200) score += 6;
  if (isMutualFollow(currentNicknameAuth, trip.user)) score += 4;
  return Math.max(50, Math.min(99, Math.round(score)));
}
function hotScore(trip) { return (trip.likeCount || 0) * 3 + new Date(trip.createdAt).getTime() / 1000000000; }
function sortTrips(list, mode) {
  if (mode === 'newest') return [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  if (mode === 'hottest') return [...list].sort((a, b) => hotScore(b) - hotScore(a));
  return [...list].sort((a, b) => (matchScore(b) + hotScore(b) / 3) - (matchScore(a) + hotScore(a) / 3));
}

function toList(value) { return String(value).split(',').map((item) => item.trim()).filter(Boolean); }
function unique(list) { return [...new Set(list)]; }
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
