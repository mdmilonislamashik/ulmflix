# ULMFlix — Reworked Edition

This ZIP has been cleaned up and reworked so the front-end is consistent and usable without requiring a backend just to preview the interface.

## Main fixes
- Added a shared responsive **3-dot menu** on all main pages.
- Menu contains: Home, Movies, Search, Watchlist, Profile, Settings, Log out.
- Menu closes on outside click and `Esc`.
- Fixed the broken `SFAuth` login/register references.
- Added a working local demo authentication flow.
- Rebuilt movie details as a real page instead of a modal-only layout.
- Fixed watchlist rendering and save/remove behavior.
- Added graceful demo movie data when no TMDB key is configured.
- Added safer API error handling.
- Removed the exposed `.env` file and private/duplicate Supabase client file from the public ZIP.
- Removed stale backup files from the main build.
- Improved responsive layout, accessibility labels, focus-friendly controls, and mobile navigation.
- Legal video player remains limited to user-provided/licensed video URLs.

## Live TMDB data
Open `js/config.js` and set:

```js
TMDB_API_KEY: "YOUR_TMDB_API_KEY"
```

The demo catalog still works when the key is empty.

For a production deployment, do not expose private API/database secrets in browser JavaScript. Put private credentials behind a server-side API.

## Run
Use any local static server, then open `index.html`.

Examples:
- VS Code Live Server
- `python -m http.server`
- Any static hosting provider

## Important
TMDB is used for movie metadata/posters/trailers when configured. It does not provide copyrighted full movies. Use only video sources you own or are licensed to distribute.

## Feature Pack v4
The project now includes a Netflix-inspired feature layer: multi-profile support (up to 5), avatars, Kids Profile, profile PIN, language/audio/subtitle preferences, maturity restriction, autoplay control, blocked-title controls, viewing activity, and homepage discovery rows for Trending, New Releases, Top 10, Recommended, Recently Added and ULMFlix Originals. The admin area also includes a management hub covering movies, series, seasons, episodes, genres, users, subscriptions, payments, watch history, analytics, banners, featured/trending content, notifications, admin profile/settings and site settings.

This static demo persists profile/preferences/history data in LocalStorage. Real authentication, payment processing, offline downloads, DRM, and server-side parental enforcement require a backend and appropriate licensed infrastructure.

## Production-ready upgrade (2026-08-06)

This package now includes a Supabase-backed production layer for:

- Google OAuth callback handling based on the current deployment origin
- Email verification and password reset/update flows
- Secure account deletion through a server-only Supabase service-role API
- Supabase profile sync and avatar uploads
- Movies, series, seasons and episodes tables
- Admin-protected movie CRUD and poster/video upload
- Private Supabase media URLs for premium movie playback
- Favorites, Watch Later and Continue Watching progress sync
- Supabase reviews and analytics events
- Subscription plans and Stripe checkout/webhook/customer portal
- SSLCommerz hosted checkout + IPN validation adapter
- bKash tokenized checkout adapter
- SEO canonical metadata, sitemap/robots, OpenGraph basics and optional GA4
- Security headers and RLS policies

Before production launch, configure the external provider credentials and Google/Supabase OAuth settings described in `PRODUCTION_SETUP.md` and `PAYMENTS_SETUP.md`.
