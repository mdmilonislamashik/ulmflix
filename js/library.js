window.SFLibrary = (() => {
  const localKey = "ULMFlix_watchlist";
  const localRead = () => { try { return JSON.parse(localStorage.getItem(localKey) || "[]"); } catch { return []; } };
  const localSave = a => localStorage.setItem(localKey, JSON.stringify(a));
  async function user() { if (!window.SF_SUPABASE) return null; const { data } = await window.SF_SUPABASE.auth.getUser(); return data?.user || null; }
  async function isSaved(movieId) {
    const u = await user();
    if (!u) return localRead().some(m => String(m.id) === String(movieId));
    const { data } = await window.SF_SUPABASE.from("favorites").select("movie_id").eq("user_id", u.id).eq("movie_id", movieId).maybeSingle();
    return Boolean(data);
  }
  async function toggleFavorite(movie) {
    const id = Number(movie.id); const u = await user();
    if (!u) {
      const a = localRead(); const i = a.findIndex(m => String(m.id) === String(id));
      if (i >= 0) { a.splice(i,1); localSave(a); return false; }
      a.push(movie); localSave(a); return true;
    }
    const saved = await isSaved(id);
    if (saved) { await window.SF_SUPABASE.from("favorites").delete().eq("user_id",u.id).eq("movie_id",id); return false; }
    const { error } = await window.SF_SUPABASE.from("favorites").insert({user_id:u.id,movie_id:id});
    if (error) throw error; return true;
  }
  async function listFavorites() {
    const u = await user();
    if (!u) return localRead();
    const { data, error } = await window.SF_SUPABASE.from("favorites").select("created_at,movie:movies(*)").eq("user_id",u.id).order("created_at",{ascending:false});
    if (error) throw error;
    return (data || []).map(x => x.movie).filter(Boolean);
  }
  async function removeFavorite(movieId) {
    const u = await user();
    if (!u) { localSave(localRead().filter(m => String(m.id)!==String(movieId))); return; }
    const { error } = await window.SF_SUPABASE.from("favorites").delete().eq("user_id",u.id).eq("movie_id",movieId); if(error) throw error;
  }
  async function clearFavorites() {
    const u = await user(); if(!u){localStorage.removeItem(localKey);return;}
    const { error } = await window.SF_SUPABASE.from("favorites").delete().eq("user_id",u.id); if(error) throw error;
  }
  async function toggleWatchLater(movieId) {
    const u=await user(); if(!u) return false;
    const id=Number(movieId); const {data}=await window.SF_SUPABASE.from("watch_later").select("movie_id").eq("user_id",u.id).eq("movie_id",id).maybeSingle();
    if(data){await window.SF_SUPABASE.from("watch_later").delete().eq("user_id",u.id).eq("movie_id",id);return false;}
    const {error}=await window.SF_SUPABASE.from("watch_later").insert({user_id:u.id,movie_id:id});if(error)throw error;return true;
  }
  async function isWatchLater(movieId){const u=await user();if(!u)return false;const {data}=await window.SF_SUPABASE.from("watch_later").select("movie_id").eq("user_id",u.id).eq("movie_id",Number(movieId)).maybeSingle();return Boolean(data);}
  async function saveProgress(movieId, position, duration=0) {
    const u = await user(); if(!u) return;
    await window.SF_SUPABASE.from("watch_progress").upsert({user_id:u.id,movie_id:Number(movieId),position_seconds:Number(position)||0,duration_seconds:Number(duration)||null,completed:duration>0&&position/duration>=0.95,updated_at:new Date().toISOString()});
  }
  async function getProgress(movieId) {
    const u = await user(); if(!u) return null;
    const {data}=await window.SF_SUPABASE.from("watch_progress").select("*").eq("user_id",u.id).eq("movie_id",Number(movieId)).maybeSingle(); return data||null;
  }
  async function track(eventName, movieId=null, metadata={}) {
    const u=await user(); if(!u) return;
    await window.SF_SUPABASE.from("analytics_events").insert({user_id:u.id,event_name:eventName,movie_id:movieId?Number(movieId):null,path:location.pathname,metadata});
  }
  return {isSaved,toggleFavorite,listFavorites,removeFavorite,clearFavorites,toggleWatchLater,isWatchLater,saveProgress,getProgress,track};
})();

// Keep movie-card buttons working across old pages.
document.addEventListener("click", async e => {
  const btn=e.target.closest("[data-save]"); if(!btn || !window.SFLibrary) return;
  e.preventDefault();
  const card=btn.closest(".card"); const id=Number(btn.dataset.save);
  const title=card?.querySelector(".card-title")?.textContent || "Movie";
  try { const added=await window.SFLibrary.toggleFavorite({id,title,poster_url:card?.querySelector("img")?.src||"",release_year:""}); btn.classList.toggle("active",added); btn.textContent=added?"♥ Saved":"♡ Save"; }
  catch(err){ console.error(err); alert(err.message||"Could not update watchlist."); }
});
