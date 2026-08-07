(function () {
    "use strict";

    const STORAGE_KEY = "ULMFlix_monetization_settings";
    const TABLE_NAME = "monetization_settings";

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

    let originalSettings = null;

    function $(id) {
        return document.getElementById(id);
    }

    function getValue(id) {
        const element = $(id);

        if (!element) {
            return DEFAULTS[id] ?? "";
        }

        if (element.type === "checkbox") {
            return element.checked;
        }

        return element.value;
    }

    function setValue(id, value) {
        const element = $(id);

        if (!element) {
            return;
        }

        if (element.type === "checkbox") {
            element.checked = Boolean(value);
        } else {
            element.value = value ?? "";
        }
    }

    function collectSettings() {
        return {
            premiumEnabled: Boolean(getValue("premiumEnabled")),

            monthlyPrice:
                Number(getValue("monthlyPrice")) || 0,

            yearlyPrice:
                Number(getValue("yearlyPrice")) || 0,

            adsEnabled:
                Boolean(getValue("adsEnabled")),

            affiliateEnabled:
                Boolean(getValue("affiliateEnabled")),

            sponsorshipEnabled:
                Boolean(getValue("sponsorshipEnabled")),

            donationEnabled:
                Boolean(getValue("donationEnabled")),

            partnersEnabled:
                Boolean(getValue("partnersEnabled")),

            paymentProvider:
                getValue("paymentProvider") || "manual",

            paymentAccount:
                getValue("paymentAccount") || "",

            promoCode:
                getValue("promoCode") || "",

            contentLockEnabled:
                Boolean(getValue("contentLockEnabled")),

            vipEnabled:
                Boolean(getValue("vipEnabled")),

            totalRevenue:
                Number(getValue("totalRevenue")) || 0,

            subscriptionRevenue:
                Number(getValue("subscriptionRevenue")) || 0,

            monetizationStatus:
                getValue("monetizationStatus") || "active"
        };
    }

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
                "LocalStorage save failed:",
                error
            );

            return false;
        }
    }

    function loadLocal() {
        try {
            const raw =
                localStorage.getItem(STORAGE_KEY);

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
                "LocalStorage load failed:",
                error
            );

            return {
                ...DEFAULTS
            };
        }
    }

    async function loadSupabase() {
        if (!window.SF_SUPABASE) {
            console.warn(
                "SF_SUPABASE client not available."
            );

            return null;
        }

        try {
            const {
                data,
                error
            } = await window.SF_SUPABASE
                .from(TABLE_NAME)
                .select("id, settings, updated_at")
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

            if (!data || !data.settings) {
                return null;
            }

            return mergeSettings(
                data.settings
            );

        } catch (error) {
            console.error(
                "Supabase load failed:",
                error
            );

            return null;
        }
    }

    async function saveSupabase(settings) {
        if (!window.SF_SUPABASE) {
            return {
                success: false,
                skipped: true
            };
        }

        try {
            const {
                data: existing,
                error: findError
            } = await window.SF_SUPABASE
                .from(TABLE_NAME)
                .select("id")
                .order(
                    "updated_at",
                    {
                        ascending: false
                    }
                )
                .limit(1)
                .maybeSingle();

            if (findError) {
                throw findError;
            }

            let result;

            if (
                existing &&
                existing.id
            ) {
                result =
                    await window.SF_SUPABASE
                        .from(TABLE_NAME)
                        .update({
                            settings:
                                settings,

                            updated_at:
                                new Date()
                                    .toISOString()
                        })
                        .eq(
                            "id",
                            existing.id
                        );
            } else {
                result =
                    await window.SF_SUPABASE
                        .from(TABLE_NAME)
                        .insert({
                            settings:
                                settings,

                            updated_at:
                                new Date()
                                    .toISOString()
                        });
            }

            if (result.error) {
                throw result.error;
            }

            return {
                success: true,
                skipped: false
            };

        } catch (error) {
            console.error(
                "Supabase save failed:",
                error
            );

            return {
                success: false,
                skipped: false,
                error: error
            };
        }
    }

    function updateDashboard(settings) {
        const total =
            $("totalRevenueDisplay");

        const subscription =
            $("subscriptionRevenueDisplay");

        const status =
            $("monetizationStatusDisplay");

        if (total) {
            total.textContent =
                "$" +
                Number(
                    settings.totalRevenue || 0
                ).toFixed(2);
        }

        if (subscription) {
            subscription.textContent =
                "$" +
                Number(
                    settings.subscriptionRevenue || 0
                ).toFixed(2);
        }

        if (status) {
            status.textContent =
                settings.monetizationStatus ===
                "active"
                    ? "Active"
                    : "Inactive";
        }
    }

    function applySettings(settings) {
        const merged =
            mergeSettings(settings);

        setValue(
            "premiumEnabled",
            merged.premiumEnabled
        );

        setValue(
            "monthlyPrice",
            merged.monthlyPrice
        );

        setValue(
            "yearlyPrice",
            merged.yearlyPrice
        );

        setValue(
            "adsEnabled",
            merged.adsEnabled
        );

        setValue(
            "affiliateEnabled",
            merged.affiliateEnabled
        );

        setValue(
            "sponsorshipEnabled",
            merged.sponsorshipEnabled
        );

        setValue(
            "donationEnabled",
            merged.donationEnabled
        );

        setValue(
            "partnersEnabled",
            merged.partnersEnabled
        );

        setValue(
            "paymentProvider",
            merged.paymentProvider
        );

        setValue(
            "paymentAccount",
            merged.paymentAccount
        );

        setValue(
            "promoCode",
            merged.promoCode
        );

        setValue(
            "contentLockEnabled",
            merged.contentLockEnabled
        );

        setValue(
            "vipEnabled",
            merged.vipEnabled
        );

        setValue(
            "totalRevenue",
            merged.totalRevenue
        );

        setValue(
            "subscriptionRevenue",
            merged.subscriptionRevenue
        );

        setValue(
            "monetizationStatus",
            merged.monetizationStatus
        );

        updateDashboard(
            merged
        );

        originalSettings =
            JSON.parse(
                JSON.stringify(merged)
            );
    }

    function showNotification(
        message,
        type = "success"
    ) {
        const notification =
            $("saveNotification");

        if (notification) {
            notification.textContent =
                message;

            notification.classList.remove(
                "success",
                "error",
                "warning"
            );

            notification.classList.add(
                type
            );

            notification.style.display =
                "block";

            clearTimeout(
                window.SFMonetizationNotificationTimer
            );

            window.SFMonetizationNotificationTimer =
                setTimeout(
                    function () {
                        notification.style.display =
                            "none";
                    },
                    4000
                );
        } else {
            console.log(
                message
            );
        }
    }

    function updateSaveStatus(
        title,
        text
    ) {
        const titleElement =
            $("saveStatusTitle");

        const textElement =
            $("saveStatusText");

        if (titleElement) {
            titleElement.textContent =
                title;
        }

        if (textElement) {
            textElement.textContent =
                text;
        }
    }

    function setSavingState(
        isSaving
    ) {
        const button =
            $("saveMonetizationSettings");

        if (!button) {
            return;
        }

        if (isSaving) {
            button.disabled =
                true;

            button.dataset.originalText =
                button.textContent;

            button.textContent =
                "Saving...";
        } else {
            button.disabled =
                false;

            button.textContent =
                button.dataset.originalText ||
                "Save Changes";
        }
    }

    async function handleSave() {
        const settings =
            collectSettings();

        const localSuccess =
            saveLocal(settings);

        if (!localSuccess) {
            showNotification(
                "Could not save settings locally.",
                "error"
            );

            return;
        }

        setSavingState(true);

        updateSaveStatus(
            "Saving changes...",
            "Synchronizing monetization settings with Supabase."
        );

        const remote =
            await saveSupabase(settings);

        setSavingState(false);

        if (remote.success) {
            originalSettings =
                JSON.parse(
                    JSON.stringify(settings)
                );

            updateDashboard(
                settings
            );

            updateSaveStatus(
                "All changes saved",
                "Your monetization settings are up to date."
            );

            showNotification(
                "Settings saved successfully to Supabase.",
                "success"
            );

            console.log(
                "Monetization settings synced with Supabase."
            );

            return;
        }

        if (remote.skipped) {
            updateSaveStatus(
                "Saved locally",
                "Supabase connection is not available."
            );

            showNotification(
                "Saved locally. Supabase is not connected.",
                "warning"
            );

            return;
        }

        updateSaveStatus(
            "Saved locally",
            "Supabase synchronization failed."
        );

        showNotification(
            "Saved locally, but Supabase synchronization failed.",
            "error"
        );
    }

    function handleReset() {
        if (!originalSettings) {
            originalSettings =
                loadLocal();
        }

        applySettings(
            originalSettings
        );

        showNotification(
            "Changes have been reset.",
            "warning"
        );

        updateSaveStatus(
            "All changes saved",
            "Your monetization settings are up to date."
        );
    }

    function attachEvents() {
        const saveButton =
            $("saveMonetizationSettings");

        const resetButton =
            $("resetMonetization");

        if (saveButton) {
            saveButton.addEventListener(
                "click",
                handleSave
            );

            saveButton.disabled =
                false;
        } else {
            console.error(
                "Save button not found."
            );
        }

        if (resetButton) {
            resetButton.addEventListener(
                "click",
                handleReset
            );
        }

        console.log(
            "Monetization controls initialized."
        );
    }

    async function initialize() {
        console.log(
            "Initializing Monetization Panel..."
        );

        let settings =
            loadLocal();

        const remote =
            await loadSupabase();

        if (remote) {
            settings =
                remote;

            saveLocal(
                remote
            );

            console.log(
                "Loaded settings from Supabase."
            );
        } else {
            console.log(
                "Using LocalStorage settings."
            );
        }

        applySettings(
            settings
        );

        attachEvents();

        console.log(
            "Monetization Panel ready."
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
