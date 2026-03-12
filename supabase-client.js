(function initRomanticJourneySupabase(global) {
  const URL_KEY = 'romanticJourneySupabaseUrl';
  const ANON_KEY = 'romanticJourneySupabaseAnonKey';
  const STORAGE_BUCKET_KEY = 'romanticJourneySupabaseBucket';
  const DEFAULT_STORAGE_BUCKET = 'Trip_Photos';
  const userIdCache = new Map();
  let supabaseClientInstance = null;
  let initLogged = false;

  function getSupabaseFactory() {
    if (typeof global.supabase?.createClient === 'function') return global.supabase.createClient;
    if (typeof global.supabasejs?.createClient === 'function') return global.supabasejs.createClient;
    return null;
  }

  function logSdkInit(url, anonKey, hasFactory, created) {
    if (initLogged) return;
    initLogged = true;
    console.log('[supabase-init] sdkLoaded', Boolean(hasFactory));
    console.log('[supabase-init] clientCreated', Boolean(created));
    console.log('[supabase-init] url', url || null);
    console.log('[supabase-init] hasAnonKey', Boolean(anonKey));
  }

  function getSupabaseClient() {
    if (supabaseClientInstance) return supabaseClientInstance;
    const { url, anonKey } = normalizeConfig();
    const createClient = getSupabaseFactory();
    if (!url || !anonKey || !createClient) {
      logSdkInit(url, anonKey, createClient, false);
      return null;
    }
    supabaseClientInstance = createClient(url, anonKey);
    logSdkInit(url, anonKey, createClient, true);
    return supabaseClientInstance;
  }

  function normalizeConfig() {
    const fromWindow = global.SUPABASE_CONFIG || {};
    const url = String(fromWindow.url || localStorage.getItem(URL_KEY) || '').trim();
    const anonKey = String(fromWindow.anonKey || localStorage.getItem(ANON_KEY) || '').trim();
    const storageBucket = String(fromWindow.storageBucket || localStorage.getItem(STORAGE_BUCKET_KEY) || DEFAULT_STORAGE_BUCKET).trim();
    return { url, anonKey, storageBucket };
  }

  function isEnabled() {
    const { url, anonKey } = normalizeConfig();
    return Boolean(url && anonKey);
  }

  function setConfig(url, anonKey, storageBucket) {
    localStorage.setItem(URL_KEY, String(url || '').trim());
    localStorage.setItem(ANON_KEY, String(anonKey || '').trim());
    if (typeof storageBucket !== 'undefined') localStorage.setItem(STORAGE_BUCKET_KEY, String(storageBucket || '').trim());
  }

  function extFromFileName(name, fallback = 'jpg') {
    const value = String(name || '');
    const idx = value.lastIndexOf('.');
    if (idx < 0) return fallback;
    return value.slice(idx + 1).toLowerCase().replace(/[^a-z0-9]/g, '') || fallback;
  }

  function safePathPart(value) {
    return String(value || '').trim().replace(/[^a-zA-Z0-9_-]/g, '_') || 'unknown';
  }

  function buildAuthEmailFromNickname(nickname) {
    return `${safePathPart(nickname).toLowerCase()}@romanticjourney.app`;
  }

  async function signUpWithLocalAccount(nickname, password) {
    if (!nickname || !password) throw new Error('nickname and password are required');
    const client = getSupabaseClient();
    if (!client?.auth?.signUp) throw new Error('Supabase SDK 未加载，无法注册');
    const email = buildAuthEmailFromNickname(nickname);
    console.log('[supabase-auth] signUp start', { nickname, email });
    const result = await client.auth.signUp({ email, password });
    console.log('[supabase-auth] signUp result', {
      data: {
        userId: result?.data?.user?.id || null,
        hasSession: Boolean(result?.data?.session)
      },
      error: result?.error || null
    });
    if (result?.error) throw result.error;
    return result?.data || null;
  }

  async function signInWithLocalAccount(nickname, password) {
    if (!nickname || !password) throw new Error('nickname and password are required');
    const client = getSupabaseClient();
    if (!client?.auth?.signInWithPassword) throw new Error('Supabase SDK 未加载，无法登录');
    const email = buildAuthEmailFromNickname(nickname);
    console.log('[supabase-auth] signIn start', { nickname, email });
    const result = await client.auth.signInWithPassword({ email, password });
    console.log('[supabase-auth] signIn result', {
      data: {
        userId: result?.data?.user?.id || null,
        hasSession: Boolean(result?.data?.session),
        accessToken: Boolean(result?.data?.session?.access_token),
        refreshToken: Boolean(result?.data?.session?.refresh_token)
      },
      error: result?.error || null
    });
    if (result?.error) throw result.error;
    if (!result?.data?.session?.access_token || !result?.data?.session?.refresh_token) {
      throw new Error('Supabase 登录成功但未返回 session（可能开启了邮箱确认）');
    }
    return result.data.session;
  }

  async function getSupabaseAuthSession() {
    const client = getSupabaseClient();
    if (!client?.auth?.getSession) return null;
    const sessionResult = await client.auth.getSession();
    console.log('[supabase-auth] getSession', sessionResult);
    return sessionResult?.data?.session || null;
  }

  async function restoreSupabaseSession() {
    return getSupabaseAuthSession();
  }

  async function signOutSupabaseSession() {
    const client = getSupabaseClient();
    if (!client?.auth?.signOut) return;
    const result = await client.auth.signOut();
    if (result?.error) {
      console.error('[supabase-auth] signOut failed', result.error);
      throw result.error;
    }
  }

  async function uploadDiaryImage(file, options = {}) {
    if (!file) throw new Error('file is required');
    const { url, anonKey, storageBucket } = normalizeConfig();
    if (!url || !anonKey) throw new Error('Supabase config missing');

    await restoreSupabaseSession();
    const client = getSupabaseClient();
    if (!client?.auth?.getUser || !client?.auth?.getSession) {
      throw new Error('Supabase SDK 未加载，无法校验登录态');
    }

    const userResult = await client.auth.getUser();
    const sessionResult = await client.auth.getSession();
    console.log('[supabase-upload-debug] auth.getUser', userResult);
    console.log('[supabase-upload-debug] auth.getSession', sessionResult);

    const user = userResult?.data?.user || null;
    const session = sessionResult?.data?.session || null;
    if (!session?.access_token || !user?.id) {
      throw new Error('当前未登录 Supabase，无法上传图片');
    }

    const resolvedUserId = String(user.id || '').trim();
    if (!resolvedUserId) {
      throw new Error('当前未登录 Supabase，无法上传图片');
    }

    if (storageBucket !== 'Trip_Photos') {
      console.warn('[supabase-upload-debug] bucket mismatch, expected "Trip_Photos"', { storageBucket });
    }

    const objectPath = `${resolvedUserId}/${Date.now()}-${file.name}`;
    console.log('[supabase-upload-debug] bucket', storageBucket);
    console.log('[supabase-upload-debug] filePath', objectPath);

    const encodedPath = objectPath.split('/').map((s) => encodeURIComponent(s)).join('/');
    const uploadUrl = `${url}/storage/v1/object/${encodeURIComponent(storageBucket)}/${encodedPath}`;
    console.log('[supabase-upload-debug] uploadUrl', uploadUrl);
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${session.access_token}`,
        'x-upsert': 'false',
        'Content-Type': file.type || 'application/octet-stream'
      },
      body: file
    });
    let uploadData = null;
    let uploadError = null;
    if (!response.ok) {
      const text = await response.text();
      uploadError = `Supabase storage ${response.status}: ${text}`;
      console.log('[supabase-upload-debug] storage upload result', { data: uploadData, error: uploadError });
      throw new Error(uploadError);
    }
    uploadData = await response.json().catch(() => null);
    console.log('[supabase-upload-debug] storage upload result', { data: uploadData, error: uploadError });
    const publicUrl = `${url}/storage/v1/object/public/${encodeURIComponent(storageBucket)}/${encodedPath}`;
    return {
      bucket: storageBucket,
      path: objectPath,
      url: publicUrl,
      size: Number(file.size || 0)
    };
  }

  async function request(path, options = {}) {
    const { url, anonKey } = normalizeConfig();
    if (!url || !anonKey) throw new Error('Supabase config missing');
    const response = await fetch(`${url}/rest/v1/${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        Prefer: 'return=representation',
        ...(options.headers || {})
      }
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Supabase ${response.status}: ${text}`);
    }
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  async function findUserByNickname(nickname) {
    if (!nickname) return null;
    const encoded = encodeURIComponent(`eq.${nickname}`);
    const rows = await request(`app_users?nickname=${encoded}&select=id,nickname,password,first_login,created_at&limit=1`, {
      method: 'GET'
    });
    const found = Array.isArray(rows) && rows.length ? rows[0] : null;
    if (found?.id) userIdCache.set(nickname, found.id);
    return found;
  }

  async function createUserWithProfile(payload) {
    const body = {
      nickname: payload.nickname,
      password: payload.password,
      first_login: true
    };
    const created = await request('app_users', { method: 'POST', body: JSON.stringify(body) });
    const user = Array.isArray(created) ? created[0] : null;
    if (!user?.id) throw new Error('Supabase user insert failed');

    await request('user_profiles', {
      method: 'POST',
      body: JSON.stringify({ user_id: user.id }),
      headers: { Prefer: 'return=minimal' }
    });

    userIdCache.set(payload.nickname, user.id);
    return user;
  }

  async function ensureUser(nickname, password = '123456') {
    if (!nickname) return null;
    if (userIdCache.has(nickname)) return userIdCache.get(nickname);
    const found = await findUserByNickname(nickname);
    if (found?.id) return found.id;
    const created = await createUserWithProfile({ nickname, password });
    return created.id;
  }

  async function syncUserProfile(nickname, profile = {}) {
    const userId = await ensureUser(nickname);
    if (!userId) return;
    const payload = {
      avatar: profile.avatar || null,
      birthday: profile.birthday || null,
      mbti: profile.mbti || null,
      zodiac: profile.zodiac || null,
      pace: profile.pace || null,
      budget_level: profile.budgetLevel || null,
      wake_up: profile.wakeUp || null,
      social: profile.social || null,
      skills: Array.isArray(profile.skills) ? profile.skills : []
    };
    await request(`user_profiles?user_id=eq.${encodeURIComponent(userId)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
      headers: { Prefer: 'return=minimal' }
    });
  }

  async function syncTrip(trip) {
    const userId = await ensureUser(trip.user);
    if (!userId || !trip?.id) return;
    const payload = {
      id: trip.id,
      user_id: userId,
      destination: trip.destination || '未知目的地',
      depart_date: trip.departDate || null,
      return_date: trip.returnDate || null,
      budget: Number(trip.budget || 0),
      tags: Array.isArray(trip.tags) ? trip.tags : [],
      spots: Array.isArray(trip.spots) ? trip.spots : [],
      itinerary: trip.itinerary || '',
      pace: trip.pace || null,
      wake_up: trip.wakeUp || null,
      social: trip.social || null,
      countries: Array.isArray(trip.countries) ? trip.countries : [],
      badges: Array.isArray(trip.badges) ? trip.badges : [],
      review: trip.review || { score: 5.0, count: 1, highlights: [] },
      trust: trip.trust || { score: 4.5, completion: 90, verified: false },
      like_count: Number(trip.likeCount || 0),
      created_at: trip.createdAt || new Date().toISOString()
    };
    await request('trips', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }
    });
  }

  async function syncTripLike(tripId, nickname, liked) {
    if (!tripId || !nickname) return;
    const userId = await ensureUser(nickname);
    if (!userId) return;
    const filter = `trip_id=eq.${encodeURIComponent(tripId)}&user_id=eq.${encodeURIComponent(userId)}`;
    if (liked) {
      await request('trip_likes', {
        method: 'POST',
        body: JSON.stringify({ trip_id: tripId, user_id: userId }),
        headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }
      });
    } else {
      await request(`trip_likes?${filter}`, {
        method: 'DELETE',
        headers: { Prefer: 'return=minimal' }
      });
    }
  }

  async function syncTripComment(tripId, comment) {
    if (!tripId || !comment?.id) return;
    const userId = await ensureUser(comment.user);
    if (!userId) return;
    await request('trip_comments', {
      method: 'POST',
      body: JSON.stringify({
        id: comment.id,
        trip_id: tripId,
        user_id: userId,
        reply_to_nickname: comment.replyTo || null,
        content: comment.text || '',
        pinned: Boolean(comment.pinned),
        created_at: comment.createdAt || new Date().toISOString()
      }),
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }
    });
  }

  async function syncMediaPost(post) {
    if (!post?.id) return;
    const userId = await ensureUser(post.user);
    if (!userId) return;
    await request('media_posts', {
      method: 'POST',
      body: JSON.stringify({
        id: post.id,
        user_id: userId,
        media_type: post.type || '图片',
        location: post.location || null,
        cover: post.cover || null,
        caption: post.caption || null,
        checkin: post.checkin || null,
        created_at: post.createdAt || new Date().toISOString()
      }),
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }
    });
  }

  async function syncMediaLike(mediaPostId, nickname, liked) {
    if (!mediaPostId || !nickname) return;
    const userId = await ensureUser(nickname);
    if (!userId) return;
    const filter = `media_post_id=eq.${encodeURIComponent(mediaPostId)}&user_id=eq.${encodeURIComponent(userId)}`;
    if (liked) {
      await request('media_likes', {
        method: 'POST',
        body: JSON.stringify({ media_post_id: mediaPostId, user_id: userId }),
        headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }
      });
    } else {
      await request(`media_likes?${filter}`, {
        method: 'DELETE',
        headers: { Prefer: 'return=minimal' }
      });
    }
  }

  async function syncMediaComment(mediaPostId, comment) {
    if (!mediaPostId || !comment?.id) return;
    const userId = await ensureUser(comment.user);
    if (!userId) return;
    await request('media_comments', {
      method: 'POST',
      body: JSON.stringify({
        id: comment.id,
        media_post_id: mediaPostId,
        user_id: userId,
        reply_to_nickname: comment.replyTo || null,
        content: comment.text || '',
        pinned: Boolean(comment.pinned),
        created_at: comment.createdAt || new Date().toISOString()
      }),
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }
    });
  }

  async function deleteTrip(tripId) {
    if (!tripId) return;
    await request(`trips?id=eq.${encodeURIComponent(tripId)}`, {
      method: 'DELETE',
      headers: { Prefer: 'return=minimal' }
    });
  }

  async function deleteMediaPost(mediaPostId) {
    if (!mediaPostId) return;
    await request(`media_posts?id=eq.${encodeURIComponent(mediaPostId)}`, {
      method: 'DELETE',
      headers: { Prefer: 'return=minimal' }
    });
  }

  async function syncChat(chat, creatorNickname) {
    if (!chat?.id) return;
    const creatorId = await ensureUser(creatorNickname || chat.members?.[0]);
    await request('chats', {
      method: 'POST',
      body: JSON.stringify({
        id: chat.id,
        chat_type: chat.type === 'group' ? 'group' : 'dm',
        name: chat.name || null,
        created_by: creatorId || null
      }),
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }
    });

    const members = Array.isArray(chat.members) ? chat.members : [];
    for (const nickname of members) {
      const userId = await ensureUser(nickname);
      if (!userId) continue;
      await request('chat_members', {
        method: 'POST',
        body: JSON.stringify({ chat_id: chat.id, user_id: userId }),
        headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }
      });
    }

    const messages = Array.isArray(chat.messages) ? chat.messages : [];
    for (const msg of messages) {
      await syncChatMessage(chat.id, msg.from || msg.sender, msg.text, msg.createdAt, msg.id);
    }
  }

  async function syncChatMessage(chatId, senderNickname, content, createdAt, messageId) {
    if (!chatId || !senderNickname || !content) return;
    const senderId = await ensureUser(senderNickname);
    if (!senderId) return;
    await request('chat_messages', {
      method: 'POST',
      body: JSON.stringify({
        id: messageId || undefined,
        chat_id: chatId,
        sender_id: senderId,
        content,
        created_at: createdAt || new Date().toISOString()
      }),
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }
    });
  }

  async function syncFollow(actorNickname, targetNickname, following) {
    const actorId = await ensureUser(actorNickname);
    const targetId = await ensureUser(targetNickname);
    if (!actorId || !targetId) return;
    const filter = `follower_id=eq.${encodeURIComponent(actorId)}&followee_id=eq.${encodeURIComponent(targetId)}`;
    if (following) {
      await request('user_follows', {
        method: 'POST',
        body: JSON.stringify({ follower_id: actorId, followee_id: targetId }),
        headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }
      });
    } else {
      await request(`user_follows?${filter}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
    }
  }

  async function syncBlock(actorNickname, targetNickname, blocked) {
    const actorId = await ensureUser(actorNickname);
    const targetId = await ensureUser(targetNickname);
    if (!actorId || !targetId) return;
    const filter = `blocker_id=eq.${encodeURIComponent(actorId)}&blocked_id=eq.${encodeURIComponent(targetId)}`;
    if (blocked) {
      await request('user_blocks', {
        method: 'POST',
        body: JSON.stringify({ blocker_id: actorId, blocked_id: targetId }),
        headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }
      });
    } else {
      await request(`user_blocks?${filter}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
    }
  }

  async function syncTripCommentLike(commentId, nickname, liked) {
    if (!commentId || !nickname) return;
    const userId = await ensureUser(nickname);
    if (!userId) return;
    const filter = `comment_id=eq.${encodeURIComponent(commentId)}&user_id=eq.${encodeURIComponent(userId)}`;
    if (liked) {
      await request('trip_comment_likes', {
        method: 'POST',
        body: JSON.stringify({ comment_id: commentId, user_id: userId }),
        headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }
      });
    } else {
      await request(`trip_comment_likes?${filter}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
    }
  }

  async function syncMediaCommentLike(commentId, nickname, liked) {
    if (!commentId || !nickname) return;
    const userId = await ensureUser(nickname);
    if (!userId) return;
    const filter = `comment_id=eq.${encodeURIComponent(commentId)}&user_id=eq.${encodeURIComponent(userId)}`;
    if (liked) {
      await request('media_comment_likes', {
        method: 'POST',
        body: JSON.stringify({ comment_id: commentId, user_id: userId }),
        headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }
      });
    } else {
      await request(`media_comment_likes?${filter}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
    }
  }

  async function syncNoticeState(nickname, noticeState = {}, chats = []) {
    if (!nickname) return;
    const userId = await ensureUser(nickname);
    if (!userId) return;
    const rows = [{
      user_id: userId,
      scope: 'notifications',
      last_read_at: noticeState.systemReadAt || new Date().toISOString()
    }];
    (Array.isArray(chats) ? chats : []).forEach((chat) => {
      if (!chat?.id) return;
      rows.push({
        user_id: userId,
        scope: `chat:${chat.id}`,
        last_read_at: noticeState.chatReadAt?.[chat.id] || new Date().toISOString()
      });
    });
    await request('user_read_state', {
      method: 'POST',
      body: JSON.stringify(rows),
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }
    });
  }

  async function syncAdminEvent(eventType, payload = {}, createdAt) {
    if (!eventType) return;
    const actorNickname = payload.user || payload.from || payload.actor || null;
    const userId = actorNickname ? await ensureUser(actorNickname).catch(() => null) : null;
    await request('admin_events', {
      method: 'POST',
      body: JSON.stringify({
        event_type: eventType,
        payload,
        user_id: userId || null,
        user_nickname: actorNickname,
        created_at: createdAt || new Date().toISOString()
      }),
      headers: { Prefer: 'return=minimal' }
    });
  }

  global.RJSupabase = {
    URL_KEY,
    ANON_KEY,
    STORAGE_BUCKET_KEY,
    DEFAULT_STORAGE_BUCKET,
    normalizeConfig,
    setConfig,
    isEnabled,
    signUpWithLocalAccount,
    signInWithLocalAccount,
    restoreSupabaseSession,
    getSupabaseAuthSession,
    signOutSupabaseSession,
    findUserByNickname,
    createUserWithProfile,
    ensureUser,
    syncUserProfile,
    syncTrip,
    syncTripLike,
    syncTripComment,
    syncMediaPost,
    syncMediaLike,
    syncMediaComment,
    deleteTrip,
    deleteMediaPost,
    syncChat,
    syncChatMessage,
    syncFollow,
    syncBlock,
    syncTripCommentLike,
    syncMediaCommentLike,
    syncNoticeState,
    syncAdminEvent,
    uploadDiaryImage
  };

  getSupabaseClient();
  void restoreSupabaseSession();
})(window);
