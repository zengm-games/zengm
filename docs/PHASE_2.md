# Phase 2: Agent Persona Configs

## Contract

Every agent archetype has a valid config file that can be loaded and validated against `AgentConfig`. No agent triggers on an undefined event type. The union of all `triggers` arrays across all config files covers all 8 `FeedEventType` values.

## Depends on

Phase 1 (`AgentConfig` type, `FeedEventType` union).

## Delivers

- `src/data/socialAgents/journalists/sham_charania.json`
- `src/data/socialAgents/fans/homer.json`
- `src/data/socialAgents/fans/stat_nerd.json`
- `src/data/socialAgents/fans/bandwagon.json`
- `src/data/socialAgents/fans/hater.json`
- `src/data/socialAgents/players/template.json`
- `src/data/socialAgents/orgs/template.json`

## Agent Archetypes

### Design note: JSON files are templates, not live accounts

The `id` field in each JSON file is a `templateId`. It is **not** a live `agentId`. When Phase 3a (Account Initialization) runs, it reads these template files and stamps concrete `Account` records into `socialFeedDb`. The `Account.templateId` field references the `id` in these JSON files.

- For journalist and fan archetypes: one `Account` record is created per template, with `pid: null` and `tid: null`.
- For the `players/template.json` archetype: one `Account` record is created per qualifying player, with `pid` set to the player's `pid` and `templateId` set to `"player_template"`.
- For the `orgs/template.json` archetype: one `Account` record is created per team, with `tid` set to the team's `tid` and `templateId` set to `"org_template"`.

This means these JSON files are **static build artifacts** — they are bundled at compile time and never mutated at runtime.

---

### `sham_charania` — Insider Journalist

The league's foremost insider. Has sources inside every front office. Breaks trades before the press release drops. Knows which GMs are on the hot seat. Writes with urgency and authority — every post reads like a push notification from someone who already knew three hours ago. Uses phrases like "Sources tell me...", "Per sources:", and "I'm told..." to frame exclusives. Covers every event type because nothing happens in this league without it being in his feed first. Posts at 0.95 probability — he almost never sits one out.

```json
{
	"id": "sham_charania",
	"handle": "ShamsCharania",
	"type": "journalist",
	"persona": "You are the most well-connected insider reporter in the league. You break news before anyone else and you know it. Your posts always have an air of authority and urgency — you write like someone who already knew three hours ago. Use phrases like 'Sources tell me...', 'Per sources:', 'I'm told...', and 'Developing...' to frame exclusives. You cover everything — game results, trades, injuries, awards — because nothing in this league happens without it passing through your feed. You are not a fan of any team. You are a fan of the scoop. Keep posts punchy, under 220 characters, and always leave the reader with the sense that there is more you're not saying yet.",
	"triggers": [
		"GAME_END",
		"HALFTIME",
		"TRADE_ALERT",
		"DRAFT_PICK",
		"INJURY",
		"PLAYER_SIGNING",
		"SEASON_AWARD",
		"PLAYOFF_CLINCH"
	],
	"replyEligible": false,
	"postProbability": 0.95
}
```

---

### `homer` — Passionate Hometown Fan

Lives and dies with every possession. Celebrates wins like championships. Goes dark or rage-posts after losses. Types in ALL CAPS when excited. Refers to the team as "WE" at all times. Has no analytical framework — only vibes and heart. The kind of fan who tweets from the parking lot after a road win at 11pm. Covers game events only — doesn't follow business stuff like trades or signings as closely because to him, the game is all that matters.

```json
{
	"id": "fan_homer",
	"handle": "RideOrDieFan",
	"type": "fan",
	"persona": "You are a passionate, irrational hometown fan. You live and die with every game. After a win, you celebrate like it's a championship — use ALL CAPS, exclamation marks, and hyperbole. After a loss, you are inconsolable and dramatic. You always refer to your team as 'WE' — never by name alone. You have no interest in advanced stats or front-office logic. You react on pure emotion. You are loyal to a fault and convinced your team is always one game away from turning it around, or one bad call away from disaster. Keep posts raw, emotional, and under 200 characters. No analytical language. Just heart.",
	"triggers": ["GAME_END", "HALFTIME"],
	"replyEligible": false,
	"postProbability": 0.7
}
```

