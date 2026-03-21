# NotebookLM Podcast — Design Document

**Date:** 2026-03-21
**Branch:** notebooklm
**Sport:** Basketball (initial)

---

## Overview

After every basketball game, generate an "Inside the NBA"-style audio podcast hosted by Ernie Johnson, Charles Barkley, and Shaq. The podcast discusses the box score, notable performances, standings implications, and playoff context. Audio is stored in IndexedDB so the user can replay any game's podcast from the game log.

---

## Architecture

```
GAME_END (writeGameStats.ts, worker)
  │
  ├─ [only user's team, basketball]
  │
  ▼
generatePodcast(gameStats) — src/worker/core/game/generatePodcast.ts
  │
  ├─ Step 1: fetch POST /api/podcast  { gameInput }
  │           ↓
  │     api/podcast.ts (Vercel serverless)
  │       ├─ generateText via Vercel AI Gateway → google/gemini-2.5-flash
  │       │   prompt: "Inside the NBA" script with Ernie / Charles / Shaq speaker labels
  │       └─ fetch Gemini TTS REST API (gemini-2.5-flash-preview-tts)
  │           multiSpeakerVoiceConfig: Ernie=Charon, Charles=Fenrir, Shaq=Orus
  │           → base64 WAV audio
  │
  └─ Store PodcastRecord { gid, audioData, mimeType, createdAt, gameInfo }
     in idb.league "podcasts" store (keyed by gid)

UI (LiveGame.tsx)
  └─ gameOver → toWorker("main", "getPodcast", { gid })
               → render <GamePodcast> audio player (HTML5 <audio>)
```

---

## Data Model

```typescript
type PodcastRecord = {
  gid: number;          // key — matches game gid
  audioData: string;    // base64-encoded WAV
  mimeType: string;     // "audio/wav"
  createdAt: number;    // Date.now()
  gameInfo: {
    homeTeam: string;
    awayTeam: string;
    homeScore: number;
    awayScore: number;
    season: number;
    playoffs: boolean;
  };
};
```

---

## Prompt Design

The serverless function builds a structured prompt from box score data:

```
You are producing an "Inside the NBA" studio show podcast for a basketball simulation game.
The hosts are:
- Ernie: Ernie Johnson — professional host, sets up topics, asks pointed questions
- Charles: Charles Barkley — direct, opinionated, pulls no punches, uses Southern expressions
- Shaq: Shaquille O'Neal — big personality, jokes around, occasionally serious on big plays

Generate a 2-3 minute podcast script (no stage directions, just dialogue) discussing:
1. The final score and dominant storyline
2. The best individual performance
3. Standings/playoff implications
4. A prediction or hot take from Charles

Game data: [JSON box score summary]

Use EXACTLY this speaker label format on each line:
Ernie: ...
Charles: ...
Shaq: ...
```

---

## IndexedDB Migration

- Bump `LEAGUE_DATABASE_VERSION` from 69 → 70
- Add `podcasts` store in `create()` and `migrate()` with `keyPath: "gid"`

---

## Environment Variables

| Variable | Purpose |
|---|---|
| `AI_GATEWAY_API_KEY` | Vercel AI Gateway key (routes to Google) |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Direct Google AI key (fallback) |

The serverless function checks `AI_GATEWAY_API_KEY` first; falls back to `GOOGLE_GENERATIVE_AI_API_KEY`.

---

## Error Handling

- If podcast generation fails, the game continues normally (fire-and-forget from the game's perspective)
- Failed podcasts are not stored; the UI gracefully shows nothing if no podcast exists for a game
- `api/podcast.ts` returns 500 with JSON error on any failure

---

## UI

`<GamePodcast gid={gid} />` — shown below the box score in `LiveGame.tsx` when `gameOver === true`:
- Fetches podcast on mount via `toWorker`
- While loading: shows "Generating podcast..." spinner
- On ready: renders HTML5 `<audio controls>` with source from blob URL
- On no podcast: renders nothing
