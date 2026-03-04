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

function contains(text, keyword) {
  return String(text || '').toLowerCase().includes(keyword.toLowerCase());
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

function getAllTripsAndDiaries() {
  const trips = [];
  const diaries = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i) || '';
    if (!key.startsWith(`${STORAGE_KEY}:`)) continue;
    const owner = key.replace(`${STORAGE_KEY}:`, '');
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || '{}');
      const tripList = Array.isArray(parsed.trips) ? parsed.trips : [];
      const mediaList = Array.isArray(parsed.mediaPosts) ? parsed.mediaPosts : [];
      tripList.forEach((trip) => trips.push(trip));
      mediaList.forEach((item) => diaries.push({ ...item, user: item.user || owner }));
    } catch {
      // ignore invalid payload
    }
  }
  return { trips, diaries };
}

function renderResults(keyword) {
  const users = getUsers();
  const { trips, diaries } = getAllTripsAndDiaries();

  const matchedUsers = keyword ? users.filter((item) => contains(item.nickname, keyword)) : users.slice(0, 8);
  const matchedTrips = keyword
    ? trips.filter((trip) => {
      const tags = Array.isArray(trip.tags) ? trip.tags.join(' ') : '';
      const spots = Array.isArray(trip.spots) ? trip.spots.join(' ') : '';
      return [trip.user, trip.destination, trip.itinerary, tags, spots].some((field) => contains(field, keyword));
    })
    : trips.slice(0, 8);
  const matchedDiaries = keyword
    ? diaries.filter((item) => [item.user, item.caption, item.location, item.checkin].some((field) => contains(field, keyword)))
    : diaries.slice(0, 8);

  const accountHtml = matchedUsers.length
    ? matchedUsers.map((item) => {
      const safeName = escapeHtml(item.nickname);
      const safeAvatar = escapeHtml(item.avatar || defaultAvatar);
      return `<a class="msg-item search-result-link search-result-account" href="account.html?user=${encodeURIComponent(item.nickname)}"><img class="search-avatar" src="${safeAvatar}" alt="${safeName}" /><strong>${safeName}</strong></a>`;
    }).join('')
    : '<p class="hint">未匹配到账户</p>';

  const tripHtml = matchedTrips.length
    ? matchedTrips.map((trip) => {
      const user = escapeHtml(trip.user || '匿名');
      const destination = escapeHtml(trip.destination || '未知目的地');
      const itinerary = escapeHtml(trip.itinerary || '暂无行程描述');
      const id = encodeURIComponent(trip.id || '');
      const owner = encodeURIComponent(trip.user || '');
      return `<a class="msg-item search-result-link search-result-trip" href="trip-detail.html?id=${id}&user=${owner}"><strong>🧭 ${user} · ${destination}</strong><p class="hint">${itinerary}</p></a>`;
    }).join('')
    : '<p class="hint">未匹配到行程</p>';

  const diaryHtml = matchedDiaries.length
    ? matchedDiaries.map((item) => {
      const id = encodeURIComponent(item.id || '');
      const owner = encodeURIComponent(item.user || '');
      const cover = escapeHtml(item.cover || defaultAvatar);
      const title = escapeHtml(item.caption || '未命名日记');
      const meta = escapeHtml(`${item.user || '匿名'} · ${item.location || '未知地点'}`);
      return `<a class="msg-item search-result-link search-result-account" href="diary-detail.html?id=${id}&user=${owner}"><img class="search-avatar" src="${cover}" alt="${title}" /><strong>${title}</strong><p class="hint">${meta}</p></a>`;
    }).join('')
    : '<p class="hint">未匹配到日记</p>';

  queryResult.innerHTML = `
    <h3>账户</h3>
    ${accountHtml}
    <h3 style="margin-top:.7rem;">行程</h3>
    ${tripHtml}
    <h3 style="margin-top:.7rem;">日记</h3>
    ${diaryHtml}
  `;
}
