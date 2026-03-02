const { createApp, reactive, computed, onMounted } = Vue;

const KEYS = {
  USERS: 'romanticJourneyUsers',
  CURRENT: 'romanticJourneyCurrentUser',
  SOCIAL: 'romanticJourneySocial',
  ADMIN: 'romanticJourneyAdminEvents',
  SUPPORT: 'romanticJourneySupportCount',
  STATE_PREFIX: 'romanticJourneyState:'
};
const defaultAvatar = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=160&q=80';

const read = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k) || 'null'); return v ?? d; } catch { return d; } };
const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const uid = () => crypto.randomUUID();
const now = () => new Date().toISOString();
const fmt = (t) => new Date(t || Date.now()).toLocaleString('zh-CN', { hour12: false });
const list = (s) => String(s || '').split(',').map((x) => x.trim()).filter(Boolean);
const toDataUrl = (file) => new Promise((resolve) => { const r = new FileReader(); r.onload = () => resolve(String(r.result || '')); r.readAsDataURL(file); });

function getUsers() {
  const users = read(KEYS.USERS, []);
  return users.map((u) => (typeof u === 'string' ? { nickname: u, firstLogin: false } : u)).filter((u) => u.nickname);
}
function saveUsers(users) { write(KEYS.USERS, users); }
function normalizeState(parsed) {
  const s = parsed && typeof parsed === 'object' ? parsed : {};
  const profile = s.profile && typeof s.profile === 'object' ? s.profile : {};
  return {
    profile: {
      avatar: profile.avatar || defaultAvatar,
      birthday: profile.birthday || '',
      mbti: profile.mbti || '',
      zodiac: profile.zodiac || '',
      pace: profile.pace || '平衡',
      budgetLevel: profile.budgetLevel || '舒适',
      wakeUp: profile.wakeUp || '自然醒',
      social: profile.social || '适中',
      skills: Array.isArray(profile.skills) ? profile.skills : list(profile.skills)
    },
    trips: Array.isArray(s.trips) ? s.trips : [],
    mediaPosts: Array.isArray(s.mediaPosts) ? s.mediaPosts : [],
    actions: s.actions && typeof s.actions === 'object' ? s.actions : { like: [], dislike: [], save: [] }
  };
}
function getState(user) { return normalizeState(read(`${KEYS.STATE_PREFIX}${user}`, {})); }
function setState(user, state) { write(`${KEYS.STATE_PREFIX}${user}`, normalizeState(state)); }
function getSocial() {
  const s = read(KEYS.SOCIAL, { follows: {}, blocks: {}, chats: [] });
  return {
    follows: s.follows && typeof s.follows === 'object' ? s.follows : {},
    blocks: s.blocks && typeof s.blocks === 'object' ? s.blocks : {},
    chats: Array.isArray(s.chats) ? s.chats : []
  };
}
function setSocial(v) { write(KEYS.SOCIAL, v); }
function addEvent(type, payload = {}) {
  const events = read(KEYS.ADMIN, []);
  events.unshift({ id: uid(), type, payload, createdAt: now() });
  write(KEYS.ADMIN, events.slice(0, 500));
}

