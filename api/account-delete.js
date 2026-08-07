const { requireUser, json } = require('./_supabase');

module.exports = async (req, res) => {
  try {
    if (req.method !== 'DELETE' && req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
    const { supabase, user } = await requireUser(req);
    const { error } = await supabase.auth.admin.deleteUser(user.id);
    if (error) throw error;
    return json(res, 200, { ok: true });
  } catch (error) {
    return json(res, error.status || 500, { error: error.message || 'Could not delete account.' });
  }
};
