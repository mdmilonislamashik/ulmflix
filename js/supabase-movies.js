async function loadMoviesFromSupabase() {
    if (!window.SF_SUPABASE) {
        console.error("Supabase client not available.");
        return [];
    }

    const { data, error } = await window.SF_SUPABASE
        .from("movies")
        .select("*")
        .eq("status", "Published")
        .order("added_at", {
            ascending: false
        });

    if (error) {
        console.error(
            "Supabase Movie Load Error:",
            error
        );
        return [];
    }

    return data || [];
}

async function getPublishedMovies() {
    return await loadMoviesFromSupabase();
}
