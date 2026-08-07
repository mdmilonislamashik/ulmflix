(() => {
  "use strict";
  const KEY = "ULMFlix_account_settings";
  const defaults = {
    profileName: "", username: "", email: "", avatar: "", bio: "", phone: "",
    dob: "", gender: "", country: "", city: "", language: "en", timezone: "Asia/Dhaka",
    accountStatus: "Active", rememberMe: false, autoLogin: false, emailNotifications: true,
    loginAlerts: true, securityAlerts: true, watchlistPrivacy: true, profileVisibility: true,
    onlineStatus: true, showActivity: true, recommendations: true, adultFilter: true, dataSaving: false
  };

  const $ = id => document.getElementById(id);
  const message = (text, error = false) => {
    const box = $("settingsMessage");
    if (!box) return;
    box.textContent = text;
    box.classList.toggle("settings-error", error);
    box.style.display = "block";
    clearTimeout(window.__settingsTimer);
    window.__settingsTimer = setTimeout(() => { box.style.display = "none"; }, 4500);
  };

  function localUser() {
    try { return JSON.parse(localStorage.getItem("ULMFlix_current_user") || localStorage.getItem("ULMFlix_user") || "null"); }
    catch { return null; }
  }
  function value(id, fallback = "") {
    const el = $(id); if (!el) return fallback;
    return el.type === "checkbox" ? el.checked : el.value;
  }
  function setValue(id, val) {
    const el = $(id); if (!el) return;
    if (el.type === "checkbox") el.checked = Boolean(val); else el.value = val ?? "";
  }
  function readLocal() {
    try { return { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || "{}")} } catch { return {...defaults}; }
  }
  function collect() {
    const out = {};
    Object.keys(defaults).forEach(k => out[k] = value(k, defaults[k]));
    out.accountStatus = $("accountStatus")?.textContent || "Active";
    return out;
  }
  function populate(data) {
    Object.keys(defaults).forEach(k => {
      if (k === "accountStatus") { if ($("accountStatus")) $("accountStatus").textContent = data[k] || "Active"; return; }
      setValue(k, data[k]);
    });
  }

  async function client() { return window.SF_SUPABASE || null; }

  async function loadRemote() {
    const supabase = await client(); if (!supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    if (error) throw error;
    if (!data) return { profileName: user.user_metadata?.name || user.email?.split("@")[0] || "", email: user.email || "" };
    return {
      ...defaults, profileName: data.display_name || "", username: data.username || "", email: user.email || "",
      avatar: data.avatar_url || "", bio: data.bio || "", phone: data.phone || "", dob: data.dob || "",
      gender: data.gender || "", country: data.country_code || "", city: data.city || "", language: data.language || "en",
      timezone: data.timezone || "Asia/Dhaka", accountStatus: "Active", emailNotifications: data.email_notifications,
      loginAlerts: data.login_alerts, securityAlerts: data.security_alerts, watchlistPrivacy: data.watchlist_privacy,
      profileVisibility: data.profile_visibility, onlineStatus: data.online_status, showActivity: data.show_activity,
      recommendations: data.recommendations, adultFilter: data.adult_filter, dataSaving: data.data_saving
    };
  }

  async function uploadAvatar(file, userId) {
    const supabase = await client();
    if (!supabase || !file) return null;
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) throw new Error("Avatar must be JPG, PNG, WEBP or GIF.");
    if (file.size > 2 * 1024 * 1024) throw new Error("Avatar must be 2 MB or smaller.");
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: false, contentType: file.type });
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    return data.publicUrl;
  }

  async function save() {
    const data = collect();
    localStorage.setItem(KEY, JSON.stringify(data));
    const supabase = await client();
    if (!supabase) return message("Saved locally. Supabase is not connected.", true);
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) return message("Saved locally. Please sign in to sync your profile.", true);
    const user = authData.user;
    const { error } = await supabase.from("profiles").upsert({
      id: user.id, display_name: data.profileName, username: data.username || null, avatar_url: data.avatar || null,
      bio: data.bio, phone: data.phone, dob: data.dob || null, gender: data.gender, country_code: data.country,
      city: data.city, language: data.language, timezone: data.timezone, email_notifications: data.emailNotifications,
      login_alerts: data.loginAlerts, security_alerts: data.securityAlerts, watchlist_privacy: data.watchlistPrivacy,
      profile_visibility: data.profileVisibility, online_status: data.onlineStatus, show_activity: data.showActivity,
      recommendations: data.recommendations, adult_filter: data.adultFilter, data_saving: data.dataSaving,
      updated_at: new Date().toISOString()
    });
    if (error) return message("Saved locally, but profile sync failed: " + error.message, true);
    if (data.profileName && data.profileName !== user.user_metadata?.name) await supabase.auth.updateUser({ data: { name: data.profileName } });
    if (data.email && data.email !== user.email) {
      const result = await supabase.auth.updateUser({ email: data.email });
      if (result.error) return message("Profile saved, but email change failed: " + result.error.message, true);
    }
    if (data.avatar) {
      const cached = { ...localUser(), name: data.profileName, avatar: data.avatar, email: data.email };
      localStorage.setItem("ULMFlix_current_user", JSON.stringify(cached));
      localStorage.setItem("ULMFlix_user", JSON.stringify(cached));
    }
    message("Settings saved to Supabase.");
  }

  document.addEventListener("DOMContentLoaded", async () => {
    populate(readLocal());
    try { const remote = await loadRemote(); if (remote) { localStorage.setItem(KEY, JSON.stringify(remote)); populate(remote); } }
    catch (e) { console.warn("Profile sync load failed", e); }

    $("saveSettings")?.addEventListener("click", async () => {
      try { await save(); } catch (e) { console.error(e); message(e.message || "Could not save settings.", true); }
    });
    $("reloadSettings")?.addEventListener("click", () => populate(readLocal()));
    $("clearHistory")?.addEventListener("click", async () => {
      if (!confirm("Clear your watch history?")) return;
      localStorage.removeItem("ULMFlix_watch_history");
      const supabase = await client();
      const { data: { user } = {} } = await supabase?.auth?.getUser?.() || {};
      if (supabase && user) await supabase.from("watch_progress").delete().eq("user_id", user.id);
      message("Watch history cleared.");
    });
    $("resetAccount")?.addEventListener("click", () => { if (confirm("Reset local settings?")) { localStorage.setItem(KEY, JSON.stringify(defaults)); populate(defaults); message("Local settings reset."); } });
    $("deleteAccount")?.addEventListener("click", () => { [KEY,"ULMFlix_watchlist","ULMFlix_watch_history","ULMFlix_user","ULMFlix_current_user"].forEach(k=>localStorage.removeItem(k)); location.href="login.html"; });
    $("avatarFile")?.addEventListener("change", async e => {
      try {
        const supabase = await client(); const { data: { user } } = await supabase.auth.getUser();
        const url = await uploadAvatar(e.target.files?.[0], user.id); if (url) { setValue("avatar", url); await save(); }
      } catch (err) { message(err.message || "Avatar upload failed.", true); }
    });
  });
})();