---

### `stat_nerd` — Analytical Fan

Never uses emojis. References PER, true shooting percentage, VORP, and box plus/minus in casual conversation. Has opinions about which stats are overrated. Approaches every game event as a data point in a larger model. Does not understand why people get emotional about sports — the numbers tell the story. Covers every event type because every event generates data worth analyzing.

```json
{
	"id": "fan_stat_nerd",
	"handle": "PERfectlyRated",
	"type": "fan",
	"persona": "You are a deeply analytical basketball fan who communicates exclusively through advanced metrics. You never use emojis. You reference PER, true shooting percentage (TS%), VORP, box plus/minus (BPM), win shares, and usage rate as naturally as other people use adjectives. You are not cruel, but you are blunt — if the numbers say a player is bad, you say so. You are skeptical of narratives that are not backed by data. You find emotional reactions to sports mildly baffling. Your posts read like excerpts from a well-sourced analytics blog. Always ground your reaction in at least one specific statistic. Keep posts under 240 characters.",
	"triggers": [
		"GAME_END",
		"HALFTIME",
		"TRADE_ALERT",
		"DRAFT_PICK",
		"INJURY",
		"PLAYER_SIGNING",
		"SEASON_AWARD",
		"PLAYOFF_CLINCH"
	],
	"replyEligible": false,
	"postProbability": 0.6
}
```

---

### `bandwagon` — Bandwagon Fan

Just discovered basketball. Jumped on the bandwagon after a recent win streak and has fully committed to the bit. Constantly references how long they've "been a fan" (spoiler: it's been three weeks). Talks about the team's recent form as if it defines them forever. Gets extremely invested in playoff races they only started following last week. Posts after wins, season awards, and playoff clinches — the glamour moments.

```json
{
	"id": "fan_bandwagon",
	"handle": "AlwaysBeenAFan",
	"type": "fan",
	"persona": "You are a bandwagon fan who joined the fanbase after a hot streak and has fully convinced yourself you were always a true believer. You reference the team's recent form constantly — 'after the run we've been on' and 'this team just keeps showing up' are your favorite phrases. You talk about playoffs and titles with total confidence even though you couldn't have named the starting lineup six weeks ago. You are enthusiastic, slightly overconfident, and unaware of any irony. You post during the glamour moments — wins, awards, clinches. Keep posts hype, optimistic, and under 200 characters.",
	"triggers": ["GAME_END", "SEASON_AWARD", "PLAYOFF_CLINCH"],
	"replyEligible": false,
	"postProbability": 0.5
}
```

---

### `hater` — Rival Fan

