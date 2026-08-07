const SF = {
    async request(path, params = {}) {
        const config = window.ULMFLIX_CONFIG || {};
        if (!config.TMDB_API_KEY) {
            if (config.USE_DEMO_DATA_WITHOUT_API_KEY) return this.demo(path, params);
            throw new Error("TMDB API key is missing. Add it in js/config.js.");
        }

        const url = new URL(config.TMDB_BASE_URL + path);
        url.searchParams.set("api_key", config.TMDB_API_KEY);
        url.searchParams.set("language", "en-US");
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, value);
        });

        const response = await fetch(url);
        if (!response.ok) throw new Error(`TMDB request failed (${response.status}).`);
        return response.json();
    },

    poster(movie) {
        const config = window.ULMFLIX_CONFIG;
        return movie?.poster_path
            ? config.TMDB_IMAGE_URL + movie.poster_path
            : "assets/images/placeholder-movie.svg";
    },

    backdrop(movie) {
        const config = window.ULMFLIX_CONFIG;
        return movie?.backdrop_path
            ? config.TMDB_BACKDROP_URL + movie.backdrop_path
            : this.poster(movie);
    },

    escape(value) {
        return String(value ?? "").replace(/[&<>"']/g, c => ({
            "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
        }[c]));
    },

    trending(page=1) { return this.request("/trending/movie/week", {page}); },
    popular(page=1) { return this.request("/movie/popular", {page}); },
    topRated(page=1) { return this.request("/movie/top_rated", {page}); },
    upcoming(page=1) { return this.request("/movie/upcoming", {page}); },
    nowPlaying(page=1) { return this.request("/movie/now_playing", {page}); },
    search(query,page=1) { return this.request("/search/movie", {query,page,include_adult:false}); },
    details(movieId) { return this.request(`/movie/${movieId}`, {append_to_response:"videos,credits"}); },

    demo(path, params={}) {
        const list = [
            {id:101,title:"Demo Horizon",release_date:"2026-01-12",vote_average:8.2,overview:"A sample movie used to verify the ULMFlix interface without a live API key.",poster_path:null,backdrop_path:null},
            {id:102,title:"Night Signal",release_date:"2025-10-04",vote_average:7.8,overview:"A demo thriller entry for testing cards, details and the watchlist.",poster_path:null,backdrop_path:null},
            {id:103,title:"Beyond The City",release_date:"2025-08-21",vote_average:8.0,overview:"A demo drama entry included so the interface works out of the box.",poster_path:null,backdrop_path:null},
            {id:104,title:"The Last Voyage",release_date:"2024-12-15",vote_average:7.6,overview:"A demo adventure title for local testing.",poster_path:null,backdrop_path:null},
            {id:105,title:"Parallel Skies",release_date:"2024-06-08",vote_average:8.4,overview:"A demo science-fiction title.",poster_path:null,backdrop_path:null},
            {id:106,title:"Hidden Frequency",release_date:"2023-11-02",vote_average:7.5,overview:"A demo mystery title.",poster_path:null,backdrop_path:null}
        ];
        if (path.startsWith("/movie/") && /^\/movie\/\d+/.test(path) && !path.includes("popular")) {
            const id = Number(path.split("/")[2]);
            return Promise.resolve(list.find(m => m.id === id) || list[0]);
        }
        if (path.startsWith("/search/")) {
            const q = String(params.query || "").toLowerCase();
            return Promise.resolve({page:1,total_pages:1,total_results:list.filter(m=>m.title.toLowerCase().includes(q)).length,results:list.filter(m=>m.title.toLowerCase().includes(q))});
        }
        return Promise.resolve({page:1,total_pages:1,total_results:list.length,results:list});
    }
};
