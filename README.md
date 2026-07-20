# SaveState

A multimedia tracking log and personal library app for books, movies, TV, and podcasts - built around the idea of a "Save State": a private checkpoint of notes for whatever you're in the middle of, plus a separate public review you can choose to share.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Copy `.env.example` to a new file called `.env.local`, and fill in:
   - `VITE_SUPABASE_URL` - your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` - your Supabase anon/public key
   - `TMDB_API_KEY` - your TMDB API key (used for movie/TV search)
3. Run the app:
   `npm run dev`

## Tech Stack

- React + TypeScript, built with Vite
- Tailwind CSS
- Supabase (Postgres database, auth, realtime sync)
- Express (`server.ts`) for local dev + TVMaze/TMDB API proxying
