(function () {
  "use strict";

  const SESSION_KEY = "ULMFlix_current_user";
  function appOrigin() {
    const configured = window.ULMFLIX_CONFIG?.PRODUCTION_ORIGIN;
    if (configured && !configured.includes("your-domain")) return configured.replace(/\/$/, "");
    return window.location.origin;
  }

  function getClient() {
    if (!window.SF_SUPABASE) {
      console.error("ULMFlix: Supabase client is not available.");
      return null;
    }
    return window.SF_SUPABASE;
  }

  function showMessage(message, type = "info") {
    const el =
      document.getElementById("authMessage") ||
      document.getElementById("message");
    if (!el) return;
    el.textContent = message;
    el.className = `auth-message ${type}`;
  }

  function safeRedirect(value, fallback = "/dashboard") {
    if (!value) return fallback;
    try {
      const decoded = decodeURIComponent(value);
      if (!decoded.startsWith("/") || decoded.startsWith("//")) return fallback;
      return decoded;
    } catch {
      return fallback;
    }
  }

  async function syncLocalUser(user) {
    if (!user) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }

    const supabase = getClient();
    let profile = null;

    if (supabase) {
      const { data } = await supabase
        .from("profiles")
        .select("id,display_name,avatar_url,role,country_code,currency_code,onboarding_complete")
        .eq("id", user.id)
        .maybeSingle();

      profile = data || null;
    }

    const cached = {
      id: user.id,
      email: user.email || "",
      name:
        profile?.display_name ||
        user.user_metadata?.name ||
        user.user_metadata?.full_name ||
        (user.email || "").split("@")[0],
      avatar:
        profile?.avatar_url ||
        user.user_metadata?.avatar_url ||
        user.user_metadata?.picture ||
        "",
      role: profile?.role || "user",
      currency_code: profile?.currency_code || "USD",
      onboarding_complete: Boolean(profile?.onboarding_complete),
      isAdmin: profile?.role === "admin"
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(cached));
    localStorage.setItem("ULMFlix_user", JSON.stringify(cached));
    return cached;
  }

  async function current() {
    const supabase = getClient();
    if (!supabase) return null;

    const {
      data: { user },
      error
    } = await supabase.auth.getUser();

    if (error || !user) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }

    await syncLocalUser(user);
    return user;
  }

  async function register(email, password, name = "") {
    const supabase = getClient();
    if (!supabase) return { ok: false, message: "Supabase is not connected." };

    email = String(email || "").trim().toLowerCase();
    name = String(name || "").trim();

    if (!email) return { ok: false, message: "Please enter your email." };
    if (typeof password !== "string" || password.length < 6) {
      return { ok: false, message: "Password must contain at least 6 characters." };
    }

    const callback =
      `${appOrigin()}/auth/callback?redirect=${encodeURIComponent("/dashboard")}`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || email.split("@")[0],
          currency_code: "USD"
        },
        emailRedirectTo: callback
      }
    });

    if (error) return { ok: false, message: error.message };
    if (!data.user) return { ok: false, message: "Account could not be created." };

    if (data.session) {
      await syncLocalUser(data.user);
      return {
        ok: true,
        user: data.user,
        authenticated: true,
        message: "Account created successfully."
      };
    }

    return {
      ok: true,
      user: data.user,
      authenticated: false,
      message: "Account created. Please check your email to verify your account."
    };
  }

  async function login(email, password) {
    const supabase = getClient();
    if (!supabase) return { ok: false, message: "Supabase is not connected." };

    email = String(email || "").trim().toLowerCase();
    if (!email || !password) {
      return { ok: false, message: "Please enter email and password." };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) return { ok: false, message: error.message };

    await syncLocalUser(data.user);
    return {
      ok: true,
      user: data.user,
      message: "Login successful. Welcome to ULMFlix!"
    };
  }

  async function googleLogin(target = "/dashboard") {
    const supabase = getClient();
    if (!supabase) {
      showMessage("Supabase is not connected.", "error");
      return { ok: false };
    }

    const destination = safeRedirect(target, "/dashboard");
    const callback = `${appOrigin()}/auth/callback?redirect=${encodeURIComponent(destination)}`;

    showMessage("Connecting to Google...", "info");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callback,
        skipBrowserRedirect: false,
        queryParams: {
          access_type: "offline",
          prompt: "select_account"
        }
      }
    });

    if (error) {
      console.error("Google login error:", error);
      showMessage(error.message, "error");
      return { ok: false, error };
    }

    return { ok: true };
  }


  async function resetPassword(email) {
    const supabase = getClient();
    if (!supabase) return { ok: false, message: "Supabase is not connected." };
    email = String(email || "").trim().toLowerCase();
    if (!email) return { ok: false, message: "Please enter your email." };
    const redirectTo = `${appOrigin()}/reset-password.html`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) return { ok: false, message: error.message };
    return { ok: true, message: "Password reset email sent. Check your inbox." };
  }

  async function updatePassword(password) {
    const supabase = getClient();
    if (!supabase) return { ok: false, message: "Supabase is not connected." };
    if (!password || password.length < 8) {
      return { ok: false, message: "Password must contain at least 8 characters." };
    }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { ok: false, message: error.message };
    return { ok: true, message: "Password updated successfully." };
  }

  async function deleteAccount() {
    const supabase = getClient();
    if (!supabase) return { ok: false, message: "Supabase is not connected." };
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return { ok: false, message: "Please sign in again." };
    const response = await fetch("/api/account-delete", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session.access_token}` }
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) return { ok: false, message: result.error || "Could not delete account." };
    await supabase.auth.signOut();
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem("ULMFlix_user");
    return { ok: true, message: "Account deleted." };
  }

  async function logout() {
    const supabase = getClient();
    if (!supabase) return false;

    const { error } = await supabase.auth.signOut();
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem("ULMFlix_user");
    return !error;
  }

  async function protect(options = {}) {
    const user = await current();

    if (!user && options.redirect !== false) {
      const currentPage =
        location.pathname + location.search + location.hash;

      const redirect = encodeURIComponent(
        currentPage.startsWith("/") ? currentPage : "/dashboard"
      );

      location.replace(`/login?redirect=${redirect}`);
    }

    return user;
  }

  window.SFAuth = {
    current,
    login,
    register,
    googleLogin,
    resetPassword,
    updatePassword,
    deleteAccount,
    logout,
    protect,
    syncLocalUser,
    safeRedirect
  };

  window.SFGetCurrentUser = current;
  window.SFLogout = logout;
  window.SFGoogleLogin = googleLogin;

  document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    loginForm?.addEventListener("submit", async (event) => {
      event.preventDefault();

      const email = document.getElementById("email")?.value;
      const password = document.getElementById("password")?.value;
      const result = await login(email, password);

      showMessage(result.message, result.ok ? "success" : "error");

      if (result.ok) {
        const redirect = safeRedirect(
          new URLSearchParams(location.search).get("redirect"),
          "/dashboard"
        );
        setTimeout(() => location.replace(redirect), 350);
      }
    });

    const registerForm = document.getElementById("registerForm");
    registerForm?.addEventListener("submit", async (event) => {
      event.preventDefault();

      const email = document.getElementById("email")?.value;
      const password = document.getElementById("password")?.value;
      const confirmPassword = document.getElementById("confirmPassword")?.value;

      if (confirmPassword !== undefined && password !== confirmPassword) {
        showMessage("Passwords do not match.", "error");
        return;
      }

      const name = document.getElementById("name")?.value || "";
      const result = await register(email, password, name);

      showMessage(result.message, result.ok ? "success" : "error");

      if (result.ok && result.authenticated) {
        setTimeout(() => location.replace("/dashboard"), 500);
      }
    });

    const forgotPasswordForm = document.getElementById("forgotPasswordForm");
    forgotPasswordForm?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const result = await resetPassword(document.getElementById("resetEmail")?.value);
      showMessage(result.message, result.ok ? "success" : "error");
    });

    const updatePasswordForm = document.getElementById("updatePasswordForm");
    updatePasswordForm?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const password = document.getElementById("newPassword")?.value || "";
      const confirm = document.getElementById("newPasswordConfirm")?.value || "";
      if (password !== confirm) return showMessage("Passwords do not match.", "error");
      const result = await updatePassword(password);
      showMessage(result.message, result.ok ? "success" : "error");
      if (result.ok) updatePasswordForm.reset();
    });

    const deleteAccountBtn = document.getElementById("deleteAccountBtn");
    deleteAccountBtn?.addEventListener("click", async () => {
      if (!confirm("Delete your account permanently? This cannot be undone.")) return;
      const result = await deleteAccount();
      showMessage(result.message, result.ok ? "success" : "error");
      if (result.ok) setTimeout(() => location.replace("/"), 500);
    });

    const googleLoginBtn = document.getElementById("googleLoginBtn");
    const googleRegisterBtn = document.getElementById("googleRegisterBtn");

    googleLoginBtn?.addEventListener("click", () => {
      const target = new URLSearchParams(location.search).get("redirect") || "/dashboard";
      googleLogin(target);
    });

    googleRegisterBtn?.addEventListener("click", () => {
      googleLogin("/dashboard");
    });
  });
})();


