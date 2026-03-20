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
2. From the repo root, run `pnpm run dev:vercel` (see [`package.json`](../package.json)). Vercel starts the game dev server using [`devCommand` in `vercel.json`](../vercel.json) (`pnpm run dev`) and wires `/api/chat` locally. Use `vercel link` and pull env, or set `GOOGLE_GENERATIVE_AI_API_KEY` in `.env.local` (gitignored).
3. **Do not** run a second `pnpm dev` in another terminal unless you know you need it — it grabs port 3000 and confuses `vercel dev` (“port already in use” / failed server detection). For the usual Phase 1 flow, **only** `pnpm run dev:vercel` is enough.

## Security

- Never paste real API keys into source code or docs.
- Rotate keys if they are ever exposed.

## Phase 1 manual verification (E2E)

1. Install dependencies: `pnpm install`.
2. Configure `GOOGLE_GENERATIVE_AI_API_KEY` locally (e.g. `vercel env pull .env.local` after linking the project, or create `.env.local` by hand). `.env*` files are gitignored.
3. Build the static client: `pnpm run build` (optional if you only use `vercel dev`, which runs `pnpm dev` and rebuilds on change).
4. Run the full stack locally: `pnpm run dev:vercel` (requires the [Vercel CLI](https://vercel.com/docs/cli)). Alternatively, deploy the branch to Vercel and test on the preview URL.
5. Open **Basketball GM**, load or create a league, and navigate in-season so standings exist.
6. Open the chat via the **AI GM** button in the title bar or the floating **AI** button (bottom-right).
7. Ask: **What is my team's current record?**
8. **Pass criteria:** The model uses the **getStandings** tool (tool rows may appear in the panel), and the reply matches your team's **W–L** (and placement) versus the in-game **Standings** page.
