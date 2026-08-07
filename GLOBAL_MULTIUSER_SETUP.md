# ULMFlix Global Multi-User Upgrade

## What is new
- Each signed-in Supabase user gets a private profile.
- Country, currency, skills, available platforms and income target are stored per user.
- Global Income Dashboard personalizes income ideas.
- Local data is kept in the browser; online data is stored in Supabase.
- Income plan local storage is now scoped by user ID to prevent browser-account mixing.
- Supabase Row Level Security protects profile and income-plan rows.

## Production setup
1. Run `supabase/schema.sql` in the Supabase SQL editor.
2. Enable Email/Password (and/or your chosen OAuth provider) in Supabase Auth.
3. Confirm `js/supabase-config.js` contains the project's publishable key.
4. Do not expose any Supabase service-role key in frontend files.
5. Deploy behind HTTPS.

## User flow
Register/Login -> Profile -> Global Income Dashboard -> choose country/currency/skills/platforms/target -> save -> personalized recommendations -> Income Center.

## Security note
Frontend local storage is not a security boundary. Sensitive or authoritative user data must be protected by Supabase Auth + RLS. The schema included here applies per-user policies to profiles and income_plans.