createApp({
  setup() {
    const app = reactive({
      route: location.hash.replace('#/', '') || 'register',
      current: localStorage.getItem(KEYS.CURRENT) || '',
      users: getUsers(),
      social: getSocial(),
      state: normalizeState({}),
      auth: { nickname: '', password: '' },
      profileForm: { birthday: '', mbti: '', zodiac: '', pace: '平衡', budgetLevel: '舒适', wakeUp: '自然醒', social: '适中', skillsText: '' },
      tripForm: { destination: '', departDate: '', returnDate: '', budget: 2000, tags: '', spots: '', itinerary: '', pace: '平衡', wakeUp: '自然醒', social: '适中' },
      mediaForm: { location: '', caption: '', checkin: '' },
      search: '',
      commentDraft: {},
      selectedUser: '',
      selectedTripId: '',
      selectedDiaryId: '',
      previewSrc: '',
      chatPeer: '',
      chatDraft: '',
      fromSearch: { account: false, trip: false, diary: false },
      showProfilePanel: false,
      supportCount: Number(localStorage.getItem(KEYS.SUPPORT) || 0),
      feedback: { content: '', email: '' }
    });

    function goto(route) { app.route = route; location.hash = `/${route}`; }
    function ensureLogin() { if (!app.current) { goto('register'); return false; } return true; }
    function refreshMine() {
      if (!app.current) return;
      app.state = getState(app.current);
      app.profileForm = {
        birthday: app.state.profile.birthday || '',
        mbti: app.state.profile.mbti || '',
        zodiac: app.state.profile.zodiac || '',
        pace: app.state.profile.pace || '平衡',
        budgetLevel: app.state.profile.budgetLevel || '舒适',
        wakeUp: app.state.profile.wakeUp || '自然醒',
        social: app.state.profile.social || '适中',
        skillsText: Array.isArray(app.state.profile.skills) ? app.state.profile.skills.join(',') : ''
      };
    }

    function calcBadges(state) {
      const badges = [];
      if ((state.mediaPosts || []).length > 0) badges.push('📸 旅行记录官');
      if ((state.trips || []).length > 0) badges.push('🤝 初次结伴');
      if ((state.trips || []).length >= 3) badges.push('🧭 行程达人');
      return badges.length ? badges : ['🌱 新人旅行者'];
    }
    const stateByUser = computed(() => {
      const map = {};
      app.users.forEach((u) => { map[u.nickname] = getState(u.nickname); });
      return map;
    });
    const allTrips = computed(() => {
      const rows = [];
      app.users.forEach((u) => {
        const s = stateByUser.value[u.nickname] || normalizeState({});
        s.trips.forEach((t) => rows.push({
          ...t,
          user: t.user || u.nickname,
          avatar: t.avatar || s.profile.avatar || defaultAvatar,
          ownerSkills: Array.isArray(s.profile.skills) ? s.profile.skills : [],
          ownerBadges: calcBadges(s)
        }));
      });
      return rows.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    });
    const allDiaries = computed(() => {
      const rows = [];
      app.users.forEach((u) => {
        const s = stateByUser.value[u.nickname] || normalizeState({});
        s.mediaPosts.forEach((d) => rows.push({ ...d, user: d.user || u.nickname }));
      });
      return rows.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    });

    const hasSearchKeyword = computed(() => app.search.trim().length > 0);
    const filteredUsers = computed(() => hasSearchKeyword.value ? app.users.filter((u) => u.nickname.toLowerCase().includes(app.search.toLowerCase())) : []);
    const filteredTrips = computed(() => hasSearchKeyword.value ? allTrips.value.filter((t) => [t.user, t.destination, t.itinerary, (t.tags || []).join(',')].join('|').toLowerCase().includes(app.search.toLowerCase())) : []);
    const filteredDiaries = computed(() => hasSearchKeyword.value ? allDiaries.value.filter((d) => [d.user, d.caption, d.location, d.checkin].join('|').toLowerCase().includes(app.search.toLowerCase())) : []);

    function upsertCurrentUser() {
      if (!app.current) return;
      let found = app.users.find((u) => u.nickname === app.current);
      if (!found) {
        found = { nickname: app.current, password: '', firstLogin: false };
        app.users.push(found);
      }
      saveUsers(app.users);
    }

    function loginOrRegister() {
      const nickname = app.auth.nickname.trim();
      if (!nickname) return;
      let found = app.users.find((u) => u.nickname === nickname);
      if (!found) {
        found = { nickname, password: app.auth.password, firstLogin: true };
        app.users.push(found);
        saveUsers(app.users);
        addEvent('register', { user: nickname });
      }
      localStorage.setItem(KEYS.CURRENT, nickname);
      app.current = nickname;
      refreshMine();
      goto('home');
    }

    function logout() {
      localStorage.removeItem(KEYS.CURRENT);
      app.current = '';
      app.showProfilePanel = false;
      goto('register');
    }

    function toggleProfilePanel() {
      if (!ensureLogin()) return;
      app.showProfilePanel = !app.showProfilePanel;
    }
    function closeProfilePanel() {
      app.showProfilePanel = false;
    }

    async function onAvatarChange(event) {
      const file = event.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) return;
      app.state.profile.avatar = await toDataUrl(file);
    }

    function saveProfile(event) {
      event?.preventDefault();
      if (!ensureLogin()) return;
      app.state.profile = {
        ...app.state.profile,
        birthday: app.profileForm.birthday,
        mbti: app.profileForm.mbti,
        zodiac: app.profileForm.zodiac,
        pace: app.profileForm.pace,
        budgetLevel: app.profileForm.budgetLevel,
        wakeUp: app.profileForm.wakeUp,
        social: app.profileForm.social,
        skills: list(app.profileForm.skillsText)
      };
      setState(app.current, app.state);
      addEvent('profile-save', { user: app.current });
      app.showProfilePanel = false;
      alert('资料已保存');
    }

    function supportLike() {
      app.supportCount += 1;
      localStorage.setItem(KEYS.SUPPORT, String(app.supportCount));
      addEvent('support-like', { from: app.current || 'guest', count: app.supportCount });
    }

    function submitFeedback(event) {
      event?.preventDefault();
      const content = app.feedback.content.trim();
      const email = app.feedback.email.trim();
      if (!content || !email) return;
      addEvent('feedback-submit', { from: app.current || 'guest', content, email });
      app.feedback = { content: '', email: '' };
      alert('感谢反馈，我们已收到你的建议！');
    }

    function postTrip(event) {
      event?.preventDefault();
      if (!ensureLogin()) return;
      const f = app.tripForm;
      app.state.trips.unshift({
        id: uid(),
        user: app.current,
        avatar: app.state.profile.avatar || defaultAvatar,
        destination: f.destination,
        departDate: f.departDate,
        returnDate: f.returnDate,
        budget: Number(f.budget || 0),
        tags: list(f.tags),
        spots: list(f.spots),
        itinerary: f.itinerary,
        pace: f.pace,
        wakeUp: f.wakeUp,
        social: f.social,
        profile: { birthday: app.state.profile.birthday, mbti: app.state.profile.mbti, zodiac: app.state.profile.zodiac, skills: app.state.profile.skills },
        likeCount: 0,
        comments: [],
        createdAt: now()
      });
      setState(app.current, app.state);
      addEvent('publish-trip', { user: app.current });
      app.tripForm = { destination: '', departDate: '', returnDate: '', budget: 2000, tags: '', spots: '', itinerary: '', pace: '平衡', wakeUp: '自然醒', social: '适中' };
    }

    async function postDiary(event) {
      event?.preventDefault();
      if (!ensureLogin()) return;
      const files = Array.from(document.querySelector('#diaryFiles')?.files || []).filter((f) => f.type.startsWith('image/'));
      if (!files.length) return;
      const batchId = uid();
      for (const [index, file] of files.entries()) {
        const cover = await toDataUrl(file);
        app.state.mediaPosts.unshift({
          id: uid(),
          user: app.current,
          type: '图片',
          location: app.mediaForm.location,
          caption: files.length > 1 ? `${app.mediaForm.caption} · ${index + 1}` : app.mediaForm.caption,
          checkin: app.mediaForm.checkin || `${app.mediaForm.location} · ${fmt(now())}`,
          cover,
          batchId,
          createdAt: now(),
          likes: []
        });
      }
      app.state.mediaPosts = app.state.mediaPosts.slice(0, 50);
      setState(app.current, app.state);
      addEvent('publish-diary', { user: app.current, count: files.length });
      app.mediaForm = { location: '', caption: '', checkin: '' };
      document.querySelector('#diaryFiles').value = '';
    }

    function toggleRelation(type, target) {
      if (!ensureLogin() || !target || target === app.current) return;
      const key = type === 'follow' ? 'follows' : 'blocks';
      app.social[key][app.current] = app.social[key][app.current] || [];
      const set = new Set(app.social[key][app.current]);
      set.has(target) ? set.delete(target) : set.add(target);
      app.social[key][app.current] = [...set];
      setSocial(app.social);
      addEvent(type === 'follow' ? 'toggle-follow' : 'toggle-block', { from: app.current, to: target });
    }
    function isFollowing(user) {
      const arr = app.social.follows?.[app.current] || [];
      return arr.includes(user);
    }

    function likeTrip(trip) {
      if (!ensureLogin()) return;
      const ownerState = getState(trip.user);
      const target = ownerState.trips.find((t) => t.id === trip.id);
      if (!target) return;
      target.likes = Array.isArray(target.likes) ? target.likes : [];
      const idx = target.likes.indexOf(app.current);
      if (idx >= 0) target.likes.splice(idx, 1); else target.likes.push(app.current);
      target.likeCount = target.likes.length;
      setState(trip.user, ownerState);
      addEvent('like-trip', { from: app.current, to: trip.user, tripId: trip.id });
    }

    function addComment(trip) {
      if (!ensureLogin()) return;
      const text = (app.commentDraft[trip.id] || '').trim();
      if (!text) return;
      const ownerState = getState(trip.user);
      const target = ownerState.trips.find((t) => t.id === trip.id);
      if (!target) return;
      target.comments = Array.isArray(target.comments) ? target.comments : [];
      target.comments.unshift({ id: uid(), user: app.current, avatar: app.state.profile.avatar || defaultAvatar, text, createdAt: now() });
      setState(trip.user, ownerState);
      app.commentDraft[trip.id] = '';
      addEvent('comment-trip', { from: app.current, to: trip.user, tripId: trip.id });
    }

    function openAccount(user, source = '') { app.selectedUser = user; app.fromSearch.account = source === 'search'; goto('account'); }
    function openTrip(id, source = '') { app.selectedTripId = id; app.fromSearch.trip = source === 'search'; goto('trip'); }
    function openDiary(id, source = '') { app.selectedDiaryId = id; app.fromSearch.diary = source === 'search'; goto('diary'); }
    function openChat(user) { app.chatPeer = user; goto('chat'); }

    function ensureChat() {
      if (!ensureLogin() || !app.chatPeer) return null;
      const members = [app.current, app.chatPeer].sort();
      let chat = app.social.chats.find((c) => Array.isArray(c.members) && c.members.length === 2 && c.members.slice().sort().join('|') === members.join('|'));
      if (!chat) {
        chat = { id: uid(), members, messages: [] };
        app.social.chats.unshift(chat);
      }
      return chat;
    }
    function sendChat() {
      const text = app.chatDraft.trim();
      if (!text) return;
      const chat = ensureChat();
      if (!chat) return;
      chat.messages.push({ id: uid(), from: app.current, text, createdAt: now() });
      app.chatDraft = '';
      setSocial(app.social);
      addEvent('send-chat', { from: app.current, to: app.chatPeer });
    }

    const accountData = computed(() => {
      const user = app.selectedUser || app.current;
      if (!user) return null;
      const s = stateByUser.value[user] || getState(user);
      return { user, ...s };
    });
    const tripData = computed(() => allTrips.value.find((t) => t.id === app.selectedTripId) || null);
    const diaryData = computed(() => {
      const d = allDiaries.value.find((x) => x.id === app.selectedDiaryId);
      if (!d) return null;
      const ownerState = stateByUser.value[d.user] || getState(d.user);
      const images = ownerState.mediaPosts
        .filter((m) => (d.batchId && m.batchId === d.batchId) || m.id === d.id)
        .slice(0, 9)
        .map((m) => m.cover)
        .filter(Boolean);
      return { ...d, images: images.length ? images : [d.cover] };
    });
    const currentChat = computed(() => {
      const chat = ensureChat();
      return chat || { messages: [] };
    });

    const adminStats = computed(() => {
      const events = read(KEYS.ADMIN, []);
      return {
        users: app.users.length,
        trips: allTrips.value.length,
        diaries: allDiaries.value.length,
        events: events.slice(0, 50)
      };
    });
    const myBadges = computed(() => calcBadges(app.state));
    const followingCount = computed(() => {
      if (!accountData.value?.user) return 0;
      return (app.social.follows?.[accountData.value.user] || []).length;
    });
    const followerCount = computed(() => {
      if (!accountData.value?.user) return 0;
      const target = accountData.value.user;
      return Object.values(app.social.follows || {}).filter((list) => Array.isArray(list) && list.includes(target)).length;
    });

    onMounted(() => {
      window.addEventListener('hashchange', () => {
        app.route = location.hash.replace('#/', '') || 'register';
      });
      if (app.current) {
        upsertCurrentUser();
        refreshMine();
      }
    });

    return {
      app,
      fmt,
      goto,
      loginOrRegister,
      logout,
      toggleProfilePanel,
      closeProfilePanel,
      onAvatarChange,
      saveProfile,
      supportLike,
      submitFeedback,
      postTrip,
      postDiary,
      toggleRelation,
      isFollowing,
      likeTrip,
      addComment,
      openAccount,
      openTrip,
      openDiary,
      openChat,
      sendChat,
      filteredUsers,
      filteredTrips,
      filteredDiaries,
      hasSearchKeyword,
      accountData,
      tripData,
      diaryData,
      currentChat,
      adminStats,
      myBadges,
      followingCount,
      followerCount
    };
  },
  template: `
  <div>
    <header class="top" v-if="app.route!=='register'">
      <div class="top-inner">
        <div class="brand"><img src="assets/logo.svg" alt="logo" /><span>Romantic Journey · Vue</span></div>
        <nav class="nav">
          <button :class="{active:app.route==='home'}" @click="goto('home')">首页</button>
          <button :class="{active:app.route==='my'}" @click="goto('my')">我的主页</button>
          <button :class="{active:app.route==='search'}" class="search-icon-btn" @click="goto('search')" aria-label="查询">⌕</button>
          <button :class="{active:app.route==='admin'}" @click="goto('admin')">后台</button>
        </nav>
        <div class="row" style="margin-left:auto">
          <button class="avatar-btn" @click="toggleProfilePanel" :aria-expanded="String(app.showProfilePanel)">
            <img class="avatar sm" :src="app.state.profile?.avatar || '${defaultAvatar}'" alt="avatar" />
          </button>
          <span class="chip">{{app.current || '未登录'}}</span>
          <button class="btn ghost" @click="logout">退出</button>
        </div>
      </div>
    </header>

    <aside v-if="app.route!=='register' && app.showProfilePanel" class="profile-panel">
      <div class="profile-panel-card">
        <div class="row" style="justify-content:space-between"><h3 style="margin:0">个人资料</h3><button class="btn ghost" @click="closeProfilePanel">关闭</button></div>
        <form class="grid" @submit.prevent="saveProfile" style="margin-top:8px">
          <label class="full">头像 <input type="file" accept="image/*" @change="onAvatarChange" /></label>
          <label>生日 <input v-model="app.profileForm.birthday" type="date" /></label>
          <label>MBTI
            <select v-model="app.profileForm.mbti">
              <option value="">请选择</option><option>ENFP</option><option>ENFJ</option><option>ENTP</option><option>ENTJ</option>
              <option>INFP</option><option>INFJ</option><option>INTP</option><option>INTJ</option>
              <option>ESFP</option><option>ESFJ</option><option>ESTP</option><option>ESTJ</option>
              <option>ISFP</option><option>ISFJ</option><option>ISTP</option><option>ISTJ</option>
            </select>
          </label>
          <label>星座 <input v-model="app.profileForm.zodiac" placeholder="如：金牛座" /></label>
          <label>旅行节奏
            <select v-model="app.profileForm.pace"><option>特种兵式</option><option>平衡</option><option>慢游</option></select>
          </label>
          <label>预算偏好
            <select v-model="app.profileForm.budgetLevel"><option>经济</option><option>舒适</option><option>品质</option></select>
          </label>
          <label>作息
            <select v-model="app.profileForm.wakeUp"><option>早起</option><option>自然醒</option><option>夜猫</option></select>
          </label>
          <label>社交偏好
            <select v-model="app.profileForm.social"><option>外向</option><option>适中</option><option>安静</option></select>
          </label>
          <input class="full" v-model="app.profileForm.skillsText" placeholder="技能标签（逗号分隔）" />
          <button class="btn full">保存资料</button>
        </form>
      </div>
    </aside>

    <section v-if="app.route==='register'" class="auth card">
      <h2>登录 / 注册（Vue版）</h2>
      <p class="hint">输入昵称 + 密码，自动判断登录或注册。</p>
      <div class="grid">
        <input v-model="app.auth.nickname" placeholder="昵称" />
        <input v-model="app.auth.password" type="password" placeholder="密码" />
        <button class="btn full" @click="loginOrRegister">继续</button>
      </div>
    </section>

    <main v-else class="wrap">
      <template v-if="app.route==='home'">
        <section class="card">
          <h3>发布行程</h3>
          <form class="grid" @submit.prevent="postTrip">
            <input v-model="app.tripForm.destination" placeholder="目的地" required />
            <input v-model="app.tripForm.budget" type="number" placeholder="预算" required />
            <input v-model="app.tripForm.departDate" type="date" required />
            <input v-model="app.tripForm.returnDate" type="date" required />
            <input class="full" v-model="app.tripForm.tags" placeholder="标签（逗号分隔）" required />
            <input class="full" v-model="app.tripForm.spots" placeholder="景点（逗号分隔）" required />
            <textarea class="full" v-model="app.tripForm.itinerary" placeholder="详细行程" required></textarea>
            <button class="btn full">发布行程</button>
          </form>
        </section>
        <aside class="card">
          <h3>支持与反馈</h3>
          <p class="hint">累计收到点赞支持：<strong>{{app.supportCount}}</strong></p>
          <div class="row" style="margin-bottom:8px"><button class="btn" @click="supportLike">👍 点赞支持</button></div>
          <form class="grid" @submit.prevent="submitFeedback">
            <textarea class="full" v-model="app.feedback.content" maxlength="100" placeholder="写下你的意见（100字以内）" required></textarea>
            <input class="full" type="email" v-model="app.feedback.email" placeholder="联系邮箱" required />
            <button class="btn full">提交反馈</button>
          </form>
        </aside>

        <section class="card full">
          <div class="row"><h3 style="margin:0">行程广场</h3><input v-model="app.search" placeholder="搜索用户/目的地" style="max-width:280px" /></div>
          <article class="trip trip-clickable" v-for="trip in filteredTrips" :key="trip.id" @click="openTrip(trip.id)">
            <div class="row" style="justify-content:space-between">
              <div class="row">
                <img class="avatar" :src="trip.avatar || '${defaultAvatar}'" alt="avatar" @click.stop="openAccount(trip.user)" />
                <strong>{{trip.user}} · {{trip.destination}}</strong>
                <button class="btn ghost" @click.stop="toggleRelation('follow', trip.user)">{{isFollowing(trip.user)?'取消关注':'关注'}}</button>
              </div>
              <span class="meta">{{fmt(trip.createdAt)}}</span>
            </div>
            <p class="hint">预算 ¥{{trip.budget}} ｜ 标签 {{(trip.tags||[]).join(' / ')}}</p>
            <p class="hint" v-if="trip.ownerBadges?.length">勋章：{{trip.ownerBadges.join(' ｜ ')}}</p>
            <p class="hint" v-if="trip.ownerSkills?.length">技能：{{trip.ownerSkills.join('、')}}</p>
            <p>{{trip.itinerary}}</p>
            <div class="row">
              <button class="btn" @click.stop="likeTrip(trip)">👍 {{trip.likeCount||0}}</button>
              <button class="btn ghost" @click.stop="openChat(trip.user)" aria-label="会话">💬</button>
            </div>
            <div class="row" style="margin-top:6px">
              <input v-model="app.commentDraft[trip.id]" placeholder="评论一下" style="flex:1" @click.stop/>
              <button class="btn ghost" @click.stop="addComment(trip)">发送</button>
            </div>
          </article>
        </section>

      </template>

      <template v-else-if="app.route==='my'">
        <section class="card">
          <h3>发布打卡日记（九宫格）</h3>
          <form class="grid" @submit.prevent="postDiary">
            <input v-model="app.mediaForm.location" placeholder="地点" required />
            <input v-model="app.mediaForm.checkin" placeholder="打卡文本（可选）" />
            <input class="full" v-model="app.mediaForm.caption" placeholder="标题" required />
            <input class="full" id="diaryFiles" type="file" accept="image/*" multiple required />
            <button class="btn full">发布日记</button>
          </form>
        </section>
        <section class="card full">
          <h3>我的日记</h3>
          <article class="trip" v-for="d in app.state.mediaPosts" :key="d.id">
            <div class="row" style="justify-content:space-between"><strong>{{d.caption}}</strong><span class="meta">{{d.location}} · {{fmt(d.createdAt)}}</span></div>
            <img :src="d.cover" style="width:100%;max-height:200px;object-fit:cover;border-radius:8px;border:1px solid var(--line);margin-top:6px" />
            <div class="row" style="margin-top:6px"><button class="btn ghost" @click="openDiary(d.id)">查看详情</button></div>
          </article>
        </section>
        <section class="card full">
          <h3>我的勋章</h3>
          <div class="row"><span class="chip" v-for="(badge, i) in myBadges" :key="i">{{badge}}</span></div>
        </section>
      </template>

      <template v-else-if="app.route==='search'">
        <section class="card full">
          <h3>全站查询</h3>
          <input v-model="app.search" placeholder="搜索用户/行程/日记" />
          <template v-if="hasSearchKeyword">
            <h4>账户</h4>
            <div class="row">
              <button class="btn ghost" v-for="u in filteredUsers" :key="u.nickname" @click="openAccount(u.nickname, 'search')">{{u.nickname}}</button>
            </div>
            <h4>行程</h4>
            <article class="trip trip-clickable" v-for="t in filteredTrips.slice(0,8)" :key="t.id" @click="openTrip(t.id, 'search')"><strong>{{t.user}} · {{t.destination}}</strong></article>
            <h4>日记</h4>
            <article class="trip trip-clickable" v-for="d in filteredDiaries.slice(0,8)" :key="d.id" @click="openDiary(d.id, 'search')"><strong>{{d.caption}}</strong></article>
          </template>
          <p v-else class="hint">请输入关键词后再查询结果。</p>
        </section>
      </template>

      <template v-else-if="app.route==='account'">
        <section class="card full" v-if="accountData">
          <div class="row">
            <img class="avatar lg" :src="accountData.profile?.avatar || '${defaultAvatar}'" alt="avatar" />
            <div>
              <h2 style="margin:.1rem 0">{{accountData.user}} 的主页</h2>
              <p class="hint">行程 {{(accountData.trips||[]).length}} 条 ｜ 日记 {{(accountData.mediaPosts||[]).length}} 条</p>
              <p class="hint">已关注 {{followingCount}} ｜ 粉丝 {{followerCount}}</p>
            </div>
          </div>
          <div class="grid" style="margin-top:8px">
            <div class="card">
              <h4>资料</h4>
              <p class="hint">生日 {{accountData.profile?.birthday||'-'}} ｜ MBTI {{accountData.profile?.mbti||'-'}}</p>
              <p class="hint">星座 {{accountData.profile?.zodiac||'-'}} ｜ 节奏 {{accountData.profile?.pace||'-'}}</p>
              <p class="hint">预算 {{accountData.profile?.budgetLevel||'-'}} ｜ 作息 {{accountData.profile?.wakeUp||'-'}}</p>
              <p class="hint">社交 {{accountData.profile?.social||'-'}}</p>
              <p class="hint">技能 {{Array.isArray(accountData.profile?.skills)?accountData.profile.skills.join('、'):accountData.profile?.skills}}</p>
            </div>
            <div class="card"><h4>最近行程</h4><div class="trip" v-for="t in (accountData.trips||[]).slice(0,4)" :key="t.id">{{t.destination}} · {{t.departDate}}-{{t.returnDate}}</div></div>
          </div>
          <button v-if="app.fromSearch.account" class="btn ghost" @click="goto('search')">← 返回查询</button>
        </section>
      </template>

      <template v-else-if="app.route==='trip'">
        <section class="card full" v-if="tripData">
          <h2>{{tripData.destination}}</h2>
          <p class="hint">发布者：{{tripData.user}} ｜ {{fmt(tripData.createdAt)}} ｜ 点赞 {{tripData.likeCount||0}}</p>
          <p>{{tripData.itinerary}}</p>
          <p class="hint">景点：{{(tripData.spots||[]).join('、')}}</p>
          <button v-if="app.fromSearch.trip" class="btn ghost" @click="goto('search')">← 返回查询</button>
        </section>
      </template>

      <template v-else-if="app.route==='diary'">
        <section class="card full" v-if="diaryData">
          <h2>{{diaryData.caption}}</h2>
          <p class="hint">{{diaryData.user}} · {{diaryData.location}} · {{diaryData.checkin}}</p>
          <section class="diary-grid">
            <img v-for="(img,i) in diaryData.images" :key="i" :src="img" @click="app.previewSrc=img; $refs.pv.showModal()" />
          </section>
          <button v-if="app.fromSearch.diary" class="btn ghost" @click="goto('search')" style="margin-top:8px">← 返回查询</button>
        </section>
      </template>

      <template v-else-if="app.route==='chat'">
        <section class="card full">
          <h2>与 {{app.chatPeer}} 聊天</h2>
          <div class="trip" style="max-height:360px;overflow:auto">
            <p v-if="!currentChat.messages.length" class="hint">还没有消息</p>
            <div v-for="m in currentChat.messages" :key="m.id" class="msg-row" :class="{me: m.from===app.current}">
              <div class="msg-bubble"><strong>{{m.from}}</strong><p style="margin:.2rem 0">{{m.text}}</p><small class="meta">{{fmt(m.createdAt)}}</small></div>
            </div>
          </div>
          <div class="row"><input v-model="app.chatDraft" placeholder="输入消息" style="flex:1"/><button class="btn" @click="sendChat">发送</button><button class="btn ghost" @click="goto('home')">返回首页</button></div>
        </section>
      </template>

      <template v-else-if="app.route==='admin'">
        <section class="card full">
          <h2>管理后台</h2>
          <div class="row">
            <span class="chip">用户 {{adminStats.users}}</span>
            <span class="chip">行程 {{adminStats.trips}}</span>
            <span class="chip">日记 {{adminStats.diaries}}</span>
          </div>
          <h4>最近事件</h4>
          <article class="trip" v-for="e in adminStats.events" :key="e.id"><strong>{{e.type}}</strong><p class="meta">{{fmt(e.createdAt)}} · {{JSON.stringify(e.payload)}}</p></article>
        </section>
      </template>
    </main>

    <dialog ref="pv"><img :src="app.previewSrc" style="max-width:88vw;max-height:80vh;border-radius:10px" /><div class="row" style="justify-content:flex-end;margin-top:8px"><button class="btn ghost" @click="$refs.pv.close()">关闭</button></div></dialog>
  </div>`
}).mount('#app');
