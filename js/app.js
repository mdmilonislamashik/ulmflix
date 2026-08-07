(function () {
    "use strict";

    const TABLE_NAME = "monetization_settings";
    const STORAGE_KEY = "ULMFlix_monetization_settings";

    const DEFAULTS = {
        premiumEnabled: true,
        monthlyPrice: 5,
        yearlyPrice: 50,

        adsEnabled: true,
        affiliateEnabled: false,
        sponsorshipEnabled: false,
        donationEnabled: false,
        partnersEnabled: false,

        paymentProvider: "manual",
        paymentAccount: "",
        promoCode: "",

        contentLockEnabled: false,
        vipEnabled: false,

        totalRevenue: 0,
        subscriptionRevenue: 0,

        monetizationStatus: "active"
    };

    let monetizationSettings = {
        ...DEFAULTS
    };


    function mergeSettings(settings) {
        return {
            ...DEFAULTS,
            ...(settings || {})
        };
    }


    function saveLocal(settings) {
        try {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(settings)
            );

            return true;
        } catch (error) {
            console.error(
                "Failed to save monetization settings locally:",
                error
            );

            return false;
        }
    }


    function loadLocal() {
        try {
            const raw = localStorage.getItem(
                STORAGE_KEY
            );

            if (!raw) {
                return {
                    ...DEFAULTS
                };
            }

            return mergeSettings(
                JSON.parse(raw)
            );

        } catch (error) {
            console.error(
                "Failed to load local monetization settings:",
                error
            );

            return {
                ...DEFAULTS
            };
        }
    }


    async function loadMonetizationSettings() {

        // Start with local settings.
        monetizationSettings =
            loadLocal();


        // If Supabase is not connected,
        // continue using local settings.
        if (!window.SF_SUPABASE) {

            console.warn(
                "Supabase is not available. Using LocalStorage settings."
            );

            applyMonetizationSettings(
                monetizationSettings
            );

            return monetizationSettings;
        }


        try {

            const {
                data,
                error
            } = await window.SF_SUPABASE
                .from(TABLE_NAME)
                .select(
                    "id, settings, updated_at"
                )
                .order(
                    "updated_at",
                    {
                        ascending: false
                    }
                )
                .limit(1)
                .maybeSingle();


            if (error) {
                throw error;
            }


            if (
                data &&
                data.settings
            ) {

                monetizationSettings =
                    mergeSettings(
                        data.settings
                    );


                saveLocal(
                    monetizationSettings
                );


                console.log(
                    "Monetization settings loaded from Supabase."
                );

            } else {

                console.warn(
                    "No monetization settings found in Supabase."
                );

            }

        } catch (error) {

            console.error(
                "Failed to load monetization settings from Supabase:",
                error
            );


            console.warn(
                "Using LocalStorage monetization settings."
            );
        }


        applyMonetizationSettings(
            monetizationSettings
        );


        return monetizationSettings;
    }


    function setElementVisible(
        element,
        visible
    ) {

        if (!element) {
            return;
        }


        element.hidden =
            !visible;


        if (visible) {

            element.style.display =
                "";

        } else {

            element.style.display =
                "none";
        }
    }


    function setElementEnabled(
        element,
        enabled
    ) {

        if (!element) {
            return;
        }


        element.disabled =
            !enabled;


        element.setAttribute(
            "aria-disabled",
            String(!enabled)
        );
    }


    function applyMonetizationSettings(
        settings
    ) {

        const merged =
            mergeSettings(settings);


        monetizationSettings =
            merged;


        /*
         * PREMIUM
         *
         * Elements:
         * data-monetization="premium"
         */
        document
            .querySelectorAll(
                '[data-monetization="premium"]'
            )
            .forEach(
                function (element) {

                    setElementVisible(
                        element,
                        merged.premiumEnabled
                    );
                }
            );


        /*
         * ADS
         *
         * Elements:
         * data-monetization="ads"
         */
        document
            .querySelectorAll(
                '[data-monetization="ads"]'
            )
            .forEach(
                function (element) {

                    setElementVisible(
                        element,
                        merged.adsEnabled
                    );
                }
            );


        /*
         * VIP
         *
         * Elements:
         * data-monetization="vip"
         */
        document
            .querySelectorAll(
                '[data-monetization="vip"]'
            )
            .forEach(
                function (element) {

                    setElementVisible(
                        element,
                        merged.vipEnabled
                    );
                }
            );


        /*
         * CONTENT LOCK
         *
         * Elements:
         * data-monetization="content-lock"
         */
        document
            .querySelectorAll(
                '[data-monetization="content-lock"]'
            )
            .forEach(
                function (element) {

                    setElementVisible(
                        element,
                        merged.contentLockEnabled
                    );
                }
            );


        /*
         * SPONSORSHIP
         *
         * Elements:
         * data-monetization="sponsorship"
         */
        document
            .querySelectorAll(
                '[data-monetization="sponsorship"]'
            )
            .forEach(
                function (element) {

                    setElementVisible(
                        element,
                        merged.sponsorshipEnabled
                    );
                }
            );


        /*
         * PARTNERS
         *
         * Elements:
         * data-monetization="partners"
         */
        document
            .querySelectorAll(
                '[data-monetization="partners"]'
            )
            .forEach(
                function (element) {

                    setElementVisible(
                        element,
                        merged.partnersEnabled
                    );
                }
            );


        /*
         * AFFILIATE
         *
         * Elements:
         * data-monetization="affiliate"
         */
        document
            .querySelectorAll(
                '[data-monetization="affiliate"]'
            )
            .forEach(
                function (element) {

                    setElementVisible(
                        element,
                        merged.affiliateEnabled
                    );
                }
            );


        /*
         * DONATION
         *
         * Elements:
         * data-monetization="donation"
         */
        document
            .querySelectorAll(
                '[data-monetization="donation"]'
            )
            .forEach(
                function (element) {

                    setElementVisible(
                        element,
                        merged.donationEnabled
                    );
                }
            );


        /*
         * PREMIUM PRICE
         */
        document
            .querySelectorAll(
                '[data-monetization-value="monthlyPrice"]'
            )
            .forEach(
                function (element) {

                    element.textContent =
                        Number(
                            merged.monthlyPrice
                        ).toFixed(2);
                }
            );


        document
            .querySelectorAll(
                '[data-monetization-value="yearlyPrice"]'
            )
            .forEach(
                function (element) {

                    element.textContent =
                        Number(
                            merged.yearlyPrice
                        ).toFixed(2);
                }
            );


        /*
         * PAYMENT PROVIDER
         */
        document
            .querySelectorAll(
                '[data-monetization-value="paymentProvider"]'
            )
            .forEach(
                function (element) {

                    element.textContent =
                        merged.paymentProvider;
                }
            );


        /*
         * MONETIZATION STATUS
         */
        document
            .querySelectorAll(
                '[data-monetization-value="monetizationStatus"]'
            )
            .forEach(
                function (element) {

                    element.textContent =
                        merged.monetizationStatus;
                }
            );


        /*
         * CONTENT LOCK BEHAVIOR
         *
         * Elements:
         * data-premium-content="true"
         */
        document
            .querySelectorAll(
                '[data-premium-content="true"]'
            )
            .forEach(
                function (element) {

                    const isLocked =
                        merged.contentLockEnabled;


                    element.classList.toggle(
                        "content-locked",
                        isLocked
                    );


                    if (isLocked) {

                        element.setAttribute(
                            "data-content-locked",
                            "true"
                        );

                    } else {

                        element.removeAttribute(
                            "data-content-locked"
                        );
                    }
                }
            );


        /*
         * BODY CLASSES
         *
         * Useful for CSS.
         */
        document.body.classList.toggle(
            "monetization-premium-enabled",
            merged.premiumEnabled
        );


        document.body.classList.toggle(
            "monetization-ads-enabled",
            merged.adsEnabled
        );


        document.body.classList.toggle(
            "monetization-vip-enabled",
            merged.vipEnabled
        );


        document.body.classList.toggle(
            "monetization-content-lock-enabled",
            merged.contentLockEnabled
        );


        document.body.classList.toggle(
            "monetization-sponsorship-enabled",
            merged.sponsorshipEnabled
        );


        document.body.classList.toggle(
            "monetization-partners-enabled",
            merged.partnersEnabled
        );


        document.body.classList.toggle(
            "monetization-affiliate-enabled",
            merged.affiliateEnabled
        );


        document.body.classList.toggle(
            "monetization-donation-enabled",
            merged.donationEnabled
        );


        console.log(
            "Monetization settings applied:",
            merged
        );
    }


    /*
     * Public API
     *
     * Other JavaScript files can use:
     *
     * window.ULMFlixMonetization.getSettings()
     */
    window.ULMFlixMonetization = {

        getSettings:
            function () {

                return {
                    ...monetizationSettings
                };
            },


        refresh:
            async function () {

                return await loadMonetizationSettings();
            },


        apply:
            function (settings) {

                applyMonetizationSettings(
                    settings
                );
            },


        isPremiumEnabled:
            function () {

                return Boolean(
                    monetizationSettings.premiumEnabled
                );
            },


        areAdsEnabled:
            function () {

                return Boolean(
                    monetizationSettings.adsEnabled
                );
            },


        isVipEnabled:
            function () {

                return Boolean(
                    monetizationSettings.vipEnabled
                );
            },


        isContentLockEnabled:
            function () {

                return Boolean(
                    monetizationSettings.contentLockEnabled
                );
            },


        isSponsorshipEnabled:
            function () {

                return Boolean(
                    monetizationSettings.sponsorshipEnabled
                );
            },


        arePartnersEnabled:
            function () {

                return Boolean(
                    monetizationSettings.partnersEnabled
                );
            },


        isAffiliateEnabled:
            function () {

                return Boolean(
                    monetizationSettings.affiliateEnabled
                );
            },


        isDonationEnabled:
            function () {

                return Boolean(
                    monetizationSettings.donationEnabled
                );
            }
    };


    /*
     * Initialize
     */
    async function initialize() {

        console.log(
            "Initializing ULMFlix Monetization..."
        );


        await loadMonetizationSettings();


        console.log(
            "ULMFlix Monetization ready."
        );
    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initialize
        );

    } else {

        initialize();
    }

})();