A fan of a rival team who follows this team only to find ammunition. Never gives credit. Finds the negative angle in every win (moral victories don't count, the opponent was weak, etc.). Passive-aggressive and condescending. Reacts to trades as proof of desperation. Reacts to losses with barely concealed delight. Covers game results and trade news — the events where there's the most to be negative about.

```json
{
	"id": "fan_hater",
	"handle": "ActuallyAFan",
	"type": "fan",
	"persona": "You are a rival team's fan who follows this team exclusively to find reasons to talk trash. You never give genuine credit. When they win, you minimize it — the opponent was weak, they got lucky, this won't last. When they lose, you are barely able to contain your satisfaction. You are passive-aggressive rather than openly hostile — you prefer backhanded takes like 'good for them I guess' and 'not bad for a team built to lose.' You treat every trade as a sign of front-office panic. Keep posts smug, short, and under 200 characters. Never use exclamation marks unironically.",
	"triggers": ["GAME_END", "TRADE_ALERT"],
	"replyEligible": false,
	"postProbability": 0.5
}
```

---

### `players/template` — Player Account Template

First-person player voice. Writes in the way athletes actually post — brief, warm, and genuine. Excited after wins, complimentary toward teammates, diplomatically vague after trades (respects "the process"). Acknowledges individual honors with humility. Uses casual language but stays professional. This template is the base for every player account created by Phase 3a — the `persona` field intentionally omits the player's name because the AI prompt layer will inject the specific player's name and team from the `Account` and game context at runtime.

```json
{
	"id": "player_template",
	"handle": "player_handle",
	"type": "player",
	"persona": "You are a professional basketball player posting from your personal account. You write in first person, briefly and genuinely. After wins, you celebrate with your teammates and give credit to the group — 'we', 'the guys', 'this team'. After losses, you are accountable and forward-looking. When trades or signings happen, you are diplomatically supportive — you respect organizational decisions and frame change as exciting. When you receive an individual award, you are grateful and humble, always crediting the people around you. Your tone is warm, casual, and professional. Never write more than 200 characters. No hashtags. No emojis beyond a single occasional one.",
	"triggers": ["GAME_END", "PLAYER_SIGNING", "DRAFT_PICK", "SEASON_AWARD"],
	"replyEligible": false,
	"postProbability": 0.6
}
```

---

### `orgs/template` — Team Organization Account Template

The official team account. Professional and promotional. Announces results, celebrates signings, and hypes up the fanbase. Never editorializes negatively. Writes in the voice of a PR department that genuinely loves its team. This template is the base for every team org account created by Phase 3a — `tid` is stamped in at runtime, and the AI prompt layer injects the team's name and context from the `Account` record.

```json
{
	"id": "org_template",
	"handle": "team_handle",
	"type": "org",
	"persona": "You are the official Twitter account of a professional basketball team. Your tone is professional, promotional, and enthusiastic — but never over-the-top. You celebrate wins, welcome new players, congratulate award winners, and keep the fanbase engaged. You do not criticize. You do not take sides in controversies. After losses, you are forward-looking and respectful of the opponent. You use inclusive language like 'our guys', 'the team', and 'your [City] [Team Name]'. Keep posts under 220 characters. You may use one or two relevant hashtags. Your posts should feel like they came from a real NBA franchise social media team.",
	"triggers": [
		"GAME_END",
		"HALFTIME",
		"TRADE_ALERT",
		"DRAFT_PICK",
		"INJURY",
		"PLAYER_SIGNING",
		"SEASON_AWARD",
		"PLAYOFF_CLINCH"
	],
	"replyEligible": false,
	"postProbability": 0.4
}
```

---

## Event Coverage Map

The following table shows which agents trigger on each event type. Every `FeedEventType` is covered by at least one agent.

| Event Type     | sham_charania | homer | stat_nerd | bandwagon | hater | player_template | org_template |
| -------------- | :-----------: | :---: | :-------: | :-------: | :---: | :-------------: | :----------: |
| GAME_END       |       X       |   X   |     X     |     X     |   X   |        X        |      X       |
| HALFTIME       |       X       |   X   |     X     |           |       |                 |      X       |
| TRADE_ALERT    |       X       |       |     X     |           |   X   |                 |      X       |
| DRAFT_PICK     |       X       |       |     X     |           |       |        X        |      X       |
| INJURY         |       X       |       |     X     |           |       |                 |      X       |
| PLAYER_SIGNING |       X       |       |     X     |           |       |        X        |      X       |
| SEASON_AWARD   |       X       |       |     X     |     X     |       |        X        |      X       |
| PLAYOFF_CLINCH |       X       |       |     X     |     X     |       |                 |      X       |

All 8 event types have at least 3 agents that will respond to them. `GAME_END` has the most coverage (7 agents). `HALFTIME`, `TRADE_ALERT`, `INJURY`, and `PLAYER_SIGNING` have narrower but sufficient coverage.

## Validation Script

The following script validates all config files against `AgentConfig` at build time or in CI. It uses zod to enforce the shape and cross-checks that every known `FeedEventType` is covered.

`scripts/validateAgentConfigs.ts`:

```typescript
import { z } from "zod";

// Mirror of FeedEventType from src/common/types.feedEvent.ts
const FeedEventTypeSchema = z.enum([
	"GAME_END",
	"HALFTIME",
	"TRADE_ALERT",
	"DRAFT_PICK",
	"INJURY",
	"PLAYER_SIGNING",
	"SEASON_AWARD",
	"PLAYOFF_CLINCH",
]);

const AgentConfigSchema = z.object({
	id: z.string().min(1),
	handle: z.string().min(1),
	type: z.enum(["journalist", "player", "org", "fan"]),
	persona: z.string().min(1),
	triggers: z.array(FeedEventTypeSchema).min(1),
	replyEligible: z.literal(false),
	postProbability: z.number().min(0).max(1),
});

// Static imports — bundled at build time, never fetched at runtime
import shamCharania from "../src/data/socialAgents/journalists/sham_charania.json";
import homer from "../src/data/socialAgents/fans/homer.json";
import statNerd from "../src/data/socialAgents/fans/stat_nerd.json";
import bandwagon from "../src/data/socialAgents/fans/bandwagon.json";
import hater from "../src/data/socialAgents/fans/hater.json";
import playerTemplate from "../src/data/socialAgents/players/template.json";
import orgTemplate from "../src/data/socialAgents/orgs/template.json";

const ALL_CONFIGS = [
	shamCharania,
	homer,
	statNerd,
	bandwagon,
	hater,
	playerTemplate,
	orgTemplate,
];

const ALL_EVENT_TYPES = FeedEventTypeSchema.options;

function validateAgentConfigs(): void {
	const errors: string[] = [];
	const coveredEventTypes = new Set<string>();

	for (const config of ALL_CONFIGS) {
		const result = AgentConfigSchema.safeParse(config);

		if (!result.success) {
			errors.push(
				`Config "${(config as { id?: string }).id ?? "unknown"}" failed validation:\n` +
					result.error.issues
						.map((i) => `  - ${i.path.join(".")}: ${i.message}`)
						.join("\n"),
			);
			continue;
		}

		for (const trigger of result.data.triggers) {
			coveredEventTypes.add(trigger);
		}
	}

	const missingEventTypes = ALL_EVENT_TYPES.filter(
		(t) => !coveredEventTypes.has(t),
	);

	if (missingEventTypes.length > 0) {
		errors.push(
			`The following FeedEventTypes are not covered by any agent:\n` +
				missingEventTypes.map((t) => `  - ${t}`).join("\n"),
		);
	}

	if (errors.length > 0) {
		console.error("Agent config validation FAILED:\n");
		for (const err of errors) {
			console.error(err);
		}
		process.exit(1);
	}

	console.log(
		`All ${ALL_CONFIGS.length} agent configs valid. All ${ALL_EVENT_TYPES.length} event types covered.`,
	);
}

validateAgentConfigs();
```

Run with:

```
npx tsx scripts/validateAgentConfigs.ts
```

## Implementation Notes

### Loading pattern: static imports, not fetch

Because these JSON files live in `src/data/`, they are bundled at build time by the module bundler (webpack/rollup). They are imported as ordinary ES modules — no `fetch`, no dynamic `import()`, no filesystem reads. This means:

- Zero runtime latency for config loading
- TypeScript can type-check JSON imports when `resolveJsonModule: true` is set in `tsconfig.json`
- The validation script above uses the same import pattern as production code — if the import fails, the build fails

At runtime, the Feed Worker (Phase 14) imports these configs directly and uses them for agent selection filtering. No config is ever read from IndexedDB.

### `id` is a templateId, not an agentId

The `id` field in each JSON corresponds to `Account.templateId`. The runtime `agentId` in `socialFeedDb` is a separate value, stamped in by Phase 3a:

| Template `id`     | Runtime `agentId` format |
| ----------------- | ------------------------ |
| `sham_charania`   | `sham_charania`          |
| `fan_homer`       | `fan_homer`              |
| `fan_stat_nerd`   | `fan_stat_nerd`          |
| `fan_bandwagon`   | `fan_bandwagon`          |
| `fan_hater`       | `fan_hater`              |
| `player_template` | `player_{pid}`           |
| `org_template`    | `team_{tid}`             |

For journalist and fan archetypes, `agentId` and `templateId` are the same value. For player and org accounts, `agentId` encodes the entity's `pid`/`tid` while `templateId` stays `"player_template"` or `"org_template"`.

### `postProbability` rationale

| Archetype       | Value | Rationale                                                                                         |
| --------------- | ----- | ------------------------------------------------------------------------------------------------- |
| Journalist      | 0.95  | Covers everything. Missing an event is bad for the "insider" persona.                             |
| Player template | 0.60  | Players post selectively. Consistent posting looks authentic; constant posting does not.          |
| Homer fan       | 0.70  | Emotionally compelled to react, but only covers 2 event types so raw post count stays manageable. |
| Stat nerd fan   | 0.60  | Methodical, not impulsive. Covers all events but doesn't react to every single one.               |
| Bandwagon fan   | 0.50  | Only shows up for the glamour moments. Coin-flip attendance feels right.                          |
| Hater fan       | 0.50  | Rival fan lurks, not constantly engaged. Reacts when the opportunity is good.                     |
| Org template    | 0.40  | Official accounts are measured and deliberate. Not every event warrants a post.                   |

### `persona` field is the AI's voice instruction

The `persona` string is passed directly into the system prompt for each `generateText` call in Phase 6. It should be:

- **Multi-sentence** — the AI needs enough context to produce a consistent voice across varied event types
- **Written in second person** — "You are..." is the standard system prompt convention
- **Specific about tone, vocabulary, and constraints** — the more concrete the instructions, the more consistent the output
- **Inclusive of length guidance** — every persona includes a character limit so posts stay tweet-sized

The persona is intentionally generic enough to work across all the agent's trigger events. The AI prompt in Phase 6 will inject the specific event type and game context on top of the persona. The persona is the _voice_; the event context is the _content_.

### `replyEligible` is always `false` in v1

All configs set `replyEligible: false`. This field exists in the type so that v2 can introduce threaded replies without a type migration. The Feed Worker (Phase 14) may read this field but should ignore agents where it is `true` (none exist in v1). The validation script enforces `z.literal(false)` so any attempt to set it `true` fails at build time.

### Directory structure

```
src/data/socialAgents/
├── journalists/
│   └── sham_charania.json
├── fans/
│   ├── homer.json
│   ├── stat_nerd.json
│   ├── bandwagon.json
│   └── hater.json
├── players/
│   └── template.json
└── orgs/
    └── template.json
```

All directories are flat within their archetype folder. Future archetypes (e.g., a second journalist or a new fan type) are added by dropping a new JSON file in the appropriate subdirectory and adding it to the validation script's import list.

## Verified by

- Every config file parses as valid JSON (malformed JSON causes a build error on import)
- Every config validates against `AgentConfig` via the `validateAgentConfigs.ts` script — no missing required fields, no unknown fields
- The union of all `triggers` arrays covers all 8 `FeedEventType` values (validated by the script's coverage check)
- `postProbability` is between 0 and 1 in every config (enforced by `z.number().min(0).max(1)`)
- `replyEligible` is `false` in every config (enforced by `z.literal(false)`)
- `tsc --noEmit` on the validation script and any file that imports these configs passes with zero errors (requires `resolveJsonModule: true` in tsconfig)

## Definition of Done

All 7 config files exist, parse as valid JSON, and validate against `AgentConfig`. The validation script exits with code 0. Every `FeedEventType` has at least one agent that will respond to it. Phase 3a (Account Initialization) and Phase 14 (Feed Worker) can import these configs without modification.
