(function initRomanticJourneySupabase(global) {
  const URL_KEY = 'romanticJourneySupabaseUrl';
  const ANON_KEY = 'romanticJourneySupabaseAnonKey';
  const userIdCache = new Map();

  function normalizeConfig() {
    const fromWindow = global.SUPABASE_CONFIG || {};
    const url = String(fromWindow.url || localStorage.getItem(URL_KEY) || '').trim();
    const anonKey = String(fromWindow.anonKey || localStorage.getItem(ANON_KEY) || '').trim();
    return { url, anonKey };
  }

  function isEnabled() {
    const { url, anonKey } = normalizeConfig();
    return Boolean(url && anonKey);
  }

  function setConfig(url, anonKey) {
    localStorage.setItem(URL_KEY, String(url || '').trim());
    localStorage.setItem(ANON_KEY, String(anonKey || '').trim());
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
      await syncChatMessage(chat.id, msg.sender, msg.text, msg.createdAt);
    }
  }

  async function syncChatMessage(chatId, senderNickname, content, createdAt) {
    if (!chatId || !senderNickname || !content) return;
    const senderId = await ensureUser(senderNickname);
    if (!senderId) return;
    await request('chat_messages', {
      method: 'POST',
      body: JSON.stringify({
        chat_id: chatId,
        sender_id: senderId,
        content,
        created_at: createdAt || new Date().toISOString()
      }),
      headers: { Prefer: 'return=minimal' }
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

  global.RJSupabase = {
    URL_KEY,
    ANON_KEY,
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
    syncChat,
    syncChatMessage,
    syncFollow,
    syncBlock
  };
})(window);
