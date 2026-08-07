(async()=>{
  const supabase=window.SF_SUPABASE;
  if(!supabase){location.replace('../login.html?redirect='+encodeURIComponent(location.pathname));return;}
  const {data:{user}}=await supabase.auth.getUser();
  if(!user){location.replace('../login.html?redirect='+encodeURIComponent(location.pathname));return;}
  const {data:profile}=await supabase.from('profiles').select('role,display_name,avatar_url').eq('id',user.id).maybeSingle();
  if(!profile || profile.role !== 'admin'){document.body.innerHTML='<main style="padding:50px;font-family:system-ui"><h1>Access denied</h1><p>You do not have permission to access the admin panel.</p><a href="../index.html">Back to ULMFlix</a></main>';return;}
  window.SF_ADMIN_USER={...user,profile};
  document.documentElement.classList.add('admin-ready');
})();
