(() => {
    const items = [
        ["Home", "index.html", "⌂"],
        ["Movies", "movies.html", "🎬"],
        ["Search", "search.html", "⌕"],
        ["Watchlist", "watchlist.html", "♥"],
        ["Explore", "features.html", "●"],
        ["Guides", "guides.html", "▤"],
        ["Premium", "earn.html", "★"],
        ["Dashboard", "dashboard.html", "◉"],
        ["Profile", "profile.html", "◉"],
        ["Settings", "settings.html", "⚙"],
    ];

    function pageName() {
        return location.pathname.split("/").pop() || "index.html";
    }

    function build() {
        const nav = document.querySelector("[data-site-nav]");
        if (!nav || nav.dataset.ready === "1") return;
        nav.dataset.ready = "1";

        const current = pageName();
        nav.innerHTML = `
            <a class="logo" href="index.html" aria-label="ULMFlix home">ULMFLIX</a>
            <div class="desktop-nav" aria-label="Primary navigation">
                ${items.slice(0,4).map(([label, href]) =>
                    `<a class="${current === href ? "active" : ""}" href="${href}">${label}</a>`
                ).join("")}
            </div>
            <div class="nav-right">
                <a class="nav-login" href="profile.html">Profile</a>
                <button class="menu-trigger" id="menuTrigger" type="button"
                    aria-label="Open menu" aria-expanded="false" aria-controls="siteMenu">⋮</button>
            </div>
            <div class="site-menu" id="siteMenu" hidden>
                <div class="site-menu-head">
                    <strong>ULMFlix</strong>
                    <button class="menu-close" id="menuClose" type="button" aria-label="Close menu">×</button>
                </div>
                <div class="site-menu-links">
                    ${items.map(([label, href, icon]) =>
                        `<a class="${current === href ? "active" : ""}" href="${href}">
                            <span aria-hidden="true">${icon}</span><span>${label}</span>
                        </a>`
                    ).join("")}
                    <button class="site-menu-logout" id="siteLogout" type="button">
                        <span aria-hidden="true">↪</span><span>Log out</span>
                    </button>
                </div>
            </div>
        `;

        const trigger = nav.querySelector("#menuTrigger");
        const menu = nav.querySelector("#siteMenu");
        const close = nav.querySelector("#menuClose");
        const logout = nav.querySelector("#siteLogout");

        const setOpen = (open) => {
            menu.hidden = !open;
            trigger.setAttribute("aria-expanded", String(open));
            document.body.classList.toggle("menu-open", open);
        };

        trigger.addEventListener("click", (e) => {
            e.stopPropagation();
            setOpen(menu.hidden);
        });
        close.addEventListener("click", () => setOpen(false));
        document.addEventListener("click", (e) => {
            if (!menu.hidden && !menu.contains(e.target) && e.target !== trigger) setOpen(false);
        });
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") setOpen(false);
        });
        menu.querySelectorAll("a").forEach(a => a.addEventListener("click", () => setOpen(false)));

        logout.addEventListener("click", async () => {
            try {
                if (window.SFAuth?.logout) await window.SFAuth.logout();
            } finally {
                localStorage.removeItem("sf_session");
                setOpen(false);
                location.href = "index.html";
            }
        });
    }

    document.addEventListener("DOMContentLoaded", build);
})();

(function(){if("serviceWorker" in navigator && /^https?:$/.test(location.protocol)){window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));}})();
