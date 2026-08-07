# ULMFlix — Business-Ready Setup

This build is prepared as a **legal movie discovery/review platform**, not a repository for unauthorized movie/series files.

## Included
- Premium monthly/yearly checkout integration points
- Stripe serverless checkout + customer portal + webhook templates
- Supabase production schema for profiles, subscriptions, payments, reviews, blog posts, ads and revenue events
- Member dashboard
- Review publishing UI
- Admin revenue dashboard
- Admin ad placement control
- Editorial/guides area
- SEO metadata, JSON-LD, sitemap and web manifest
- Responsive/mobile-first business UI
- AdSense configuration and ads.txt support

## Go live
1. Create/verify your domain and HTTPS hosting.
2. Run `supabase/schema.sql` in your Supabase SQL editor.
3. Create Stripe Products/Prices and put the real Price IDs into environment variables.
4. Deploy `/api` as serverless functions and set variables from `.env.example`.
5. Add your Stripe webhook URL and webhook secret.
6. Put your approved AdSense publisher ID into `js/config.js`; set `ADSENSE_ENABLED: true` only after approval.
7. Replace `YOUR-DOMAIN.example` in `sitemap.xml` and the JSON-LD target with your real domain.
8. Replace placeholder legal/business details in Privacy, Terms, DMCA and Contact pages with your real operator information.

### Important
Never place Stripe secret keys or Supabase service-role keys in browser JavaScript. Only public Supabase publishable keys may be exposed client-side.
