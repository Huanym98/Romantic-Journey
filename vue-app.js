const { createApp, reactive, computed, onMounted } = Vue;

const KEYS = {
  USERS: 'romanticJourneyUsers',
  CURRENT: 'romanticJourneyCurrentUser',
  SOCIAL: 'romanticJourneySocial',
  ADMIN: 'romanticJourneyAdminEvents',
  NOTICE: 'romanticJourneyNoticeState',
  SUPPORT: 'romanticJourneySupportCount',
  LANG: 'romanticJourneyLang',
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

const I18N = {
  'zh-CN': {
    appName: 'Romantic Journey', navHome: '首页', navMy: '我的主页', navMsg: '消息', navSearch: '查询', navAdmin: '后台',
    logout: '退出', notLogin: '未登录', profile: '个人资料', close: '关闭', saveProfile: '保存资料',
    loginTitle: '登录 / 注册（Vue版）', loginHint: '输入昵称 + 密码，自动判断登录或注册。', nickname: '昵称', password: '密码', continue: '继续',
    publishTrip: '发布行程', destination: '目的地', budgetYuan: '预算（元）', departDate: '出发日期', returnDate: '返程日期',
    tripTags: '行程标签（逗号分隔）', spotsWant: '想去景点（逗号分隔）', itinerary: '详细行程', publish: '发布',
    messagePreview: '消息预览', noMessage: '暂无消息', viewAllMessages: '查看全部消息',
    tripSquare: '行程广场', searchAll: '搜索用户/目的地',
    myTrips: '我的行程', noTripYet: '还没有发布行程', viewDetail: '查看详情',
    myDiaries: '我的日记', myBadges: '我的勋章',
    globalSearch: '全站查询', searchPlaceholder: '搜索用户/行程/日记', account: '账户', trip: '行程', diary: '日记',
    accountHome: '的主页', recentTrips: '最近行程', profileInfo: '资料', badges: '勋章', taDiary: 'Ta 的日记', noDiary: '暂无日记', backSearch: '← 返回查询',
    messageCenter: '消息中心', markRead: '全部已读', chatMsg: '聊天消息', sysMsg: '系统消息', noChatMsg: '暂无聊天消息', noSysMsg: '暂无系统消息',
    admin: '管理后台', users: '用户', trips: '行程', diaries: '日记', recentEvents: '最近事件', kpiOverview: '活跃度速览', totalUsers: '总用户数', newUsers7d: '本周新增用户', newTrips7d: '本周新增行程', newDiaries7d: '本周新增日记', activeUsers7d: '近7天活跃用户'
  },
  en: {
    appName: 'Romantic Journey', navHome: 'Home', navMy: 'My Home', navMsg: 'Messages', navSearch: 'Search', navAdmin: 'Admin', logout: 'Logout', notLogin: 'Guest',
    profile: 'Profile', close: 'Close', saveProfile: 'Save Profile', loginTitle: 'Login / Register (Vue)', loginHint: 'Enter nickname + password to login/register automatically.', nickname: 'Nickname', password: 'Password', continue: 'Continue',
    publishTrip: 'Publish Trip', destination: 'Destination', budgetYuan: 'Budget (CNY)', departDate: 'Departure', returnDate: 'Return', tripTags: 'Tags (comma-separated)', spotsWant: 'Spots (comma-separated)', itinerary: 'Itinerary', publish: 'Publish',
    messagePreview: 'Message Preview', noMessage: 'No messages', viewAllMessages: 'View all messages', tripSquare: 'Trip Square', searchAll: 'Search user/destination',
    myTrips: 'My Trips', noTripYet: 'No trips yet', viewDetail: 'View', myDiaries: 'My Diaries', myBadges: 'My Badges',
    globalSearch: 'Global Search', searchPlaceholder: 'Search users/trips/diaries', account: 'Accounts', trip: 'Trips', diary: 'Diaries',
    accountHome: "'s Home", recentTrips: 'Recent Trips', profileInfo: 'Profile', badges: 'Badges', taDiary: 'Diaries', noDiary: 'No diaries', backSearch: '← Back to Search',
    messageCenter: 'Message Center', markRead: 'Mark all read', chatMsg: 'Chats', sysMsg: 'System', noChatMsg: 'No chat messages', noSysMsg: 'No system messages',
    admin: 'Admin Panel', users: 'Users', trips: 'Trips', diaries: 'Diaries', recentEvents: 'Recent Events', kpiOverview: 'Activity Snapshot', totalUsers: 'Total Users', newUsers7d: 'New Users (7d)', newTrips7d: 'New Trips (7d)', newDiaries7d: 'New Diaries (7d)', activeUsers7d: 'Active Users (7d)'
  },
  ko: {
    appName: 'Romantic Journey', navHome: '홈', navMy: '내 홈', navMsg: '메시지', navSearch: '검색', navAdmin: '관리', logout: '로그아웃', notLogin: '게스트',
    profile: '프로필', close: '닫기', saveProfile: '저장', loginTitle: '로그인 / 회원가입 (Vue)', loginHint: '닉네임+비밀번호 입력 시 자동 로그인/가입', nickname: '닉네임', password: '비밀번호', continue: '계속',
    publishTrip: '여행 등록', destination: '목적지', budgetYuan: '예산', departDate: '출발일', returnDate: '복귀일', tripTags: '태그(쉼표)', spotsWant: '가고 싶은 곳(쉼표)', itinerary: '일정', publish: '등록',
    messagePreview: '메시지 미리보기', noMessage: '메시지 없음', viewAllMessages: '전체 메시지', tripSquare: '여행 광장', searchAll: '사용자/목적지 검색',
    myTrips: '내 여행', noTripYet: '등록한 여행이 없습니다', viewDetail: '상세보기', myDiaries: '내 다이어리', myBadges: '내 배지',
    globalSearch: '전체 검색', searchPlaceholder: '사용자/여행/다이어리 검색', account: '계정', trip: '여행', diary: '다이어리',
    accountHome: '님의 홈', recentTrips: '최근 여행', profileInfo: '프로필', badges: '배지', taDiary: '다이어리', noDiary: '다이어리 없음', backSearch: '← 검색으로',
    messageCenter: '메시지 센터', markRead: '모두 읽음', chatMsg: '채팅', sysMsg: '시스템', noChatMsg: '채팅 없음', noSysMsg: '시스템 메시지 없음',
    admin: '관리 패널', users: '사용자', trips: '여행', diaries: '다이어리', recentEvents: '최근 이벤트', kpiOverview: '활동 개요', totalUsers: '총 사용자', newUsers7d: '최근 7일 신규 사용자', newTrips7d: '최근 7일 신규 여행', newDiaries7d: '최근 7일 신규 다이어리', activeUsers7d: '최근 7일 활성 사용자'
  },
  ja: {
    appName: 'Romantic Journey', navHome: 'ホーム', navMy: 'マイページ', navMsg: 'メッセージ', navSearch: '検索', navAdmin: '管理', logout: 'ログアウト', notLogin: 'ゲスト',
    profile: 'プロフィール', close: '閉じる', saveProfile: '保存', loginTitle: 'ログイン / 登録（Vue）', loginHint: 'ニックネーム＋パスワードで自動ログイン/登録', nickname: 'ニックネーム', password: 'パスワード', continue: '続行',
    publishTrip: '旅程を投稿', destination: '目的地', budgetYuan: '予算', departDate: '出発日', returnDate: '帰着日', tripTags: 'タグ（カンマ）', spotsWant: '行きたい場所（カンマ）', itinerary: '詳細日程', publish: '投稿',
    messagePreview: 'メッセージプレビュー', noMessage: 'メッセージなし', viewAllMessages: 'すべて表示', tripSquare: '旅程広場', searchAll: 'ユーザー/目的地を検索',
    myTrips: '自分の旅程', noTripYet: 'まだ旅程がありません', viewDetail: '詳細を見る', myDiaries: '自分の日記', myBadges: '自分のバッジ',
    globalSearch: 'サイト内検索', searchPlaceholder: 'ユーザー/旅程/日記を検索', account: 'アカウント', trip: '旅程', diary: '日記',
    accountHome: 'のホーム', recentTrips: '最近の旅程', profileInfo: 'プロフィール', badges: 'バッジ', taDiary: '日記', noDiary: '日記なし', backSearch: '← 検索へ戻る',
    messageCenter: 'メッセージセンター', markRead: 'すべて既読', chatMsg: 'チャット', sysMsg: 'システム', noChatMsg: 'チャットなし', noSysMsg: 'システム通知なし',
    admin: '管理パネル', users: 'ユーザー', trips: '旅程', diaries: '日記', recentEvents: '最近のイベント', kpiOverview: 'アクティブ指標', totalUsers: '総ユーザー数', newUsers7d: '今週の新規ユーザー', newTrips7d: '今週の新規旅程', newDiaries7d: '今週の新規日記', activeUsers7d: '直近7日のアクティブユーザー'
  },
  fr: {
    appName: 'Romantic Journey', navHome: 'Accueil', navMy: 'Mon espace', navMsg: 'Messages', navSearch: 'Recherche', navAdmin: 'Admin', logout: 'Déconnexion', notLogin: 'Invité',
    profile: 'Profil', close: 'Fermer', saveProfile: 'Enregistrer', loginTitle: 'Connexion / Inscription (Vue)', loginHint: 'Entrez pseudo + mot de passe pour connexion/inscription auto.', nickname: 'Pseudo', password: 'Mot de passe', continue: 'Continuer',
    publishTrip: 'Publier un voyage', destination: 'Destination', budgetYuan: 'Budget', departDate: 'Départ', returnDate: 'Retour', tripTags: 'Tags (virgule)', spotsWant: 'Lieux souhaités (virgule)', itinerary: 'Itinéraire', publish: 'Publier',
    messagePreview: 'Aperçu des messages', noMessage: 'Aucun message', viewAllMessages: 'Voir tous les messages', tripSquare: 'Place des voyages', searchAll: 'Rechercher utilisateur/destination',
    myTrips: 'Mes voyages', noTripYet: 'Aucun voyage publié', viewDetail: 'Voir détail', myDiaries: 'Mes journaux', myBadges: 'Mes badges',
    globalSearch: 'Recherche globale', searchPlaceholder: 'Rechercher utilisateurs/voyages/journaux', account: 'Comptes', trip: 'Voyages', diary: 'Journaux',
    accountHome: ' - profil', recentTrips: 'Voyages récents', profileInfo: 'Profil', badges: 'Badges', taDiary: 'Journaux', noDiary: 'Aucun journal', backSearch: '← Retour recherche',
    messageCenter: 'Centre de messages', markRead: 'Tout marquer lu', chatMsg: 'Chats', sysMsg: 'Système', noChatMsg: 'Aucun chat', noSysMsg: 'Aucun message système',
    admin: 'Console admin', users: 'Utilisateurs', trips: 'Voyages', diaries: 'Journaux', recentEvents: 'Événements récents', kpiOverview: "Aperçu d'activité", totalUsers: 'Utilisateurs totaux', newUsers7d: 'Nouveaux utilisateurs (7j)', newTrips7d: 'Nouveaux voyages (7j)', newDiaries7d: 'Nouveaux journaux (7j)', activeUsers7d: 'Utilisateurs actifs (7j)'
  }
};

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
      bio: profile.bio || '',
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
function getNoticeState() {
  const n = read(KEYS.NOTICE, { chatReadAt: {}, systemReadAt: '' });
  return {
    chatReadAt: n.chatReadAt && typeof n.chatReadAt === 'object' ? n.chatReadAt : {},
    systemReadAt: n.systemReadAt || ''
  };
}
function setNoticeState(v) { write(KEYS.NOTICE, v); }

createApp({
  setup() {
    const app = reactive({
      route: location.hash.replace('#/', '') || 'register',
      current: localStorage.getItem(KEYS.CURRENT) || '',
      users: getUsers(),
      social: getSocial(),
      state: normalizeState({}),
      auth: { nickname: '', password: '' },
      profileForm: { birthday: '', mbti: '', zodiac: '', pace: '平衡', budgetLevel: '舒适', wakeUp: '自然醒', social: '适中', bio: '', skillsText: '' },
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
      activeMsgTab: 'chats',
      tripCommentSort: 'newest',
      diaryCommentSort: 'newest',
      lang: localStorage.getItem(KEYS.LANG) || 'zh-CN',
      stateVersion: 0,
      fromSearch: { account: false, trip: false, diary: false },
      showProfilePanel: false,
      supportCount: Number(localStorage.getItem(KEYS.SUPPORT) || 0),
      feedback: { content: '', email: '' }
    });
    const noticeState = reactive(getNoticeState());

    function t(key) {
      return I18N[app.lang]?.[key] || I18N['zh-CN']?.[key] || key;
    }
    function setLang() {
      localStorage.setItem(KEYS.LANG, app.lang);
    }
    function shortName(name) {
      return String(name || '');
    }

    function goto(route) {
      app.route = route;
      location.hash = `/${route}`;
      if (route === 'messages') markAllAsRead();
    }
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
        bio: app.state.profile.bio || '',
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
      void app.stateVersion;
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
          likes: Array.isArray(t.likes) ? t.likes : [],
          likeCount: Number(Array.isArray(t.likes) ? t.likes.length : (t.likeCount || 0)),
          user: t.user || u.nickname,
          avatar: t.avatar || s.profile.avatar || defaultAvatar,
          comments: Array.isArray(t.comments) ? t.comments.map((c) => ({
            ...c,
            likes: Array.isArray(c.likes) ? c.likes : []
          })) : [],
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
        s.mediaPosts.forEach((d) => rows.push({ ...d, user: d.user || u.nickname, likes: Array.isArray(d.likes) ? d.likes : [], comments: Array.isArray(d.comments) ? d.comments.map((c) => ({...c, likes: Array.isArray(c.likes) ? c.likes : []})) : [] }));
      });
      return rows.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    });

    const hasSearchKeyword = computed(() => app.search.trim().length > 0);
    const filteredUsers = computed(() => hasSearchKeyword.value ? app.users.filter((u) => u.nickname.toLowerCase().includes(app.search.toLowerCase())) : []);
    const filteredTrips = computed(() => hasSearchKeyword.value ? allTrips.value.filter((t) => [t.user, t.destination, t.itinerary, (t.tags || []).join(',')].join('|').toLowerCase().includes(app.search.toLowerCase())) : []);
    const filteredDiaries = computed(() => hasSearchKeyword.value ? allDiaries.value.filter((d) => [d.user, d.caption, d.location, d.checkin].join('|').toLowerCase().includes(app.search.toLowerCase())) : []);
    const homeTrips = computed(() => {
      const kw = app.search.trim().toLowerCase();
      if (!kw) return allTrips.value;
      return allTrips.value.filter((t) => [t.user, t.destination, t.itinerary, (t.tags || []).join(',')].join('|').toLowerCase().includes(kw));
    });

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
        bio: app.profileForm.bio,
        skills: list(app.profileForm.skillsText)
      };
      setState(app.current, app.state);
      app.stateVersion += 1;
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
      app.stateVersion += 1;
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
          likes: [],
          comments: []
        });
      }
      app.state.mediaPosts = app.state.mediaPosts.slice(0, 50);
      setState(app.current, app.state);
      app.stateVersion += 1;
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
      app.stateVersion += 1;
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
      target.comments.unshift({ id: uid(), user: app.current, avatar: app.state.profile.avatar || defaultAvatar, text, createdAt: now(), likes: [] });
      setState(trip.user, ownerState);
      app.stateVersion += 1;
      app.commentDraft[trip.id] = '';
      addEvent('comment-trip', { from: app.current, to: trip.user, tripId: trip.id });
    }

    function toggleCommentLike(trip, comment) {
      if (!ensureLogin() || !trip || !comment) return;
      const ownerState = getState(trip.user);
      const targetTrip = ownerState.trips.find((t) => t.id === trip.id);
      if (!targetTrip) return;
      targetTrip.comments = Array.isArray(targetTrip.comments) ? targetTrip.comments : [];
      const targetComment = targetTrip.comments.find((c) => c.id === comment.id);
      if (!targetComment) return;
      targetComment.likes = Array.isArray(targetComment.likes) ? targetComment.likes : [];
      const idx = targetComment.likes.indexOf(app.current);
      if (idx >= 0) targetComment.likes.splice(idx, 1); else targetComment.likes.push(app.current);
      setState(trip.user, ownerState);
      app.stateVersion += 1;
      addEvent('like-comment', { from: app.current, to: trip.user, tripId: trip.id, commentId: comment.id });
    }

    function commentLikers(comment) {
      if (!comment || !Array.isArray(comment.likes)) return [];
      return comment.likes.slice(0, 100);
    }
    function commentLikeOverflow(comment) {
      if (!comment || !Array.isArray(comment.likes)) return 0;
      return Math.max(0, comment.likes.length - 100);
    }
    function isCommentLikedByMe(comment) {
      return Boolean(app.current && Array.isArray(comment?.likes) && comment.likes.includes(app.current));
    }
    function sortedTripComments(trip) {
      const list = Array.isArray(trip?.comments) ? [...trip.comments] : [];
      if (app.tripCommentSort === 'hottest') {
        return list.sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0) || new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      }
      return list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    function diaryLikers(diary) {
      if (!diary || !Array.isArray(diary.likes)) return [];
      return diary.likes.slice(0, 100);
    }
    function diaryLikeOverflow(diary) {
      if (!diary || !Array.isArray(diary.likes)) return 0;
      return Math.max(0, diary.likes.length - 100);
    }
    function isDiaryLikedByMe(diary) {
      return Boolean(app.current && Array.isArray(diary?.likes) && diary.likes.includes(app.current));
    }
    function toggleDiaryLike(diary) {
      if (!ensureLogin() || !diary) return;
      const ownerState = getState(diary.user);
      ownerState.mediaPosts = Array.isArray(ownerState.mediaPosts) ? ownerState.mediaPosts : [];
      const target = ownerState.mediaPosts.find((d) => d.id === diary.id);
      if (!target) return;
      target.likes = Array.isArray(target.likes) ? target.likes : [];
      const idx = target.likes.indexOf(app.current);
      if (idx >= 0) target.likes.splice(idx, 1); else target.likes.push(app.current);
      setState(diary.user, ownerState);
      app.stateVersion += 1;
      addEvent('like-diary', { from: app.current, to: diary.user, diaryId: diary.id });
    }
    function addDiaryComment(diary) {
      if (!ensureLogin() || !diary) return;
      const text = (app.commentDraft[diary.id] || '').trim();
      if (!text) return;
      const ownerState = getState(diary.user);
      ownerState.mediaPosts = Array.isArray(ownerState.mediaPosts) ? ownerState.mediaPosts : [];
      const target = ownerState.mediaPosts.find((d) => d.id === diary.id);
      if (!target) return;
      target.comments = Array.isArray(target.comments) ? target.comments : [];
      target.comments.unshift({ id: uid(), user: app.current, avatar: app.state.profile.avatar || defaultAvatar, text, createdAt: now(), likes: [] });
      setState(diary.user, ownerState);
      app.stateVersion += 1;
      app.commentDraft[diary.id] = '';
      addEvent('comment-diary', { from: app.current, to: diary.user, diaryId: diary.id });
    }
    function toggleDiaryCommentLike(diary, comment) {
      if (!ensureLogin() || !diary || !comment) return;
      const ownerState = getState(diary.user);
      ownerState.mediaPosts = Array.isArray(ownerState.mediaPosts) ? ownerState.mediaPosts : [];
      const target = ownerState.mediaPosts.find((d) => d.id === diary.id);
      if (!target) return;
      target.comments = Array.isArray(target.comments) ? target.comments : [];
      const targetComment = target.comments.find((c) => c.id === comment.id);
      if (!targetComment) return;
      targetComment.likes = Array.isArray(targetComment.likes) ? targetComment.likes : [];
      const idx = targetComment.likes.indexOf(app.current);
      if (idx >= 0) targetComment.likes.splice(idx, 1); else targetComment.likes.push(app.current);
      setState(diary.user, ownerState);
      app.stateVersion += 1;
      addEvent('like-diary-comment', { from: app.current, to: diary.user, diaryId: diary.id, commentId: comment.id });
    }
    function sortedDiaryComments(diary) {
      const list = Array.isArray(diary?.comments) ? [...diary.comments] : [];
      if (app.diaryCommentSort === 'hottest') {
        return list.sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0) || new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      }
      return list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    function openAccount(user, source = '') { app.selectedUser = user; app.fromSearch.account = source === 'search'; goto('account'); }
    function openTrip(id, source = '') { app.selectedTripId = id; app.fromSearch.trip = source === 'search'; goto('trip'); }
    function openDiary(id, source = '') { app.selectedDiaryId = id; app.fromSearch.diary = source === 'search'; goto('diary'); }
    function openChat(user) { app.chatPeer = user; goto('chat'); }
    function getUserAvatar(user) {
      return (stateByUser.value[user]?.profile?.avatar) || defaultAvatar;
    }
    function tripLikers(trip) {
      if (!trip) return [];
      return Array.isArray(trip.likes) ? trip.likes.slice(0, 100) : [];
    }
    function tripLikeOverflow(trip) {
      if (!trip || !Array.isArray(trip.likes)) return 0;
      return Math.max(0, trip.likes.length - 100);
    }
    function isTripLikedByMe(trip) {
      return Boolean(app.current && Array.isArray(trip?.likes) && trip.likes.includes(app.current));
    }

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
      app.stateVersion += 1;
      addEvent('send-chat', { from: app.current, to: app.chatPeer });
    }
    function markAllAsRead() {
      const stamp = now();
      app.social.chats.forEach((c) => { noticeState.chatReadAt[c.id] = stamp; });
      noticeState.systemReadAt = stamp;
      setNoticeState(noticeState);
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
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const weeklyEvents = events.filter((e) => new Date(e.createdAt || 0).getTime() >= weekAgo);
      const registerUsers = new Set(weeklyEvents.filter((e) => e.type === 'register').map((e) => e.payload?.user).filter(Boolean));
      const newTrips7d = allTrips.value.filter((item) => new Date(item.createdAt || 0).getTime() >= weekAgo).length;
      const newDiaries7d = allDiaries.value.filter((item) => new Date(item.createdAt || 0).getTime() >= weekAgo).length;
      const activeUsers7d = new Set(weeklyEvents.flatMap((e) => [e.payload?.user, e.payload?.from, e.payload?.to]).filter(Boolean)).size;
      return {
        users: app.users.length,
        trips: allTrips.value.length,
        diaries: allDiaries.value.length,
        newUsers7d: registerUsers.size,
        newTrips7d,
        newDiaries7d,
        activeUsers7d,
        events: events.slice(0, 50)
      };
    });
    const chatPreviews = computed(() => {
      return (app.social.chats || [])
        .filter((c) => Array.isArray(c.members) && c.members.includes(app.current))
        .map((c) => {
          const peer = c.members.find((m) => m !== app.current) || '群聊';
          const messages = Array.isArray(c.messages) ? c.messages : [];
          const last = messages[messages.length - 1] || null;
          const readAt = new Date(noticeState.chatReadAt[c.id] || 0).getTime();
          const unread = messages.filter((m) => m.from !== app.current && new Date(m.createdAt || 0).getTime() > readAt).length;
          return { id: c.id, peer, last, unread };
        })
        .sort((a, b) => new Date(b.last?.createdAt || 0) - new Date(a.last?.createdAt || 0));
    });
    const systemMessages = computed(() => {
      const events = read(KEYS.ADMIN, []);
      return events
        .filter((e) => ['like-trip', 'comment-trip', 'toggle-follow'].includes(e.type) && e.payload?.to === app.current)
        .filter((e) => !(e.type === 'like-trip' && e.payload?.from === e.payload?.to))
        .map((e) => {
          if (e.type === 'like-trip') return { id: e.id, text: `${e.payload.from} 点赞了你的行程`, createdAt: e.createdAt };
          if (e.type === 'comment-trip') return { id: e.id, text: `${e.payload.from} 评论了你的行程`, createdAt: e.createdAt };
          return { id: e.id, text: `${e.payload.from} 关注了你`, createdAt: e.createdAt };
        });
    });
    const unreadChatCount = computed(() => chatPreviews.value.reduce((sum, c) => sum + c.unread, 0));
    const unreadSystemCount = computed(() => {
      const readAt = new Date(noticeState.systemReadAt || 0).getTime();
      return systemMessages.value.filter((m) => new Date(m.createdAt || 0).getTime() > readAt).length;
    });
    const unreadTotal = computed(() => unreadChatCount.value + unreadSystemCount.value);
    const myBadges = computed(() => calcBadges(app.state));
    function userBadges(user) {
      const s = stateByUser.value[user] || getState(user);
      return calcBadges(s);
    }
    function getFollowingCount(user) {
      if (!user) return 0;
      return (app.social.follows?.[user] || []).length;
    }
    function getFollowerCount(user) {
      if (!user) return 0;
      return Object.values(app.social.follows || {}).filter((list) => Array.isArray(list) && list.includes(user)).length;
    }
    const followingCount = computed(() => getFollowingCount(accountData.value?.user));
    const followerCount = computed(() => getFollowerCount(accountData.value?.user));
    const myAccountData = computed(() => {
      if (!app.current) return null;
      return { user: app.current, ...app.state };
    });
    const myFollowingCount = computed(() => getFollowingCount(app.current));
    const myFollowerCount = computed(() => getFollowerCount(app.current));

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
      t,
      setLang,
      shortName,
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
      toggleCommentLike,
      commentLikers,
      commentLikeOverflow,
      isCommentLikedByMe,
      sortedTripComments,
      diaryLikers,
      diaryLikeOverflow,
      isDiaryLikedByMe,
      toggleDiaryLike,
      addDiaryComment,
      toggleDiaryCommentLike,
      sortedDiaryComments,
      openAccount,
      openTrip,
      openDiary,
      openChat,
      sendChat,
      stateByUser,
      filteredUsers,
      filteredTrips,
      filteredDiaries,
      homeTrips,
      hasSearchKeyword,
      getUserAvatar,
      tripLikers,
      tripLikeOverflow,
      isTripLikedByMe,
      accountData,
      tripData,
      diaryData,
      currentChat,
      adminStats,
      myBadges,
      userBadges,
      followingCount,
      followerCount,
      myAccountData,
      myFollowingCount,
      myFollowerCount,
      chatPreviews,
      systemMessages,
      unreadChatCount,
      unreadSystemCount,
      unreadTotal,
      markAllAsRead
    };
  },
  template: `
  <div>
    <header class="top" v-if="app.route!=='register'">
      <div class="top-inner">
        <div class="brand"><img src="assets/logo.svg" alt="logo" /><span>{{t('appName')}}</span></div>
        <nav class="nav">
          <button :class="{active:app.route==='home'}" @click="goto('home')">🏠 {{t('navHome')}}</button>
          <button :class="{active:app.route==='my'}" @click="goto('my')">👤 {{t('navMy')}}</button>
          <button :class="{active:app.route==='messages'}" @click="goto('messages')">💬 {{t('navMsg')}}<span v-if="unreadTotal" class="msg-badge">{{unreadTotal}}</span></button>
          <button :class="{active:app.route==='search'}" @click="goto('search')" :aria-label="t('navSearch')">🔎 {{t('navSearch')}}</button>
          <button :class="{active:app.route==='admin'}" @click="goto('admin')">🛠️ {{t('navAdmin')}}</button>
        </nav>
        <div class="row top-userbar" style="margin-left:auto">
          <select class="lang-switch" v-model="app.lang" @change="setLang" aria-label="language"><option value="zh-CN">中文</option><option value="ko">한국어</option><option value="ja">日本語</option><option value="en">English</option><option value="fr">Français</option></select>
          <button class="avatar-btn" @click="toggleProfilePanel" :aria-expanded="String(app.showProfilePanel)">
            <img class="avatar sm" :src="app.state.profile?.avatar || '${defaultAvatar}'" alt="avatar" />
          </button>
          <span class="chip top-name" :title="app.current || t('notLogin')">{{app.current || t('notLogin')}}</span>
          <button class="btn ghost" @click="logout">{{t('logout')}}</button>
        </div>
      </div>
    </header>

    <aside v-if="app.route!=='register' && app.showProfilePanel" class="profile-panel">
      <div class="profile-panel-card">
        <div class="row" style="justify-content:space-between"><h3 style="margin:0">{{t('profile')}}</h3><button class="btn ghost" @click="closeProfilePanel">{{t('close')}}</button></div>
        <form class="grid" @submit.prevent="saveProfile" style="margin-top:8px">
          <label class="full">头像 <input type="file" accept="image/*" @change="onAvatarChange" /></label>
          <label class="full">个人简介 / 介绍
            <textarea v-model="app.profileForm.bio" rows="4" placeholder="介绍一下你自己、旅行偏好、想找什么样的搭子（可输入较长文本）"></textarea>
          </label>
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
          <button class="btn full">{{t('saveProfile')}}</button>
        </form>
      </div>
    </aside>

    <section v-if="app.route==='register'" class="auth card">
      <h2>{{t('loginTitle')}}</h2>
      <p class="hint">{{t('loginHint')}}</p>
      <div class="grid">
        <input v-model="app.auth.nickname" :placeholder="t('nickname')" />
        <input v-model="app.auth.password" type="password" :placeholder="t('password')" />
        <button class="btn full" @click="loginOrRegister">{{t('continue')}}</button>
      </div>
    </section>

    <main v-else class="wrap">
      <template v-if="app.route==='home'">
        <section class="card">
          <h3>{{t('publishTrip')}}</h3>
          <form class="grid" @submit.prevent="postTrip">
            <label>{{t('destination')}}
              <input v-model="app.tripForm.destination" placeholder="例如：首尔" required />
            </label>
            <label>{{t('budgetYuan')}}
              <input v-model="app.tripForm.budget" type="number" placeholder="例如：5000" required />
            </label>
            <label>{{t('departDate')}}
              <input v-model="app.tripForm.departDate" type="date" required />
            </label>
            <label>{{t('returnDate')}}
              <input v-model="app.tripForm.returnDate" type="date" required />
            </label>
            <label class="full">{{t('tripTags')}}
              <input v-model="app.tripForm.tags" placeholder="如：citywalk,美食,摄影" required />
            </label>
            <label class="full">{{t('spotsWant')}}
              <input v-model="app.tripForm.spots" placeholder="如：首尔塔,明洞" required />
            </label>
            <label class="full">{{t('itinerary')}}
              <textarea v-model="app.tripForm.itinerary" placeholder="例如：D1 上午明洞，D2 弘大 citywalk" required></textarea>
            </label>
            <button class="btn full">{{t('publish')}}</button>
          </form>
        </section>
        <aside class="card">
          <h3>{{t('messagePreview')}}</h3>
          <p class="hint" v-if="!chatPreviews.length && !systemMessages.length">{{t('noMessage')}}</p>
          <div class="message-preview-list" v-if="chatPreviews.length || systemMessages.length">
            <p class="hint" v-for="c in chatPreviews.slice(0,3)" :key="c.id">💬 {{c.peer}}：{{c.last?.text || '暂无内容'}}<span v-if="c.unread">（未读{{c.unread}}）</span></p>
            <p class="hint" v-for="m in systemMessages.slice(0,3)" :key="m.id">🔔 {{m.text}}</p>
          </div>
          <button class="btn ghost" @click="goto('messages')">{{t('viewAllMessages')}}</button>
        </aside>

        <section class="card full">
          <div class="row"><h3 style="margin:0">{{t('tripSquare')}}</h3><input v-model="app.search" :placeholder="t('searchAll')" style="max-width:280px" /></div>
          <article class="trip trip-clickable" v-for="trip in homeTrips" :key="trip.id" @click="openTrip(trip.id)">
            <div class="row" style="justify-content:space-between">
              <div class="row">
                <img class="avatar" :src="trip.avatar || '${defaultAvatar}'" alt="avatar" @click.stop="openAccount(trip.user)" />
                <strong>{{trip.user}} · {{trip.destination}}</strong>
                <button v-if="trip.user !== app.current" class="btn ghost" @click.stop="toggleRelation('follow', trip.user)">{{isFollowing(trip.user)?'取消关注':'关注'}}</button>
              </div>
              <span class="meta">{{fmt(trip.createdAt)}}</span>
            </div>
            <p class="hint">预算 ¥{{trip.budget}} ｜ 标签 {{(trip.tags||[]).join(' / ')}}</p>
            <p class="hint" v-if="trip.ownerBadges?.length">勋章：{{trip.ownerBadges.join(' ｜ ')}}</p>
            <p class="hint" v-if="trip.ownerSkills?.length">技能：{{trip.ownerSkills.join('、')}}</p>
            <p>{{trip.itinerary}}</p>
            <div class="row">
              <button class="btn" :class="{liked:isTripLikedByMe(trip)}" @click.stop="likeTrip(trip)">👍 {{trip.likeCount||0}}</button>
              <button class="btn ghost" @click.stop="openChat(trip.user)" aria-label="会话">💬</button>
            </div>
            <div class="trip-likers" v-if="tripLikers(trip).length">
              <img v-for="name in tripLikers(trip)" :key="trip.id + '-' + name" class="avatar sm" :src="getUserAvatar(name)" :title="name" :alt="name" />
              <span class="hint" v-if="tripLikeOverflow(trip)">+{{tripLikeOverflow(trip)}}</span>
            </div>
            <div class="row" style="margin-top:6px">
              <input v-model="app.commentDraft[trip.id]" placeholder="评论一下" style="flex:1" @click.stop/>
              <button class="btn ghost" @click.stop="addComment(trip)">发送</button>
            </div>
          </article>
        </section>

        <section class="card full">
          <h3>支持与反馈</h3>
          <p class="hint">累计收到点赞支持：<strong>{{app.supportCount}}</strong></p>
          <div class="row" style="margin-bottom:8px"><button class="btn" @click="supportLike">👍 点赞支持</button></div>
          <form class="grid" @submit.prevent="submitFeedback">
            <textarea class="full" v-model="app.feedback.content" maxlength="100" placeholder="写下你的意见（100字以内）" required></textarea>
            <input class="full" type="email" v-model="app.feedback.email" placeholder="联系邮箱" required />
            <button class="btn full">提交反馈</button>
          </form>
        </section>

      </template>

      <template v-else-if="app.route==='my'">
        <section class="card full">
          <h3>发布打卡日记（九宫格）</h3>
          <form class="grid" @submit.prevent="postDiary">
            <input v-model="app.mediaForm.location" placeholder="地点" required />
            <input v-model="app.mediaForm.checkin" placeholder="打卡文本（可选）" />
            <input class="full" v-model="app.mediaForm.caption" placeholder="标题" required />
            <input class="full" id="diaryFiles" type="file" accept="image/*" multiple required />
            <button class="btn full">发布日记</button>
          </form>
        </section>
        <section class="card full" v-if="myAccountData">
          <div class="row">
            <img class="avatar lg" :src="myAccountData.profile?.avatar || '${defaultAvatar}'" alt="avatar" />
            <div>
              <h2 style="margin:.1rem 0">{{myAccountData.user}}{{t('accountHome')}}</h2>
              <p class="hint">行程 {{(myAccountData.trips||[]).length}} 条 ｜ 日记 {{(myAccountData.mediaPosts||[]).length}} 条</p>
              <p class="hint">已关注 {{myFollowingCount}} ｜ 粉丝 {{myFollowerCount}}</p>
            </div>
          </div>
        </section>
        <section class="card full">
          <h3>{{t('myTrips')}}</h3>
          <p class="hint" v-if="!(app.state.trips||[]).length">{{t('noTripYet')}}</p>
          <article class="trip" v-for="tripItem in (app.state.trips||[])" :key="tripItem.id">
            <div class="row" style="justify-content:space-between"><strong>{{tripItem.destination}}</strong><span class="meta">{{tripItem.departDate}} - {{tripItem.returnDate}}</span></div>
            <p class="hint">预算 ¥{{tripItem.budget}} ｜ 标签 {{(tripItem.tags||[]).join(' / ')}}</p>
            <p>{{tripItem.itinerary}}</p>
            <div class="row" style="margin-top:6px"><button class="btn ghost" @click="openTrip(tripItem.id)">{{t('viewDetail')}}</button></div>
          </article>
        </section>
        <section class="card">
          <h3>{{t('myDiaries')}}</h3>
          <article class="trip" v-for="d in app.state.mediaPosts" :key="d.id">
            <div class="row" style="justify-content:space-between"><strong>{{d.caption}}</strong><span class="meta">{{d.location}} · {{fmt(d.createdAt)}}</span></div>
            <img :src="d.cover" style="width:100%;max-height:200px;object-fit:cover;border-radius:8px;border:1px solid var(--line);margin-top:6px" />
            <div class="row" style="margin-top:6px"><button class="btn ghost" @click="openDiary(d.id)">{{t('viewDetail')}}</button></div>
          </article>
        </section>
        <section class="card my-badge-side">
          <h3>{{t('myBadges')}}</h3>
          <div class="row"><span class="chip" v-for="(badge, i) in myBadges" :key="i">{{badge}}</span></div>
        </section>
      </template>

      <template v-else-if="app.route==='search'">
        <section class="card full">
          <h3>{{t('globalSearch')}}</h3>
          <input v-model="app.search" :placeholder="t('searchPlaceholder')" />
          <template v-if="hasSearchKeyword">
            <h4>{{t('account')}}</h4>
            <div class="search-user-list">
              <article class="trip trip-clickable search-user-item" v-for="u in filteredUsers" :key="u.nickname" @click="openAccount(u.nickname, 'search')">
                <img class="avatar" :src="getUserAvatar(u.nickname)" :alt="u.nickname" />
                <div>
                  <strong>{{u.nickname}}</strong>
                  <p class="hint">勋章：{{userBadges(u.nickname).join(' ｜ ')}}</p>
                  <p class="hint">行程 {{(stateByUser[u.nickname]?.trips||[]).length}} 条 ｜ 日记 {{(stateByUser[u.nickname]?.mediaPosts||[]).length}} 条</p>
                </div>
              </article>
            </div>
            <h4>{{t('trip')}}</h4>
            <article class="trip trip-clickable" v-for="t in filteredTrips.slice(0,8)" :key="t.id" @click="openTrip(t.id, 'search')"><strong>{{t.user}} · {{t.destination}}</strong></article>
            <h4>{{t('diary')}}</h4>
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
              <h2 style="margin:.1rem 0">{{accountData.user}}{{t('accountHome')}}</h2>
              <p class="hint">行程 {{(accountData.trips||[]).length}} 条 ｜ 日记 {{(accountData.mediaPosts||[]).length}} 条</p>
              <p class="hint">已关注 {{followingCount}} ｜ 粉丝 {{followerCount}}</p>
            </div>
          </div>
          <div class="grid" style="margin-top:8px">
            <div class="card">
              <h4>{{t('profileInfo')}}</h4>
              <p class="hint">生日 {{accountData.profile?.birthday||'-'}} ｜ MBTI {{accountData.profile?.mbti||'-'}}</p>
              <p class="hint">星座 {{accountData.profile?.zodiac||'-'}} ｜ 节奏 {{accountData.profile?.pace||'-'}}</p>
              <p class="hint">预算 {{accountData.profile?.budgetLevel||'-'}} ｜ 作息 {{accountData.profile?.wakeUp||'-'}}</p>
              <p class="hint">社交 {{accountData.profile?.social||'-'}}</p>
              <p class="hint">简介 {{accountData.profile?.bio||'-'}}</p>
              <p class="hint">技能 {{Array.isArray(accountData.profile?.skills)?accountData.profile.skills.join('、'):accountData.profile?.skills}}</p>
              <p class="hint">勋章 {{userBadges(accountData.user).join(' ｜ ')}}</p>
            </div>
            <div class="card"><h4>{{t('recentTrips')}}</h4><div class="trip" v-for="t in (accountData.trips||[])" :key="t.id" @click="openTrip(t.id)" style="cursor:pointer">{{t.destination}} · {{t.departDate}}-{{t.returnDate}}</div></div>
          </div>
          <section class="card" style="margin-top:10px">
            <h4>{{t('taDiary')}}</h4>
            <p class="hint" v-if="!(accountData.mediaPosts||[]).length">{{t('noDiary')}}</p>
            <article class="trip trip-clickable" v-for="d in (accountData.mediaPosts||[])" :key="d.id" @click="openDiary(d.id)">
              <div class="row" style="justify-content:space-between"><strong>{{d.caption}}</strong><span class="meta">{{d.location}} · {{fmt(d.createdAt)}}</span></div>
              <img v-if="d.cover" :src="d.cover" style="width:100%;max-height:200px;object-fit:cover;border-radius:8px;border:1px solid var(--line);margin-top:6px" />
            </article>
          </section>
          <button v-if="app.fromSearch.account" class="btn ghost" @click="goto('search')">{{t('backSearch')}}</button>
        </section>
      </template>

      <template v-else-if="app.route==='trip'">
        <section class="card full" v-if="tripData">
          <h2>{{tripData.destination}}</h2>
          <p class="hint">发布者：{{tripData.user}} ｜ {{fmt(tripData.createdAt)}} ｜ 点赞 {{tripData.likeCount||0}}</p>
          <p>{{tripData.itinerary}}</p>
          <p class="hint">景点：{{(tripData.spots||[]).join('、')}}</p>
          <div class="row">
            <button class="btn" :class="{liked:isTripLikedByMe(tripData)}" @click="likeTrip(tripData)">👍 {{tripData.likeCount||0}}</button>
          </div>
          <div class="trip-likers" v-if="tripLikers(tripData).length">
            <img v-for="name in tripLikers(tripData)" :key="tripData.id + '-' + name" class="avatar sm" :src="getUserAvatar(name)" :title="name" :alt="name" />
            <span class="hint" v-if="tripLikeOverflow(tripData)">+{{tripLikeOverflow(tripData)}}</span>
          </div>
          <section class="trip-comments-block">
            <div class="row" style="justify-content:space-between;align-items:center">
              <h4 style="margin:.4rem 0">评论</h4>
              <select v-model="app.tripCommentSort" class="comment-sort-select">
                <option value="newest">最新</option>
                <option value="hottest">最热</option>
              </select>
            </div>
            <div class="row" style="margin:.35rem 0 .6rem">
              <input v-model="app.commentDraft[tripData.id]" placeholder="写评论，按发送发布" style="flex:1" />
              <button class="btn" @click="addComment(tripData)">发送</button>
            </div>
            <p class="hint" v-if="!sortedTripComments(tripData).length">暂无评论</p>
            <article class="trip" v-for="comment in sortedTripComments(tripData)" :key="comment.id">
              <div class="row" style="justify-content:space-between">
                <div class="row">
                  <img class="avatar sm" :src="getUserAvatar(comment.user)" :alt="comment.user" />
                  <strong>{{comment.user}}</strong>
                </div>
                <small class="meta">{{fmt(comment.createdAt)}}</small>
              </div>
              <p style="margin:.35rem 0">{{comment.text}}</p>
              <div class="row">
                <button class="btn ghost" :class="{liked:isCommentLikedByMe(comment)}" @click="toggleCommentLike(tripData, comment)">👍 {{comment.likes?.length || 0}}</button>
              </div>
              <div class="trip-likers" v-if="commentLikers(comment).length">
                <img v-for="name in commentLikers(comment)" :key="comment.id + '-' + name" class="avatar sm" :src="getUserAvatar(name)" :title="name" :alt="name" />
                <span class="hint" v-if="commentLikeOverflow(comment)">+{{commentLikeOverflow(comment)}}</span>
              </div>
            </article>
          </section>
          <button v-if="app.fromSearch.trip" class="btn ghost" @click="goto('search')">{{t('backSearch')}}</button>
        </section>
      </template>

      <template v-else-if="app.route==='diary'">
        <section class="card full" v-if="diaryData">
          <h2>{{diaryData.caption}}</h2>
          <p class="hint">{{diaryData.user}} · {{diaryData.location}} · {{diaryData.checkin}}</p>
          <section class="diary-grid">
            <img v-for="(img,i) in diaryData.images" :key="i" :src="img" @click="app.previewSrc=img; $refs.pv.showModal()" />
          </section>
          <div class="row" style="margin-top:8px">
            <button class="btn" :class="{liked:isDiaryLikedByMe(diaryData)}" @click="toggleDiaryLike(diaryData)">👍 {{diaryData.likes?.length || 0}}</button>
          </div>
          <div class="trip-likers" v-if="diaryLikers(diaryData).length">
            <img v-for="name in diaryLikers(diaryData)" :key="diaryData.id + '-' + name" class="avatar sm" :src="getUserAvatar(name)" :title="name" :alt="name" />
            <span class="hint" v-if="diaryLikeOverflow(diaryData)">+{{diaryLikeOverflow(diaryData)}}</span>
          </div>
          <section class="trip-comments-block">
            <div class="row" style="justify-content:space-between;align-items:center">
              <h4 style="margin:.4rem 0">评论</h4>
              <select v-model="app.diaryCommentSort" class="comment-sort-select">
                <option value="newest">最新</option>
                <option value="hottest">最热</option>
              </select>
            </div>
            <div class="row" style="margin:.35rem 0 .6rem">
              <input v-model="app.commentDraft[diaryData.id]" placeholder="写评论，按发送发布" style="flex:1" />
              <button class="btn" @click="addDiaryComment(diaryData)">发送</button>
            </div>
            <p class="hint" v-if="!sortedDiaryComments(diaryData).length">暂无评论</p>
            <article class="trip" v-for="comment in sortedDiaryComments(diaryData)" :key="comment.id">
              <div class="row" style="justify-content:space-between">
                <div class="row">
                  <img class="avatar sm" :src="getUserAvatar(comment.user)" :alt="comment.user" />
                  <strong>{{comment.user}}</strong>
                </div>
                <small class="meta">{{fmt(comment.createdAt)}}</small>
              </div>
              <p style="margin:.35rem 0">{{comment.text}}</p>
              <div class="row">
                <button class="btn ghost" :class="{liked:isCommentLikedByMe(comment)}" @click="toggleDiaryCommentLike(diaryData, comment)">👍 {{comment.likes?.length || 0}}</button>
              </div>
              <div class="trip-likers" v-if="commentLikers(comment).length">
                <img v-for="name in commentLikers(comment)" :key="comment.id + '-' + name" class="avatar sm" :src="getUserAvatar(name)" :title="name" :alt="name" />
                <span class="hint" v-if="commentLikeOverflow(comment)">+{{commentLikeOverflow(comment)}}</span>
              </div>
            </article>
          </section>
          <button v-if="app.fromSearch.diary" class="btn ghost" @click="goto('search')" style="margin-top:8px">{{t('backSearch')}}</button>
        </section>
      </template>

      <template v-else-if="app.route==='chat'">
        <section class="card full chat-page">
          <h2>与 {{app.chatPeer}} 聊天</h2>
          <div class="trip chat-history">
            <p v-if="!currentChat.messages.length" class="hint">还没有消息</p>
            <div v-for="m in currentChat.messages" :key="m.id" class="msg-row" :class="{me: m.from===app.current}">
              <div class="msg-bubble">
                <div class="msg-head"><img class="avatar sm" :src="getUserAvatar(m.from)" alt="avatar" /><strong>{{m.from}}</strong></div>
                <p style="margin:.2rem 0">{{m.text}}</p><small class="meta">{{fmt(m.createdAt)}}</small>
              </div>
            </div>
          </div>
          <div class="row chat-input-row"><input v-model="app.chatDraft" placeholder="输入消息" style="flex:1"/><button class="btn" @click="sendChat">发送</button><button class="btn ghost" @click="goto('home')">返回首页</button></div>
        </section>
      </template>

      <template v-else-if="app.route==='messages'">
        <section class="card full">
          <div class="row" style="justify-content:space-between"><h2>{{t('messageCenter')}}</h2><button class="btn ghost" @click="markAllAsRead">{{t('markRead')}}</button></div>
          <div class="row" style="margin-bottom:.4rem">
            <button class="btn ghost" @click="app.activeMsgTab='chats'">{{t('chatMsg')}}<span v-if="unreadChatCount" class="msg-badge">{{unreadChatCount}}</span></button>
            <button class="btn ghost" @click="app.activeMsgTab='system'">{{t('sysMsg')}}<span v-if="unreadSystemCount" class="msg-badge">{{unreadSystemCount}}</span></button>
          </div>
          <div v-if="app.activeMsgTab==='chats'">
            <article class="trip trip-clickable" v-for="c in chatPreviews" :key="c.id" @click="openChat(c.peer)">
              <div class="row" style="justify-content:space-between"><strong>{{c.peer}}</strong><span class="meta">{{fmt(c.last?.createdAt)}}</span></div>
              <p class="hint">{{c.last?.text || '暂无内容'}} <span v-if="c.unread">· 未读 {{c.unread}}</span></p>
            </article>
            <p class="hint" v-if="!chatPreviews.length">{{t('noChatMsg')}}</p>
          </div>
          <div v-else>
            <article class="trip" v-for="m in systemMessages" :key="m.id"><strong>系统提醒</strong><p>{{m.text}}</p><p class="meta">{{fmt(m.createdAt)}}</p></article>
            <p class="hint" v-if="!systemMessages.length">{{t('noSysMsg')}}</p>
          </div>
        </section>
      </template>

      <template v-else-if="app.route==='admin'">
        <section class="card full">
          <h2>{{t('admin')}}</h2>
          <div class="row">
            <span class="chip">{{t('users')}} {{adminStats.users}}</span>
            <span class="chip">{{t('trips')}} {{adminStats.trips}}</span>
            <span class="chip">{{t('diaries')}} {{adminStats.diaries}}</span>
          </div>
          <h4>{{t('kpiOverview')}}</h4>
          <div class="admin-kpi-grid">
            <article class="trip"><strong>{{t('totalUsers')}}</strong><p class="meta">{{adminStats.users}}</p></article>
            <article class="trip"><strong>{{t('newUsers7d')}}</strong><p class="meta">{{adminStats.newUsers7d}}</p></article>
            <article class="trip"><strong>{{t('newTrips7d')}}</strong><p class="meta">{{adminStats.newTrips7d}}</p></article>
            <article class="trip"><strong>{{t('newDiaries7d')}}</strong><p class="meta">{{adminStats.newDiaries7d}}</p></article>
            <article class="trip"><strong>{{t('activeUsers7d')}}</strong><p class="meta">{{adminStats.activeUsers7d}}</p></article>
          </div>
          <h4>{{t('recentEvents')}}</h4>
          <article class="trip" v-for="e in adminStats.events" :key="e.id"><strong>{{e.type}}</strong><p class="meta">{{fmt(e.createdAt)}} · {{JSON.stringify(e.payload)}}</p></article>
        </section>
      </template>
    </main>

    <dialog ref="pv"><img :src="app.previewSrc" style="max-width:88vw;max-height:80vh;border-radius:10px" /><div class="row" style="justify-content:flex-end;margin-top:8px"><button class="btn ghost" @click="$refs.pv.close()">{{t('close')}}</button></div></dialog>
  </div>`
}).mount('#app');
