// Deprecated compatibility file. Admin pages now use the root Supabase config.
(function(){
  window.SF_SUPABASE_URL = window.ULMFLIX_SUPABASE?.URL || '';
  window.SF_SUPABASE_ANON_KEY = window.ULMFLIX_SUPABASE?.KEY || '';
})();
