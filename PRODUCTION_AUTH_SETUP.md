# ULMFlix Production Auth Setup

The project is prepared to use the production Vercel domain:

https://streamflix-pro-puce.vercel.app

## Supabase Authentication

In Supabase Dashboard → Authentication → URL Configuration:

Site URL:
https://streamflix-pro-puce.vercel.app

Add Redirect URLs:
https://streamflix-pro-puce.vercel.app/auth/callback
https://streamflix-pro-puce.vercel.app/
https://streamflix-pro-puce.vercel.app/login

For Google Provider, keep the Supabase callback URI shown by Supabase, normally:
https://wihoiwjognjsaqlitfuz.supabase.co/auth/v1/callback

Do not use 127.0.0.1 or localhost for production OAuth.

## What was fixed

- Email/password login redirects to /dashboard.
- Registration redirects to /dashboard when a session is available.
- Email verification redirects through /auth/callback.
- Google OAuth redirects through /auth/callback on the production domain.
- Auth callback restores the Supabase session and then redirects safely.
- Session persistence uses the Supabase client.
- Logout clears the Supabase session and local cached user.
- New users get a profile automatically through the included database trigger.
- Protected pages load the Supabase client before auth.js.
- /login, /register, /profile, /dashboard, /settings and /auth/callback have Vercel rewrites.
- Supabase URL/key configuration was unified across the frontend.
- Localhost/127.0.0.1 URLs are not hardcoded into the auth flow.
- Real .env files are ignored by Git.

## Important

This ZIP cannot change your Supabase Dashboard or Vercel Environment Variables automatically. After deploying, configure the URLs above in Supabase and add any required server-side secrets in Vercel Environment Variables.

Never put SUPABASE_SERVICE_ROLE_KEY or Stripe secret keys in browser JavaScript.
