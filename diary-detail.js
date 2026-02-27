const STORAGE_KEY = 'romanticJourneyState';
const defaultCover = 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80';

const params = new URLSearchParams(window.location.search);
const id = params.get('id') || '';
const user = params.get('user') || '';
const card = document.querySelector('#diaryCard');

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function findDiary() {
  if (user) {
    try {
      const parsed = JSON.parse(localStorage.getItem(`${STORAGE_KEY}:${user}`) || '{}');
      const list = Array.isArray(parsed.mediaPosts) ? parsed.mediaPosts : [];
      const found = list.find((item) => String(item.id || '') === id);
      if (found) return { ...found, user: found.user || user };
    } catch {
      // ignore
    }
  }
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i) || '';
    if (!key.startsWith(`${STORAGE_KEY}:`)) continue;
    const owner = key.replace(`${STORAGE_KEY}:`, '');
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || '{}');
      const list = Array.isArray(parsed.mediaPosts) ? parsed.mediaPosts : [];
      const found = list.find((item) => String(item.id || '') === id);
      if (found) return { ...found, user: found.user || owner };
    } catch {
      // ignore
    }
  }
  return null;
}

function render() {
  const diary = findDiary();
  if (!diary) {
    card.innerHTML = '<h2>日记不存在</h2><a href="search.html" class="secondary">返回查询</a>';
    return;
  }
  card.innerHTML = `
    <h2>${escapeHtml(diary.caption || '未命名日记')}</h2>
    <p class="hint">作者：${escapeHtml(diary.user || '匿名')} ｜ 地点：${escapeHtml(diary.location || '未知地点')}</p>
    <p class="hint">打卡：${escapeHtml(diary.checkin || '未打卡')}</p>
    <img src="${escapeHtml(diary.cover || defaultCover)}" alt="${escapeHtml(diary.caption || '日记封面')}" style="width:100%;max-height:420px;object-fit:cover;border-radius:12px;border:1px solid #e5e7eb;" />
    <a href="search.html" class="secondary" style="display:inline-block;margin-top:.6rem;">返回查询</a>
  `;
}

render();
