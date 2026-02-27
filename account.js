const STORAGE_KEY = 'romanticJourneyState';
const defaultAvatar = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=160&q=80';

const params = new URLSearchParams(window.location.search);
const user = params.get('user') || '';
const card = document.querySelector('#accountCard');

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function render() {
  if (!user) {
    card.innerHTML = '<h2>账户不存在</h2>';
    return;
  }
  let state = {};
  try {
    state = JSON.parse(localStorage.getItem(`${STORAGE_KEY}:${user}`) || '{}');
  } catch {
    state = {};
  }
  const avatar = state.profile?.avatar || defaultAvatar;
  const trips = Array.isArray(state.trips) ? state.trips : [];
  const media = Array.isArray(state.mediaPosts) ? state.mediaPosts : [];
  card.innerHTML = `
    <div class="person-hero">
      <img class="person-avatar" src="${escapeHtml(avatar)}" alt="${escapeHtml(user)}" />
      <div>
        <h2 style="margin:0;">${escapeHtml(user)} 的账户主页</h2>
        <p class="hint">行程 ${trips.length} 条 ｜ 主页内容 ${media.length} 条</p>
      </div>
    </div>
    <p class="hint">最近行程：${escapeHtml(trips[0]?.destination || '暂无')}</p>
    <a href="search.html" class="secondary" style="display:inline-block;margin-top:.5rem;">返回查询</a>
  `;
}

render();
