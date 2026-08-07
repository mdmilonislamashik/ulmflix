(function () {
    "use strict";

    if (!window.supabase) {
        console.error("Supabase JS library is not loaded.");
        return;
    }

    if (!window.SF_SUPABASE_URL) {
        console.error("SF_SUPABASE_URL is missing.");
        return;
    }

    if (!window.SF_SUPABASE_ANON_KEY) {
        console.error("SF_SUPABASE_ANON_KEY is missing.");
        return;
    }

    try {
        window.SF_SUPABASE = window.supabase.createClient(
            window.SF_SUPABASE_URL,
            window.SF_SUPABASE_ANON_KEY
        );

        console.log(
            "ULMFlix Supabase connected successfully."
        );
    } catch (error) {
        console.error(
            "Failed to initialize Supabase:",
            error
        );
    }
})();
