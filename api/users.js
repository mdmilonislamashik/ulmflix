const { requireUser, json } = require('./_supabase');

module.exports = async (req, res) => {
  try {
    if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' });
    const { supabase } = await requireUser(req, { admin: true });
    const page = Math.max(1, Number(req.query?.page || 1));
    const perPage = Math.min(100, Math.max(1, Number(req.query?.perPage || 50)));
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const ids = (data.users || []).map(u => u.id);
    let profiles = [];
    if (ids.length) {
      const result = await supabase.from('profiles').select('id,display_name,avatar_url,role,currency_code,created_at').in('id', ids);
      if (result.error) throw result.error;
      profiles = result.data || [];
    }
    const map = new Map(profiles.map(p => [p.id, p]));
    return json(res, 200, { users: (data.users || []).map(u => ({
      id: u.id, email: u.email, created_at: u.created_at, email_confirmed_at: u.email_confirmed_at,
      last_sign_in_at: u.last_sign_in_at, profile: map.get(u.id) || null
    })), total: data.total || 0 });
  } catch (error) {
    return json(res, error.status || 500, { error: error.message || 'Server error' });
  }
};
