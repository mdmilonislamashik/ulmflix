(function () {
    "use strict";

    function normalizeKey(key) {
        const aliases = {
            "streamflix_watchlist": "ULMFlix_watchlist",
            "watchlist": "ULMFlix_watchlist",
            "streamflix_history": "ULMFlix_watch_history",
            "watchHistory": "ULMFlix_watch_history"
        };

        return aliases[key] || key;
    }

    window.SFStore = {

        get(key, fallback = []) {
            try {
                const storageKey = normalizeKey(key);
                const raw = localStorage.getItem(storageKey);

                if (!raw) {
                    return fallback;
                }

                const parsed = JSON.parse(raw);

                return parsed ?? fallback;
            } catch (error) {
                console.error("SFStore.get error:", error);
                return fallback;
            }
        },

        set(key, value) {
            try {
                const storageKey = normalizeKey(key);

                localStorage.setItem(
                    storageKey,
                    JSON.stringify(value)
                );

                return true;
            } catch (error) {
                console.error("SFStore.set error:", error);
                return false;
            }
        },

        remove(key) {
            try {
                const storageKey = normalizeKey(key);

                localStorage.removeItem(storageKey);

                return true;
            } catch (error) {
                console.error("SFStore.remove error:", error);
                return false;
            }
        },

        toggle(key, item) {
            const storageKey = normalizeKey(key);
            const list = this.get(storageKey, []);

            const exists = list.some(
                x => String(x.id) === String(item.id)
            );

            const next = exists
                ? list.filter(
                    x => String(x.id) !== String(item.id)
                )
                : [...list, item];

            this.set(storageKey, next);

            return !exists;
        },

        has(key, id) {
            const storageKey = normalizeKey(key);

            return this.get(storageKey, []).some(
                x => String(x.id) === String(id)
            );
        },

        clear(key) {
            return this.remove(key);
        }
    };

    console.log(
        "ULMFlix Storage initialized successfully."
    );

})();
