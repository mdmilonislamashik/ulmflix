const { createClient } = require('@supabase/supabase-js');

function serviceClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase server configuration is missing.');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

function getBearer(req) {
  const value = req.headers.authorization || '';
  return value.startsWith('Bearer ') ? value.slice(7) : '';
}

async function requireUser(req, { admin = false } = {}) {
  const token = getBearer(req);
  if (!token) {
    const error = new Error('Authentication required.');
    error.status = 401;
    throw error;
  }
  const supabase = serviceClient();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    const e = new Error('Invalid or expired session.');
    e.status = 401;
    throw e;
  }
  if (admin) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles').select('role').eq('id', data.user.id).single();
    if (profileError || profile?.role !== 'admin') {
      const e = new Error('Admin access required.');
      e.status = 403;
      throw e;
    }
  }
  return { supabase, user: data.user };
}

function json(res, status, payload) {
  res.status(status).json(payload);
}

module.exports = { serviceClient, requireUser, json };
