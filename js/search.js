document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    const input =
        document.getElementById("searchInput");

    const grid =
        document.getElementById("searchGrid");


    // Required elements না থাকলে Search বন্ধ থাকবে
    if (!input || !grid) {
        console.warn(
            "ULMFlix Search: Search elements not found."
        );

        return;
    }


    const MIN_QUERY_LENGTH = 2;

    const DEBOUNCE_DELAY = 350;

    let timer = null;

    let activeRequestId = 0;


    /*
     * --------------------------------------------------
     * SEARCH STATUS
     * --------------------------------------------------
     */

    function showStatus(
        message,
        type = "info"
    ) {

        grid.innerHTML = "";

        const status =
            document.createElement(
                "div"
            );

        status.className =
            `status search-status search-status-${type}`;

        status.setAttribute(
            "role",
            type === "error"
                ? "alert"
                : "status"
        );

        status.setAttribute(
            "aria-live",
            "polite"
        );

        status.textContent =
            message;

        grid.appendChild(
            status
        );
    }


    /*
     * --------------------------------------------------
     * LOADING STATE
     * --------------------------------------------------
     */

    function showLoading() {

        grid.innerHTML = `
            <div
                class="status search-status search-loading"
                role="status"
                aria-live="polite">

                <span
                    class="search-spinner"
                    aria-hidden="true">
                </span>

                <span>
                    Searching...
                </span>

            </div>
        `;
    }


    /*
     * --------------------------------------------------
     * CLEAR SEARCH
     * --------------------------------------------------
     */

    function clearSearch() {

        clearTimeout(
            timer
        );

        activeRequestId++;

        grid.innerHTML = "";
    }


    /*
     * --------------------------------------------------
     * PERFORM SEARCH
     * --------------------------------------------------
     */

    async function performSearch(
        query
    ) {

        const requestId =
            ++activeRequestId;


        showLoading();


        try {

            /*
             * Check ULMFlix API
             */
            if (
                typeof SF ===
                "undefined"
            ) {

                throw new Error(
                    "Search service is not available."
                );
            }


            if (
                typeof SF.search !==
                "function"
            ) {

                throw new Error(
                    "Search API is not configured correctly."
                );
            }


            /*
             * Request search results
             */
            const data =
                await SF.search(
                    query,
                    1
                );


            /*
             * Ignore old request
             *
             * Example:
             * "bat"
             * then
             * "batman"
             *
             * Old response cannot overwrite
             * the latest response.
             */
            if (
                requestId !==
                activeRequestId
            ) {

                return;
            }


            const results =
                Array.isArray(
                    data?.results
                )
                    ? data.results
                    : [];


            /*
             * No results
             */
            if (
                results.length ===
                0
            ) {

                showStatus(
                    `No results found for "${query}".`,
                    "empty"
                );

                return;
            }


            /*
             * Check renderer
             */
            if (
                typeof SFComponents ===
                "undefined"
            ) {

                throw new Error(
                    "Search result renderer is not available."
                );
            }


            if (
                typeof SFComponents.render !==
                "function"
            ) {

                throw new Error(
                    "Search result renderer is not configured correctly."
                );
            }


            /*
             * Render results
             */
            SFComponents.render(
                "searchGrid",
                results
            );


        } catch (
            error
        ) {

            /*
             * Ignore outdated request errors
             */
            if (
                requestId !==
                activeRequestId
            ) {

                return;
            }


            console.error(
                "ULMFlix Search Error:",
                error
            );


            const message =
                error?.message ||
                "Something went wrong while searching.";


            showStatus(
                message,
                "error"
            );
        }
    }


    /*
     * --------------------------------------------------
     * SEARCH INPUT
     * --------------------------------------------------
     */

    input.addEventListener(
        "input",
        () => {

            clearTimeout(
                timer
            );


            const query =
                input.value.trim();


            /*
             * Empty input
             */
            if (
                !query
            ) {

                activeRequestId++;

                grid.innerHTML = "";

                return;
            }


            /*
             * Minimum characters
             */
            if (
                query.length <
                MIN_QUERY_LENGTH
            ) {

                activeRequestId++;

                showStatus(
                    `Type at least ${MIN_QUERY_LENGTH} characters.`,
                    "info"
                );

                return;
            }


            /*
             * Debounce API request
             */
            timer =
                setTimeout(
                    () => {

                        performSearch(
                            query
                        );

                    },
                    DEBOUNCE_DELAY
                );
        }
    );


    /*
     * --------------------------------------------------
     * ESC KEY
     * --------------------------------------------------
     */

    input.addEventListener(
        "keydown",
        (
            event
        ) => {

            if (
                event.key ===
                "Escape"
            ) {

                input.value =
                    "";

                clearSearch();

                input.focus();
            }
        }
    );


    console.log(
        "ULMFlix Smart Search initialized successfully."
    );

});
