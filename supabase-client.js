(function initRomanticJourneySupabase(global) {
  const URL_KEY = 'romanticJourneySupabaseUrl';
  const ANON_KEY = 'romanticJourneySupabaseAnonKey';

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
      method: 'GET',
      headers: { Prefer: 'return=minimal' }
    });
    return Array.isArray(rows) && rows.length ? rows[0] : null;
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
      body: JSON.stringify({ user_id: user.id })
    });

    return user;
  }

  global.RJSupabase = {
    URL_KEY,
    ANON_KEY,
    normalizeConfig,
    setConfig,
    isEnabled,
    findUserByNickname,
    createUserWithProfile
  };
})(window);
