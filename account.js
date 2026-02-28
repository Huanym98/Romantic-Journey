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

function normalizeList(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item || '').trim()).filter(Boolean);
}

function buildProfileDetail(profile = {}, trips = []) {
  const latestTripProfile = trips.find((trip) => trip?.profile)?.profile || {};
  const merged = {
    birthday: profile.birthday || latestTripProfile.birthday || '',
    mbti: profile.mbti || latestTripProfile.mbti || '',
    zodiac: profile.zodiac || latestTripProfile.zodiac || '',
    pace: profile.pace || '',
    budgetLevel: profile.budgetLevel || '',
    wakeUp: profile.wakeUp || '',
    social: profile.social || '',
    skills: normalizeList(profile.skills || latestTripProfile.skills)
  };

  return [
    ['生日', merged.birthday || '未填写'],
    ['MBTI', merged.mbti || '未填写'],
    ['星座', merged.zodiac || '未填写'],
    ['旅行节奏', merged.pace || '未填写'],
    ['预算偏好', merged.budgetLevel || '未填写'],
    ['作息', merged.wakeUp || '未填写'],
    ['社交偏好', merged.social || '未填写'],
    ['技能标签', merged.skills.length ? merged.skills.join('、') : '未填写']
  ];
}

function renderTrips(trips) {
  if (!trips.length) {
    return '<p class="hint">暂未发布行程</p>';
  }
  return trips
    .slice(0, 5)
    .map((trip) => {
      const destination = escapeHtml(trip.destination || '未知目的地');
      const departDate = escapeHtml(trip.departDate || '-');
      const returnDate = escapeHtml(trip.returnDate || '-');
      const budget = Number(trip.budget);
      const budgetText = Number.isFinite(budget) && budget > 0 ? `¥${budget}` : '未填写';
      const itinerary = escapeHtml(trip.itinerary || '暂无详细行程说明');
      const tags = normalizeList(trip.tags);
      const tagsHtml = tags.length ? `<p class="hint">标签：${escapeHtml(tags.join(' / '))}</p>` : '';
      return `
        <article class="account-entry">
          <h4>🧭 ${destination}</h4>
          <p class="hint">时间：${departDate} ~ ${returnDate} ｜ 预算：${escapeHtml(budgetText)}</p>
          ${tagsHtml}
          <p>${itinerary}</p>
        </article>
      `;
    })
    .join('');
}

function renderDiaries(mediaPosts) {
  if (!mediaPosts.length) {
    return '<p class="hint">暂未发布主页内容</p>';
  }
  return mediaPosts
    .slice(0, 6)
    .map((item) => {
      const title = escapeHtml(item.caption || '未命名内容');
      const type = escapeHtml(item.type || '动态');
      const location = escapeHtml(item.location || '未知地点');
      const checkin = escapeHtml(item.checkin || '未打卡');
      return `
        <article class="account-entry">
          <h4>📌 ${title}</h4>
          <p class="hint">${type} ｜ ${location}</p>
          <p class="hint">打卡：${checkin}</p>
        </article>
      `;
    })
    .join('');
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
  const trips = (Array.isArray(state.trips) ? state.trips : []).slice().sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  const media = (Array.isArray(state.mediaPosts) ? state.mediaPosts : []).slice().sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  const profileDetails = buildProfileDetail(state.profile || {}, trips)
    .map(([label, value]) => `<li><strong>${escapeHtml(label)}：</strong>${escapeHtml(value)}</li>`)
    .join('');

  card.innerHTML = `
    <div class="person-hero">
      <img class="person-avatar" src="${escapeHtml(avatar)}" alt="${escapeHtml(user)}" />
      <div>
        <h2 style="margin:0;">${escapeHtml(user)} 的账户主页</h2>
        <p class="hint">行程 ${trips.length} 条 ｜ 主页内容 ${media.length} 条</p>
      </div>
    </div>

    <section class="account-section">
      <h3>个人资料</h3>
      <ul class="account-detail-list">${profileDetails}</ul>
    </section>

    <section class="account-section">
      <h3>近期行程</h3>
      ${renderTrips(trips)}
    </section>

    <section class="account-section">
      <h3>主页动态</h3>
      ${renderDiaries(media)}
    </section>

    <a href="search.html" class="nav-back-btn" aria-label="返回查询">← 返回查询</a>
  `;
}

render();
