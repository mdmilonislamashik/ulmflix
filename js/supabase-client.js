(function () {
"use strict";

if (!window.supabase || !window.ULMFLIX_CONFIG) {
    console.error("Supabase configuration missing.");
    return;
}

window.SF_SUPABASE = window.supabase.createClient(
    window.ULMFLIX_CONFIG.SUPABASE_URL,
    window.ULMFLIX_CONFIG.SUPABASE_PUBLISHABLE_KEY,
    {
        auth: {
            flowType: "pkce",
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: false
        }
    }
);

console.log("ULMFlix Supabase connected.");
})();