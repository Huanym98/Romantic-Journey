(function initRomanticJourneySupabase(global) {
  const URL_KEY = 'romanticJourneySupabaseUrl';
  const ANON_KEY = 'romanticJourneySupabaseAnonKey';
  const STORAGE_BUCKET_KEY = 'romanticJourneySupabaseBucket';
  const DEFAULT_STORAGE_BUCKET = 'Trip_Photos';
  const userIdCache = new Map();

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

  async function uploadDiaryImage(file, options = {}) {
    if (!file) throw new Error('file is required');
    const { url, anonKey, storageBucket } = normalizeConfig();
    if (!url || !anonKey) throw new Error('Supabase config missing');
    const nickname = safePathPart(options.nickname || 'guest');
    const batchId = safePathPart(options.batchId || Date.now());
    const index = Number(options.index || 0);
    const ext = extFromFileName(file.name, file.type?.includes('png') ? 'png' : 'jpg');
    const objectPath = `${nickname}/${batchId}/${Date.now()}_${index}.${ext}`;
    const encodedPath = objectPath.split('/').map((s) => encodeURIComponent(s)).join('/');
    const response = await fetch(`${url}/storage/v1/object/${encodeURIComponent(storageBucket)}/${encodedPath}`, {
      method: 'POST',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        'x-upsert': 'false',
        'Content-Type': file.type || 'application/octet-stream'
      },
      body: file
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Supabase storage ${response.status}: ${text}`);
    }
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
})(window);
