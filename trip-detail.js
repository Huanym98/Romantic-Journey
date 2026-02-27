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

function formatTime(iso) {
  if (!iso) return '未知';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '未知';
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day} ${hour}:${minute}`;
}

function render() {
  const trip = findTrip();
  if (!trip) {
    card.innerHTML = '<h2>行程不存在</h2><a href="search.html" class="secondary">返回查询</a>';
    return;
  }

  const tags = Array.isArray(trip.tags) ? trip.tags.map((tag) => `#${escapeHtml(tag)}`).join(' ') : '';
  const spots = Array.isArray(trip.spots) ? trip.spots.map((spot) => escapeHtml(spot)).join('、') : '暂无';
  const comments = Array.isArray(trip.comments) ? trip.comments : [];
  const likeCount = Number(trip.likeCount || 0);
  const shareUrl = `${window.location.origin}${window.location.pathname}?id=${encodeURIComponent(trip.id)}&user=${encodeURIComponent(trip.user || user)}`;

  card.innerHTML = `
    <h2>${escapeHtml(trip.destination || '未知目的地')}</h2>
    <p class="hint">发布用户：${escapeHtml(trip.user || '匿名')} ｜ 点赞：${likeCount} ｜ 评论：${comments.length}</p>
    <p class="hint">时间：${escapeHtml(trip.departDate || '未知')} → ${escapeHtml(trip.returnDate || '未知')} ｜ 预算：¥${escapeHtml(trip.budget || '0')}</p>
    <p>${escapeHtml(trip.itinerary || '暂无详细安排')}</p>
    <p class="hint">标签：${tags || '暂无'}</p>
    <p class="hint">景点：${spots}</p>
    <div style="display:flex;gap:.5rem;flex-wrap:wrap;margin:.75rem 0;">
      <button id="shareTripBtn" class="ghost" type="button">转发行程</button>
      <a href="search.html" class="secondary" style="display:inline-block;">返回查询</a>
    </div>
    <p id="shareResult" class="hint" style="word-break:break-all;"></p>
    <h3>所有评论</h3>
    <div class="msg-list">
      ${comments.length
    ? comments.map((comment) => `<article class="msg-item"><strong>${escapeHtml(comment.user || '匿名')}</strong><p>${escapeHtml(comment.text || '')}</p><p class="hint">${formatTime(comment.createdAt)}</p></article>`).join('')
    : '<p class="hint">暂无评论。</p>'}
    </div>
  `;

  const shareBtn = document.querySelector('#shareTripBtn');
  const shareResult = document.querySelector('#shareResult');
  shareBtn?.addEventListener('click', async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        shareResult.textContent = `转发链接已复制：${shareUrl}`;
        return;
      }
    } catch {
      // ignore
    }
    shareResult.textContent = `转发链接：${shareUrl}`;
  });
}

render();
