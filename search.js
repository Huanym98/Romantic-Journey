const USERS_KEY = 'romanticJourneyUsers';
const CURRENT_USER_KEY = 'romanticJourneyCurrentUser';
const STORAGE_KEY = 'romanticJourneyState';

const queryInput = document.querySelector('#queryInput');
const queryResult = document.querySelector('#queryResult');

requireCurrentNickname();
renderResults('');

queryInput?.addEventListener('input', () => {
  renderResults(String(queryInput.value || '').trim());
});

function requireCurrentNickname() {
  const nickname = localStorage.getItem(CURRENT_USER_KEY);
  if (!nickname) {
    window.location.href = 'register.html';
    throw new Error('No current user');
  }
  return nickname;
}

function getUsers() {
  try {
    const parsed = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    if (parsed.length && typeof parsed[0] === 'string') return parsed;
    return parsed.map((item) => item.nickname || item.username).filter(Boolean);
  } catch {
    return [];
  }
}

function getAllTrips() {
  const trips = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i) || '';
    if (!key.startsWith(`${STORAGE_KEY}:`)) continue;
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || '{}');
      const list = Array.isArray(parsed.trips) ? parsed.trips : [];
      list.forEach((trip) => trips.push(trip));
    } catch {
      // ignore invalid payload
    }
  }
  return trips;
}

function contains(text, keyword) {
  return String(text || '').toLowerCase().includes(keyword.toLowerCase());
}

function renderResults(keyword) {
  const users = getUsers();
  const trips = getAllTrips();

  const matchedUsers = keyword ? users.filter((name) => contains(name, keyword)) : users.slice(0, 8);
  const matchedTrips = keyword
    ? trips.filter((trip) => {
      const tags = Array.isArray(trip.tags) ? trip.tags.join(' ') : '';
      const spots = Array.isArray(trip.spots) ? trip.spots.join(' ') : '';
      return [trip.user, trip.destination, trip.itinerary, tags, spots].some((field) => contains(field, keyword));
    })
    : trips.slice(0, 8);

  const userHtml = matchedUsers.length
    ? matchedUsers.map((name) => `<article class="msg-item"><strong>👤 ${name}</strong></article>`).join('')
    : '<p class="hint">未匹配到用户</p>';

  const tripHtml = matchedTrips.length
    ? matchedTrips.map((trip) => `<article class="msg-item"><strong>🧭 ${trip.user || '匿名'} · ${trip.destination || '未知目的地'}</strong><p class="hint">${trip.itinerary || '暂无行程描述'}</p></article>`).join('')
    : '<p class="hint">未匹配到行程</p>';

  queryResult.innerHTML = `
    <h3>用户结果</h3>
    ${userHtml}
    <h3 style="margin-top:.7rem;">行程结果</h3>
    ${tripHtml}
  `;
}
