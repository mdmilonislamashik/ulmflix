# ULMFlix Production Setup

## 1. Supabase

1. Run the existing migrations in order, then run `supabase/migrations/20260806000000_production_ott.sql`.
2. In Supabase Authentication > URL Configuration, set the Site URL to your real site origin and add the exact callback URL:
   `https://YOUR-DOMAIN/auth/callback`
3. Enable Email provider and Google provider.
4. For Google, create a Web OAuth client in Google Cloud and put the Supabase-provided Google callback URL into the Google Authorized redirect URIs. Put the Google client ID/secret into Supabase Auth Provider > Google. Do not put the Google client secret in this repository.
5. Create/verify Storage buckets `avatars` and `media` if the migration did not create them.

## 2. First admin

Create your account normally, then run the single-user role update in `supabase/bootstrap_admin.sql` from the Supabase SQL editor. Never expose the service-role key to the browser.

## 3. Vercel server environment

Copy `.env.example` to your Vercel Environment Variables and fill the real values. Required server variables include `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` and `APP_URL`. Add payment variables only for gateways you have merchant accounts for.

## 4. Google OAuth testing

Test both the production hostname and the exact redirect URI. The frontend now derives its callback from `window.location.origin`, so moving from a Vercel preview/custom domain no longer requires hardcoding a callback host in `js/auth.js`.

## 5. Content

Admin > Manage Movies can create, edit, publish and delete catalog records. Poster/video files can be uploaded to Supabase Storage from the admin UI. Only authenticated admin/editor users can access the admin UI and only admins can write catalog records through the protected API.

## 6. Security

The service-role key is used only by Vercel API functions. RLS protects user libraries, profiles, subscriptions, reviews and analytics. Security headers are defined in `vercel.json`.

## 7. SEO / Analytics

Update the canonical host in `sitemap.xml` and any deployment-specific metadata if your production domain differs from `ulmflix.vercel.app`. Set `GA_MEASUREMENT_ID` in `js/config.js` only if you want GA4 enabled.
