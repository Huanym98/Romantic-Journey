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

function normalizeCaption(caption) {
  return String(caption || '').replace(/\s·\s\d+$/, '').trim();
}

function toTs(value) {
  const ts = new Date(value || 0).getTime();
  return Number.isFinite(ts) ? ts : 0;
}

function readPostsByOwner(owner) {
  if (!owner) return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(`${STORAGE_KEY}:${owner}`) || '{}');
    const list = Array.isArray(parsed.mediaPosts) ? parsed.mediaPosts : [];
    return list.map((item) => ({ ...item, user: item.user || owner }));
  } catch {
    return [];
  }
}

function findDiaryWithPool() {
  if (user) {
    const byOwner = readPostsByOwner(user);
    const found = byOwner.find((item) => String(item.id || '') === id);
    if (found) return { diary: found, pool: byOwner };
  }

  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i) || '';
    if (!key.startsWith(`${STORAGE_KEY}:`)) continue;
    const owner = key.replace(`${STORAGE_KEY}:`, '');
    const list = readPostsByOwner(owner);
    const found = list.find((item) => String(item.id || '') === id);
    if (found) return { diary: found, pool: list };
  }
  return { diary: null, pool: [] };
}

function resolveDiaryImages(diary, pool) {
  const imagePosts = pool.filter((item) => (item.type || '图片') === '图片' && item.cover);
  let grouped = [];

  if (diary.batchId) {
    grouped = imagePosts.filter((item) => item.batchId === diary.batchId);
  } else {
    const sameTitle = normalizeCaption(diary.caption);
    const baseTs = toTs(diary.createdAt);
    grouped = imagePosts.filter((item) => {
      const tsGap = Math.abs(toTs(item.createdAt) - baseTs);
      return normalizeCaption(item.caption) === sameTitle
        && String(item.location || '') === String(diary.location || '')
        && String(item.checkin || '') === String(diary.checkin || '')
        && tsGap <= 2 * 60 * 1000;
    });
  }

  const all = grouped.length ? grouped : [diary];
  return all
    .filter((item) => item.cover)
    .sort((a, b) => toTs(a.createdAt) - toTs(b.createdAt))
    .slice(0, 9)
    .map((item) => item.cover);
}

function setupLightbox() {
  const dialog = document.querySelector('#diaryLightbox');
  const image = document.querySelector('#lightboxImage');
  const closeBtn = document.querySelector('#lightboxClose');
  if (!dialog || !image) return;

  closeBtn?.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });

  card?.addEventListener('click', (event) => {
    const thumb = event.target.closest('[data-gallery-src]');
    if (!thumb) return;
    image.src = thumb.dataset.gallerySrc || '';
    image.alt = thumb.dataset.galleryAlt || '日记图片';
    dialog.showModal();
  });
}

function render() {
  const { diary, pool } = findDiaryWithPool();
  if (!diary) {
    card.innerHTML = '<h2>日记不存在</h2><a href="search.html" class="nav-back-btn" aria-label="返回查询">← 返回查询</a>';
    return;
  }

  const images = resolveDiaryImages(diary, pool);
  const title = escapeHtml(normalizeCaption(diary.caption) || '未命名日记');
  const galleryHtml = images.length
    ? images.map((src, index) => `
      <button type="button" class="diary-grid-item" data-gallery-src="${escapeHtml(src)}" data-gallery-alt="${title} ${index + 1}">
        <img src="${escapeHtml(src)}" alt="${title} ${index + 1}" />
      </button>
    `).join('')
    : `
      <button type="button" class="diary-grid-item" data-gallery-src="${escapeHtml(diary.cover || defaultCover)}" data-gallery-alt="${title}">
        <img src="${escapeHtml(diary.cover || defaultCover)}" alt="${title}" />
      </button>
    `;

  card.innerHTML = `
    <h2>${title}</h2>
    <p class="hint">作者：${escapeHtml(diary.user || '匿名')} ｜ 地点：${escapeHtml(diary.location || '未知地点')}</p>
    <p class="hint">打卡：${escapeHtml(diary.checkin || '未打卡')}</p>
    <p class="hint">共 ${Math.max(images.length, 1)} 张图片（九宫格展示）</p>

    <section class="diary-gallery-grid" aria-label="日记图片九宫格">
      ${galleryHtml}
    </section>

    <a href="search.html" class="nav-back-btn" aria-label="返回查询">← 返回查询</a>

    <dialog id="diaryLightbox" class="diary-lightbox">
      <button type="button" id="lightboxClose" class="lightbox-close">关闭</button>
      <img id="lightboxImage" src="" alt="日记图片预览" />
    </dialog>
  `;

  setupLightbox();
}

render();
