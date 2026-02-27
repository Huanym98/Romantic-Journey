const STORAGE_KEY = 'romanticJourneyState';

const params = new URLSearchParams(window.location.search);
const id = params.get('id') || '';
const user = params.get('user') || '';
const card = document.querySelector('#tripCard');

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function findTrip() {
  if (user) {
    try {
      const parsed = JSON.parse(localStorage.getItem(`${STORAGE_KEY}:${user}`) || '{}');
      const list = Array.isArray(parsed.trips) ? parsed.trips : [];
      const found = list.find((trip) => String(trip.id || '') === id);
      if (found) return found;
    } catch {
      // ignore
    }
  }
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i) || '';
    if (!key.startsWith(`${STORAGE_KEY}:`)) continue;
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || '{}');
      const list = Array.isArray(parsed.trips) ? parsed.trips : [];
      const found = list.find((trip) => String(trip.id || '') === id);
      if (found) return found;
    } catch {
      // ignore
    }
  }
  return null;
}

function render() {
  const trip = findTrip();
  if (!trip) {
    card.innerHTML = '<h2>行程不存在</h2><a href="search.html" class="secondary">返回查询</a>';
    return;
  }
  const tags = Array.isArray(trip.tags) ? trip.tags.map((tag) => `#${escapeHtml(tag)}`).join(' ') : '';
  const spots = Array.isArray(trip.spots) ? trip.spots.join('、') : '暂无';
  card.innerHTML = `
    <h2>${escapeHtml(trip.user || '匿名')} · ${escapeHtml(trip.destination || '未知目的地')}</h2>
    <p class="hint">时间：${escapeHtml(trip.departDate || '未知')} → ${escapeHtml(trip.returnDate || '未知')} ｜ 预算：¥${escapeHtml(trip.budget || '0')}</p>
    <p>${escapeHtml(trip.itinerary || '暂无详细安排')}</p>
    <p class="hint">标签：${tags || '暂无'}</p>
    <p class="hint">景点：${escapeHtml(spots)}</p>
    <a href="search.html" class="secondary" style="display:inline-block;margin-top:.5rem;">返回查询</a>
  `;
}

render();
