const USERS_KEY = 'romanticJourneyUsers';
const CURRENT_USER_KEY = 'romanticJourneyCurrentUser';
const STORAGE_KEY = 'romanticJourneyState';
const defaultAvatar = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=160&q=80';

const queryInput = document.querySelector('#queryInput');
const queryResult = document.querySelector('#queryResult');
const queryForm = document.querySelector('#queryForm');

requireCurrentNickname();
renderResults('');

queryInput?.addEventListener('input', () => {
  renderResults(String(queryInput.value || '').trim());
});
queryForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  renderResults(String(queryInput?.value || '').trim());
});

function requireCurrentNickname() {
  const nickname = localStorage.getItem(CURRENT_USER_KEY);
  if (!nickname) {
    window.location.href = 'register.html';
    throw new Error('No current user');
  }
  return nickname;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function getUsers() {
  try {
    const parsed = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    if (parsed.length && typeof parsed[0] === 'string') return parsed.map((nickname) => ({ nickname, avatar: getUserAvatar(nickname) }));
    return parsed
      .map((item) => ({ nickname: item.nickname || item.username, avatar: getUserAvatar(item.nickname || item.username) }))
      .filter((item) => item.nickname);
  } catch {
    return [];
  }
}

function getUserAvatar(nickname) {
  if (!nickname) return defaultAvatar;
  try {
    const parsed = JSON.parse(localStorage.getItem(`${STORAGE_KEY}:${nickname}`) || '{}');
    if (parsed.profile?.avatar) return parsed.profile.avatar;
    const trips = Array.isArray(parsed.trips) ? parsed.trips : [];
    const ownTrip = trips.find((trip) => trip.user === nickname);
    return ownTrip?.avatar || defaultAvatar;
  } catch {
    return defaultAvatar;
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

  const matchedUsers = keyword ? users.filter((item) => contains(item.nickname, keyword)) : users.slice(0, 8);
  const matchedTrips = keyword
    ? trips.filter((trip) => {
      const tags = Array.isArray(trip.tags) ? trip.tags.join(' ') : '';
      const spots = Array.isArray(trip.spots) ? trip.spots.join(' ') : '';
      return [trip.user, trip.destination, trip.itinerary, tags, spots].some((field) => contains(field, keyword));
    })
    : trips.slice(0, 8);

  const accountHtml = matchedUsers.length
    ? matchedUsers.map((item) => {
      const safeName = escapeHtml(item.nickname);
      const safeAvatar = escapeHtml(item.avatar || defaultAvatar);
      return `<a class="msg-item search-result-link" href="account.html?user=${encodeURIComponent(item.nickname)}"><img class="search-avatar" src="${safeAvatar}" alt="${safeName}" /><strong>${safeName}</strong></a>`;
    }).join('')
    : '<p class="hint">未匹配到账户</p>';

  const tripHtml = matchedTrips.length
    ? matchedTrips.map((trip) => {
      const user = escapeHtml(trip.user || '匿名');
      const destination = escapeHtml(trip.destination || '未知目的地');
      const itinerary = escapeHtml(trip.itinerary || '暂无行程描述');
      const id = encodeURIComponent(trip.id || '');
      const owner = encodeURIComponent(trip.user || '');
      return `<a class="msg-item search-result-link" href="trip-detail.html?id=${id}&user=${owner}"><strong>🧭 ${user} · ${destination}</strong><p class="hint">${itinerary}</p></a>`;
    }).join('')
    : '<p class="hint">未匹配到行程</p>';

  queryResult.innerHTML = `
    <h3>账户</h3>
    ${accountHtml}
    <h3 style="margin-top:.7rem;">行程</h3>
    ${tripHtml}
  `;
}
