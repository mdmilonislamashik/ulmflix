window.SFComponents = {
    card(movie) {
        const title = movie.title || "Untitled";
        const year = (movie.release_date || "").slice(0,4) || "N/A";
        const rating = Number(movie.vote_average || 0).toFixed(1);
        const saved = window.SFStore?.has("streamflix_watchlist", movie.id);
        return `<article class="card">
            <a class="poster-link" href="details.html?id=${encodeURIComponent(movie.id)}" aria-label="Open ${SF.escape(title)}">
                <img class="poster" src="${SF.poster(movie)}" alt="${SF.escape(title)}" loading="lazy">
                <span class="movie-rating">★ ${rating}</span>
            </a>
            <div class="card-body">
                <div class="card-title">${SF.escape(title)}</div>
                <div class="meta">${year}</div>
                <div class="card-actions">
                    <a class="mini" href="details.html?id=${encodeURIComponent(movie.id)}">Details</a>
                    <button class="mini ${saved ? "active" : ""}" data-save="${movie.id}" aria-label="Toggle watchlist">${saved ? "♥ Saved" : "♡ Save"}</button>
                </div>
            </div>
        </article>`;
    },
    render(id, movies) {
        const el = document.getElementById(id);
        if (!el) return;
        el.innerHTML = movies?.length ? movies.map(m => this.card(m)).join("") : '<div class="status">No movies found.</div>';
    }
};

