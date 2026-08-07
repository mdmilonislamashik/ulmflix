# ULMFlix Income Center

ULMFlix now includes a global-first Income Center with 170 monetization models. These are opportunities/ideas, not guaranteed earnings; availability and eligibility vary by country, provider, tax law, platform policy and content rights.

## Included
- 170 income models in 10 categories
- Search and category filters
- 30-card pagination for fast rendering
- Add income streams to a personal plan
- Monthly target and status tracking
- Export/import JSON plan backups
- LocalStorage cache + IndexedDB persistence
- Secure Supabase cloud sync when a user is authenticated
- Row Level Security schema for `income_plans`
- Profile -> Income Center entry
- Admin -> Income Center entry
- Lightweight service-worker shell caching for repeat visits

## Cloud setup
1. Create/confirm a Supabase Auth flow for your production users.
2. Run the `income_plans` SQL at the end of `supabase/schema.sql`.
3. Keep Row Level Security enabled.
4. Make sure the frontend uses only the Supabase publishable key.
5. Do not put service-role keys or payment secrets in frontend code.

## Performance approach
The Income Center is local-first. The initial UI is small, the 170+ cards are paginated, rendering uses `DocumentFragment`, writes are asynchronous to IndexedDB, and a service worker caches the core shell after the first successful visit. Cloud sync is opt-in/manual so the site remains responsive even when the network is slow.
