# ULMFlix Owner Workspace

## Profile → Admin Panel
The Profile page contains the Owner Control Center. For the local demo build, use “Enable Owner Workspace on this browser” once. In production, replace this local flag with Supabase Auth + a server-side admin role/RLS policy.

## Files & Pages
The Admin → Files & Pages workspace uses IndexedDB in the browser. It supports:
- Create folders and nested folders
- Upload multiple files
- Download files
- Delete files/folders
- Create HTML pages
- Download generated pages
- Drag-and-drop upload

This is browser-local storage. For multi-device cloud storage, connect Supabase Storage and database tables in production.


## Income Center
The new Income Center is available from Profile and Admin. It contains 170 monetization ideas across ads, affiliate commerce, creator content, digital products, services, memberships, marketplace, B2B, community and other models. Users can search/filter, select income streams, set monthly targets, export/import plans, and keep a fast local copy in LocalStorage + IndexedDB.

Cloud sync uses the `income_plans` Supabase table with Row Level Security and requires a signed-in Supabase user. Run the SQL in `supabase/schema.sql` before enabling cloud sync.

## Performance
A small service worker caches the core ULMFlix shell for repeat visits. The Income Center uses paginated rendering (30 cards/page), document fragments, local-first persistence and asynchronous IndexedDB writes.
