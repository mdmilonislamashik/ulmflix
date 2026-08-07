window.SFCatalog = (() => {
  const normalize = m => ({
    ...m,
    id: Number(m.id), title: m.title || 'Untitled', overview: m.description || m.overview || '',
    release_date: m.release_date || (m.release_year ? `${m.release_year}-01-01` : ''),
    poster_path: m.poster_path || m.poster_url || null,
    backdrop_path: m.backdrop_path || m.backdrop_url || m.poster_url || null,
    vote_average: Number(m.vote_average || m.rating_average || 0),
    runtime: m.runtime || m.duration_minutes || null,
    videos: m.videos || {results: []}
  });
  async function client(){return window.SF_SUPABASE||null;}
  async function published({page=1,limit=24,featured=null,trending=null}={}){
    const supabase=await client(); if(!supabase) return null;
    let q=supabase.from('movies').select('*',{count:'exact'}).eq('status','Published').order('added_at',{ascending:false});
    if(featured!==null) q=q.eq('featured',featured); if(trending!==null) q=q.eq('trending',trending);
    const from=(page-1)*limit; const {data,error,count}=await q.range(from,from+limit-1); if(error) throw error;
    return {page,total_pages:Math.max(1,Math.ceil((count||0)/limit)),total_results:count||0,results:(data||[]).map(normalize)};
  }
  async function byId(id){const supabase=await client(); if(!supabase)return null; const {data,error}=await supabase.from('movies').select('*').eq('id',Number(id)).eq('status','Published').maybeSingle();if(error)throw error;return data?normalize(data):null;}
  return {normalize,published,byId};
})();
