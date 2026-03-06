const STORAGE_KEY = 'romanticJourneyState';

const params = new URLSearchParams(window.location.search);
const id = params.get('id') || '';
const user = params.get('user') || '';
const card = document.querySelector('#tripCard');
const personDialog = document.querySelector('#personDialog');
const personDialogClose = document.querySelector('#personDialogClose');
const personAvatar = document.querySelector('#personAvatar');
const personMeta = document.querySelector('#personMeta');
const personRelation = document.querySelector('#personRelation');
const personSkills = document.querySelector('#personSkills');
const personHomeBtn = document.querySelector('#personHomeBtn');
const defaultAvatar = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=80&q=80';

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

function getUserState(nickname) {
  if (!nickname) return null;
  try {
    const parsed = JSON.parse(localStorage.getItem(`${STORAGE_KEY}:${nickname}`) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
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

function openPersonDialog(nickname) {
  if (!personDialog) return;
  const state = getUserState(nickname) || {};
  const profile = state.profile || {};
  if (personAvatar) personAvatar.src = profile.avatar || defaultAvatar;
  if (personMeta) personMeta.textContent = `${nickname || '未知用户'} ｜ MBTI: ${profile.mbti || '未知'} ｜ 星座: ${profile.zodiac || '未知'}`;
  if (personRelation) personRelation.textContent = `旅行节奏：${profile.pace || '未知'} ｜ 作息：${profile.wakeUp || '未知'}`;
  if (personSkills) personSkills.textContent = `技能标签：${Array.isArray(profile.skills) && profile.skills.length ? profile.skills.join('、') : '暂无'}`;
  if (personHomeBtn) personHomeBtn.onclick = () => { window.location.href = `account.html?user=${encodeURIComponent(nickname)}`; };
  if (typeof personDialog.showModal === 'function') personDialog.showModal();
}

function render() {
  const trip = findTrip();
  if (!trip) {
    card.innerHTML = '<h2>行程不存在</h2>';
    return;
  }

  const tags = Array.isArray(trip.tags) ? trip.tags.map((tag) => `#${escapeHtml(tag)}`).join(' ') : '';
  const spots = Array.isArray(trip.spots) ? trip.spots.map((spot) => escapeHtml(spot)).join('、') : '暂无';
  const comments = Array.isArray(trip.comments) ? trip.comments : [];
  const likeCount = Number(trip.likeCount || 0);
  const shareUrl = `${window.location.origin}${window.location.pathname}?id=${encodeURIComponent(trip.id)}&user=${encodeURIComponent(trip.user || user)}`;

  card.innerHTML = `
    <h2>${escapeHtml(trip.destination || '未知目的地')}</h2>
    <div class="author-row" style="margin:.4rem 0 .65rem;">
      <img class="author-avatar" id="tripAuthorAvatar" src="${escapeHtml(trip.avatar || defaultAvatar)}" alt="${escapeHtml(trip.user || '匿名')}头像" />
      <button id="tripAuthorHomeBtn" type="button" class="ghost">${escapeHtml(trip.user || '匿名')}</button>
    </div>
    <p class="hint">发布用户：${escapeHtml(trip.user || '匿名')} ｜ 点赞：${likeCount} ｜ 评论：${comments.length}</p>
    <p class="hint">时间：${escapeHtml(trip.departDate || '未知')} → ${escapeHtml(trip.returnDate || '未知')} ｜ 预算：¥${escapeHtml(trip.budget || '0')}</p>
    <p>${escapeHtml(trip.itinerary || '暂无详细安排')}</p>
    <p class="hint">标签：${tags || '暂无'}</p>
    <p class="hint">景点：${spots}</p>
    <div style="display:flex;gap:.5rem;flex-wrap:wrap;margin:.75rem 0;">
      <button id="shareTripBtn" class="share-pill" type="button">↗ 分享</button>
    </div>
    <p id="shareResult" class="hint" style="word-break:break-all;"></p>
    <h3>所有评论</h3>
    <div class="msg-list">
      ${comments.length
    ? comments.map((comment) => `<article class="msg-item trip-comment-item"><img class="comment-avatar" data-user="${escapeHtml(comment.user || '')}" src="${escapeHtml(comment.avatar || defaultAvatar)}" alt="${escapeHtml(comment.user || '匿名')}头像" /><div><p><strong>${escapeHtml(comment.user || '匿名')}</strong></p><p>${escapeHtml(comment.text || '')}</p><small>${formatTime(comment.createdAt)}</small></div></article>`).join('')
    : '<p class="hint">暂无评论。</p>'}
    </div>
  `;

  const goAuthorHome = () => {
    const owner = trip.user || user;
    if (!owner) return;
    window.location.href = `account.html?user=${encodeURIComponent(owner)}`;
  };
  document.querySelector('#tripAuthorAvatar')?.addEventListener('click', goAuthorHome);
  document.querySelector('#tripAuthorHomeBtn')?.addEventListener('click', goAuthorHome);

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

  card.querySelectorAll('.comment-avatar[data-user]').forEach((el) => {
    el.style.cursor = 'pointer';
    el.title = '查看用户主页';
    el.addEventListener('click', () => {
      const nickname = el.dataset.user || '';
      if (!nickname) return;
      window.location.href = `account.html?user=${encodeURIComponent(nickname)}`;
    });
  });
}

personDialogClose?.addEventListener('click', () => personDialog.close());

render();
