(async function () {
"use strict";

const fallback = "/dashboard";

const url = new URL(window.location.href);
const params = url.searchParams;
const redirectParam = params.get("redirect");


function safeRedirect(value) {

  if (!value) return fallback;

  try {

    const decoded = decodeURIComponent(value);

    if (!decoded.startsWith("/") || decoded.startsWith("//")) {
      return fallback;
    }

    return decoded;

  } catch {

    return fallback;

  }

}


function showMessage(text, isError = false) {

  const message = document.getElementById("callbackMessage");

  if (!message) return;

  message.textContent = text;

  message.classList.toggle("error", isError);

}


const destination = safeRedirect(redirectParam);


try {


const supabase = window.SF_SUPABASE;


if (!supabase) {

  throw new Error(
    "Supabase client is not available."
  );

}


showMessage(
  "Completing secure authentication..."
);


const code = params.get("code");


if (!code) {

  throw new Error(
    "Authentication code was not found. Please start Google login again."
  );

}


console.log(
  "OAuth authorization code detected."
);



const { data, error } =
await supabase.auth.exchangeCodeForSession(code);



if (error) {

  console.error(
    "PKCE exchange error:",
    error
  );

  throw error;

}



if (!data?.session?.user) {

  const sessionResult =
  await supabase.auth.getSession();


  if (!sessionResult.data.session) {

    throw new Error(
      "Authentication session was not found. Please login again."
    );

  }

}



const user =
data.session.user;



console.log(
  "ULMFlix authentication successful:",
  user.email
);



if (
 window.SFAuth &&
 window.SFAuth.syncLocalUser
) {

 await window.SFAuth.syncLocalUser(user);

}



showMessage(
 "Signed in successfully. Redirecting..."
);



window.history.replaceState(
 {},
 document.title,
 "/auth/callback"
);



setTimeout(() => {

 window.location.replace(destination);

}, 500);



} catch(error) {


console.error(
 "ULMFlix auth callback error:",
 error
);



showMessage(

 error?.message ||
 "Google authentication failed. Please try again.",

 true

);


}

})();