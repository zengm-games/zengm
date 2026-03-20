# BasketballGM Agent Chat (Phase 1)

This feature uses a Vercel serverless function to proxy requests to Google Gemini. The API key must never be committed to the repository.

## Vercel project setup

1. Create a project in the [Vercel dashboard](https://vercel.com/) and import this Git repository (or link the repo you push this branch to).
2. Configure the project:
   - **Build Command:** `pnpm run build` (matches [`vercel.json`](../vercel.json)).
   - **Output Directory:** `build` (static assets produced by the game build).
   - **Install Command:** `pnpm install`.
3. Set environment variables in **Project Settings → Environment Variables**:
   - `GOOGLE_GENERATIVE_AI_API_KEY` — your [Google AI Studio](https://aistudio.google.com/apikey) API key (Production / Preview / Development as needed).

## Local development with `vercel dev`

1. Install the [Vercel CLI](https://vercel.com/docs/cli) globally if you do not have it: `npm i -g vercel`.
2. From the repo root, run `pnpm run dev:vercel` (see [`package.json`](../package.json)). This serves the app and exposes `/api/chat` with the same env as Vercel when you run `vercel link` and pull env, or set `GOOGLE_GENERATIVE_AI_API_KEY` in a local `.env` file (do not commit `.env`; it should be gitignored).

## Security

- Never paste real API keys into source code or docs.
- Rotate keys if they are ever exposed.
