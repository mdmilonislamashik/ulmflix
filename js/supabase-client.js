(function () {
"use strict";

if (!window.supabase || !window.ULMFLIX_SUPABASE) {
console.error("Supabase config missing");
return;
}

window.SF_SUPABASE = window.supabase.createClient(
window.ULMFLIX_SUPABASE.URL,
window.ULMFLIX_SUPABASE.KEY,
{
auth: {
flowType: "pkce",
persistSession: true,
autoRefreshToken: true,
detectSessionInUrl: false
}
}
);

console.log("ULMFlix Supabase connected successfully.");
})();
