const { requireUser, json } = require('./_supabase');

module.exports = async (req, res) => {
  try {
    const { supabase } = await requireUser(req, { admin: true });
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('movies').select('*').order('added_at', { ascending: false });
      if (error) throw error;
      return json(res, 200, { movies: data || [] });
    }
    if (!['POST', 'PATCH', 'DELETE'].includes(req.method)) return json(res, 405, { error: 'Method not allowed' });

    if (req.method === 'POST') {
      const body = req.body || {};
      const payload = sanitize(body);
      const { data, error } = await supabase.from('movies').insert(payload).select('*').single();
      if (error) throw error;
      return json(res, 201, { movie: data });
    }

    const id = Number(req.query?.id || req.body?.id);
    if (!Number.isInteger(id)) return json(res, 400, { error: 'A valid movie id is required.' });

    if (req.method === 'PATCH') {
      const { data: current, error: currentError } = await supabase.from('movies').select('is_premium').eq('id', id).single();
      if (currentError) throw currentError;
      const patch = sanitize(req.body || {});
      if (patch.video_url && (patch.is_premium ?? current.is_premium) === true && !String(patch.video_url).startsWith('storage://media/')) {
        return json(res, 400, { error: 'Premium movies must use a private Supabase media upload.' });
      }
      const { data, error } = await supabase.from('movies').update(patch).eq('id', id).select('*').single();
      if (error) throw error;
      return json(res, 200, { movie: data });
    }

    const { error } = await supabase.from('movies').delete().eq('id', id);
    if (error) throw error;
    return json(res, 200, { ok: true });
  } catch (error) {
    return json(res, error.status || 500, { error: error.message || 'Server error' });
  }
};

function sanitize(input) {
  const allowed = [
    'title','slug','description','poster_url','backdrop_url','trailer_url','video_url',
    'release_year','duration_minutes','language','country','age_rating','is_premium',
    'status','genres','tags','featured','trending'
  ];
  const out = {};
  for (const key of allowed) if (Object.prototype.hasOwnProperty.call(input, key)) out[key] = input[key];
  if (out.title != null) out.title = String(out.title).trim();
  if (out.slug != null) out.slug = String(out.slug).trim().toLowerCase();
  if (out.is_premium === true && out.video_url && !String(out.video_url).startsWith('storage://media/')) { throw Object.assign(new Error('Premium movies must use a private Supabase media upload.'), { status: 400 }); }
  return out;
}
