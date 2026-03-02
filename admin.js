const USERS_KEY = 'romanticJourneyUsers';
const STORAGE_KEY = 'romanticJourneyState';
const ADMIN_EVENTS_KEY = 'romanticJourneyAdminEvents';

const overview = document.querySelector('#overview');
const eventList = document.querySelector('#eventList');
const userList = document.querySelector('#userList');
const tripList = document.querySelector('#tripList');
const clearEventsBtn = document.querySelector('#clearEventsBtn');

const users = getUsers();
const state = getState();
let events = getAdminEvents();

clearEventsBtn?.addEventListener('click', () => {
  events = [];
  localStorage.setItem(ADMIN_EVENTS_KEY, JSON.stringify(events));
  render();
});

render();

function render() {
  renderOverview();
  renderEvents();
  renderUsers();
  renderTrips();
}

function renderOverview() {
  if (!overview) return;
  const trips = Array.isArray(state.trips) ? state.trips : [];
  const mediaPosts = Array.isArray(state.mediaPosts) ? state.mediaPosts : [];
  const likes = trips.reduce((sum, trip) => sum + (trip.likeCount || 0), 0);
  overview.innerHTML = [
    statCard('注册用户', users.length),
    statCard('行程总数', trips.length),
    statCard('日记总数', mediaPosts.length),
    statCard('日志事件', events.length),
    statCard('累计点赞', likes)
  ].join('');
}

function statCard(label, value) {
  return `<article><strong>${value}</strong><span>${label}</span></article>`;
}

function renderEvents() {
  if (!eventList) return;
  if (!events.length) {
    eventList.innerHTML = '<p class="hint">暂无行为日志。</p>';
    return;
  }
  eventList.innerHTML = [...events]
    .reverse()
    .slice(0, 100)
    .map((item) => {
      const payload = item.payload ? JSON.stringify(item.payload) : '';
      return `<article class="msg-item"><strong>${item.type || 'unknown'}</strong><p class="hint">用户：${item.user || '游客'} ｜ 时间：${formatTime(item.createdAt)}</p><p class="hint">${payload}</p></article>`;
    })
    .join('');
}

function renderUsers() {
  if (!userList) return;
  if (!users.length) {
    userList.innerHTML = '<p class="hint">暂无注册用户。</p>';
    return;
  }
  userList.innerHTML = users
    .map((user) => `<article class="msg-item"><strong>${user.nickname}</strong><p class="hint">首次登录：${user.firstLogin ? '是' : '否'} ｜ 注册时间：${formatTime(user.createdAt)}</p></article>`)
    .join('');
}

function renderTrips() {
  if (!tripList) return;
  const trips = Array.isArray(state.trips) ? state.trips : [];
  if (!trips.length) {
    tripList.innerHTML = '<p class="hint">暂无行程。</p>';
    return;
  }
  tripList.innerHTML = trips
    .slice(0, 30)
    .map((trip) => `<article class="msg-item"><strong>${trip.destination || '未知目的地'}</strong><p class="hint">发布者：${trip.user || '未知'} ｜ ${trip.departDate || '未知'} → ${trip.returnDate || '未知'}</p><p class="hint">预算：¥${trip.budget || 0} ｜ 点赞：${trip.likeCount || 0} ｜ 评论：${Array.isArray(trip.comments) ? trip.comments.length : 0}</p></article>`)
    .join('');
}

function getUsers() {
  try {
    const parsed = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    if (!parsed.length) return [];
    if (typeof parsed[0] === 'string') {
      return parsed.map((nickname) => ({ nickname, firstLogin: false, createdAt: '' }));
    }
    return parsed
      .map((user) => ({
        nickname: user.nickname || user.username || '',
        firstLogin: Boolean(user.firstLogin),
        createdAt: user.createdAt || ''
      }))
      .filter((user) => user.nickname);
  } catch {
    return [];
  }
}

function getState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function getAdminEvents() {
  try {
    const parsed = JSON.parse(localStorage.getItem(ADMIN_EVENTS_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function formatTime(value) {
  if (!value) return '未知';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '未知';
  return date.toLocaleString('zh-CN', { hour12: false });
}
