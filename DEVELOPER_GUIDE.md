# ULMFlix Developer Guide

## Architecture
The project is intentionally separated into pages, stylesheets and JavaScript modules.

## TMDB
Use TMDB only for metadata discovery. Read TMDB's current API terms before production deployment.

## Video
The `watch.html` player accepts a direct legal video URL. For HLS/DASH production playback, integrate a suitable licensed player and backend.

## Authentication
The included authentication is a browser-only demo. It is not secure. Use Supabase Auth, Firebase Auth, Auth0 or your own secure server for production.

## Database
For production, store users, watchlists, video sources and admin data in a database.

## Security
Never expose private API keys or service credentials in production frontend JavaScript.

## Deployment
The frontend can be deployed to Vercel, Netlify or any static host. If using a backend, deploy API routes separately or use a full-stack platform.

## Automatic Updates
For automatic metadata synchronization, create a scheduled backend job that queries TMDB and stores normalized metadata in your database.

## Legal
Only distribute content you own or have permission to stream.
