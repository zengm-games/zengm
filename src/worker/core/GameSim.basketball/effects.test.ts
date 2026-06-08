import { assert, test } from "vitest";
import GameSim from "./index.ts";
import { player, team } from "../index.ts";
import loadTeams from "../game/loadTeams.ts";
import { g, helpers } from "../../util/index.ts";
import { resetCache, resetG } from "../../../test/helpers.ts";
import { DEFAULT_LEVEL } from "../../../common/budgetLevels.ts";
import { range } from "../../../common/utils.ts";
import { idb } from "../../db/index.ts";
import type { TeamCoaching } from "../../../common/types.ts";

// Verification harness: sim many controlled games and measure whether each sim
// lever (coaching dials, player tendencies, chemistry) moves box-score output in
// the intended direction, and whether aggregate output stays realistic.

const PER_TEAM = 13;

const STAT_KEYS = [
	"fg",
	"fga",
	"fgAtRim",
	"fgaAtRim",
	"fgLowPost",
	"fgaLowPost",
	"tp",
	"tpa",
	"ft",
	"fta",
	"orb",
	"drb",
	"ast",
	"tov",
	"stl",
	"blk",
	"pf",
	"pts",
	"fbp",
	"scp",
] as const;

type Totals = Record<(typeof STAT_KEYS)[number], number>;

const emptyTotals = (): Totals =>
	Object.fromEntries(STAT_KEYS.map((k) => [k, 0])) as Totals;

const clonePlayer = (p: any, tid: number) => {
	const c = structuredClone(p);
	c.tid = tid;
	return c;
};

type Patch = (players: any[]) => void;

const patchRatings = (key: string, value: number): Patch => {
	return (players) => {
		for (const p of players) {
			p.ratings.at(-1)![key] = value;
		}
	};
};
const setTendency = patchRatings;
const setRating = patchRatings;

// Build two equal-talent rosters (team 1 is a clone of team 0), apply optional
// per-side patches and coaching dials, sim n games, return summed team totals.
const run = async ({
	patch0,
	patch1,
	coaching0,
	coaching1,
	basePatch,
	n = 40,
}: {
	patch0?: Patch;
	patch1?: Patch;
	coaching0?: Partial<TeamCoaching>;
	coaching1?: Partial<TeamCoaching>;
	basePatch?: Patch;
	n?: number;
}) => {
	resetG();
	g.setWithoutSavingToDB("season", 2016);

	const base = range(PER_TEAM).map((i) => {
		const p: any = player.generate(0, 25, 2010, true, DEFAULT_LEVEL);
		p.rosterOrder = i;
		return p;
	});
	if (basePatch) {
		basePatch(base);
	}

	const players0 = base.map((p) => clonePlayer(p, 0));
	const players1 = base.map((p) => clonePlayer(p, 1));
	patch0?.(players0);
	patch1?.(players1);

	const teamsDefault = helpers.getTeamsDefault().slice(0, 2);
	await resetCache({
		players: [...players0, ...players1],
		teams: teamsDefault.map(team.generate),
		teamSeasons: teamsDefault.map((t) => team.genSeasonRow(t)),
		teamStats: teamsDefault.map((t) => team.genStatsRow(t.tid)),
	});

	// Compute player values so the sim's substitution ranking works (otherwise
	// nobody subs, starters play 48 min exhausted, and shooting craters).
	for (const p of await idb.cache.players.getAll()) {
		await player.updateValues(p);
		await idb.cache.players.put(p);
	}

	for (const [tid, coaching] of [
		[0, coaching0],
		[1, coaching1],
	] as const) {
		if (coaching) {
			const t = await idb.cache.teams.get(tid);
			Object.assign(t!.coaching!, coaching);
			await idb.cache.teams.put(t!);
		}
	}

	const totals = [emptyTotals(), emptyTotals()];
	for (let i = 0; i < n; i++) {
		const teams = await loadTeams([0, 1], {});
		const game = new GameSim({
			gid: 0,
			teams: [teams[0]!, teams[1]!] as any,
			baseInjuryRate: 0,
			doPlayByPlay: false,
			homeCourtFactor: 1,
			allStarGame: false,
			neutralSite: true,
		});
		const res: any = game.run();
		for (const t of [0, 1] as const) {
			for (const k of STAT_KEYS) {
				totals[t]![k] += res.team[t].stat[k] ?? 0;
			}
		}
	}
	return totals as [Totals, Totals];
};

const ratio = (a: number, b: number) => (b > 0 ? a / b : 0);
const threePARate = (t: Totals) => ratio(t.tpa, t.fga);
const atRimRate = (t: Totals) => ratio(t.fgaAtRim, t.fga);
const lowPostRate = (t: Totals) => ratio(t.fgaLowPost, t.fga);
const efg = (t: Totals) => ratio(t.fg + 0.5 * t.tp, t.fga);
const atRimPct = (t: Totals) => ratio(t.fgAtRim, t.fgaAtRim);
const possessions = (t: Totals) => t.fga + 0.44 * t.fta + t.tov;
const orbPct = (t: Totals, opp: Totals) => ratio(t.orb, t.orb + opp.drb);
const astRate = (t: Totals) => ratio(t.ast, t.fg);
const pct = (x: number) => `${(100 * x).toFixed(1)}%`;

// Surfaced by vitest on failure; useful when a directional check trips.
const report = (s: string) => {
	console.log(s);
};

test("coaching: threePointTendency raises 3PA share", async () => {
	const [a, b] = await run({ coaching0: { threePointTendency: 1 } });
	report(
		`[3PT dial] 3PA share: dialed=${pct(threePARate(a))} neutral=${pct(threePARate(b))}`,
	);
	assert(threePARate(a) > threePARate(b) * 1.1);
});

test("coaching: crashOffensiveGlass raises ORB%", async () => {
	const [a, b] = await run({ coaching0: { crashOffensiveGlass: 1 } });
	report(
		`[crash glass] ORB%: dialed=${pct(orbPct(a, b))} neutral=${pct(orbPct(b, a))}`,
	);
	assert(orbPct(a, b) > orbPct(b, a) * 1.05);
});

test("coaching: paintDefense pushes opponent to 3s and lowers their rim FG%", async () => {
	// team 0 packs the paint on defense; team 1 is the offense affected.
	const [a, b] = await run({ coaching0: { paintDefense: 1 } });
	report(
		`[paint D] opp 3PA share: vsPaint=${pct(threePARate(b))} vsNeutral=${pct(threePARate(a))} | opp rim FG%: vsPaint=${pct(atRimPct(b))} vsNeutral=${pct(atRimPct(a))}`,
	);
	assert(threePARate(b) > threePARate(a) * 1.05);
	assert(atRimPct(b) < atRimPct(a));
});

test("coaching: defensiveAggression forces TOs/blocks/steals at cost of fouls", async () => {
	const [a, b] = await run({ coaching0: { defensiveAggression: 1 } });
	report(
		`[aggression] opp TOV: vsAgg=${b.tov.toFixed(0)} vsNeutral=${a.tov.toFixed(0)} | stl+blk: agg=${(a.stl + a.blk).toFixed(0)} neutral=${(b.stl + b.blk).toFixed(0)} | PF: agg=${a.pf.toFixed(0)} neutral=${b.pf.toFixed(0)}`,
	);
	assert(b.tov > a.tov);
	assert(a.stl + a.blk > b.stl + b.blk);
	assert(a.pf > b.pf);
});

test("coaching: pace raises total possessions", async () => {
	const neutral = await run({});
	const fast = await run({ coaching0: { pace: 1 }, coaching1: { pace: 1 } });
	const pNeutral = possessions(neutral[0]) + possessions(neutral[1]);
	const pFast = possessions(fast[0]) + possessions(fast[1]);
	report(
		`[pace] possessions/40g: neutral=${pNeutral.toFixed(0)} fast=${pFast.toFixed(0)}`,
	);
	assert(pFast > pNeutral * 1.03);
});

test("tendency: three raises 3PA share (equal skill)", async () => {
	const [a, b] = await run({
		patch0: setTendency("tendencyThree", 100),
		patch1: setTendency("tendencyThree", 0),
	});
	report(
		`[tendencyThree] 3PA share: hi=${pct(threePARate(a))} lo=${pct(threePARate(b))}`,
	);
	assert(threePARate(a) > threePARate(b) * 1.2);
});

test("tendency: atRim raises at-rim share (equal skill)", async () => {
	const [a, b] = await run({
		patch0: setTendency("tendencyAtRim", 100),
		patch1: setTendency("tendencyAtRim", 0),
	});
	report(
		`[tendencyAtRim] at-rim share: hi=${pct(atRimRate(a))} lo=${pct(atRimRate(b))}`,
	);
	assert(atRimRate(a) > atRimRate(b));
});

test("tendency: post raises low-post share (equal skill)", async () => {
	const [a, b] = await run({
		patch0: setTendency("tendencyPost", 100),
		patch1: setTendency("tendencyPost", 0),
	});
	report(
		`[tendencyPost] low-post share: hi=${pct(lowPostRate(a))} lo=${pct(lowPostRate(b))}`,
	);
	assert(lowPostRate(a) > lowPostRate(b));
});

test("chemistry: spacing raises eFG at equal shooting skill (report)", async () => {
	// Both rosters have identical (good) shooting skill; only willingness to shoot
	// 3s differs, so only the "spacer" count (synergy) changes.
	const [spaced, clogged] = await run({
		basePatch: setRating("tp", 70),
		patch0: setTendency("tendencyThree", 80),
		patch1: setTendency("tendencyThree", 20),
		n: 80,
	});
	report(
		`[chemistry: spacing] eFG: spaced=${pct(efg(spaced))} clogged=${pct(efg(clogged))} (expect spaced slightly higher)`,
	);
});

test("chemistry: ball-dominance lowers eFG (report)", async () => {
	const [hog, balanced] = await run({
		patch0: setTendency("tendencyUsage", 85),
		patch1: setTendency("tendencyUsage", 50),
		n: 80,
	});
	report(
		`[chemistry: ball-dominance] eFG: allHogs=${pct(efg(hog))} balanced=${pct(efg(balanced))} (expect hogs slightly lower)`,
	);
});

test("tendency: pass first raises assist rate", async () => {
	const [a, b] = await run({
		patch0: setTendency("tendencyPass", 100),
		patch1: setTendency("tendencyPass", 0),
	});
	report(
		`[tendencyPass] assist rate (ast/fg): passFirst=${pct(astRate(a))} neutral=${pct(astRate(b))}`,
	);
	assert(astRate(a) > astRate(b) * 1.05);
});

test("league realism: neutral aggregates are in believable bands", async () => {
	const [a, b] = await run({ n: 60 });
	const games = 60;
	const efgAll = efg({
		...a,
		fg: a.fg + b.fg,
		fga: a.fga + b.fga,
		tp: a.tp + b.tp,
	} as Totals);
	const tpaShare = ratio(a.tpa + b.tpa, a.fga + b.fga);
	const ftRate = ratio(a.fta + b.fta, a.fga + b.fga);
	const tovPct = ratio(a.tov + b.tov, possessions(a) + possessions(b));
	const possPerTeamGame = (possessions(a) + possessions(b)) / (2 * games);
	const ptsPerTeamGame = (a.pts + b.pts) / (2 * games);

	report(
		`[realism] eFG=${pct(efgAll)} 3PAshare=${pct(tpaShare)} FTrate=${pct(ftRate)} TOV%=${pct(tovPct)} poss/team/g=${possPerTeamGame.toFixed(1)} pts/team/g=${ptsPerTeamGame.toFixed(1)}`,
	);

	// Wide bands: catch true pathologies, not era/roster-dependent style. (3PA
	// rate spans ~3%-45% historically; these synthetic rosters shoot few 3s.)
	assert(efgAll > 0.44 && efgAll < 0.58, `eFG out of band: ${efgAll}`);
	assert(
		tpaShare > 0.02 && tpaShare < 0.6,
		`3PA share out of band: ${tpaShare}`,
	);
	assert(ftRate > 0.08 && ftRate < 0.4, `FT rate out of band: ${ftRate}`);
	assert(tovPct > 0.08 && tovPct < 0.2, `TOV% out of band: ${tovPct}`);
	assert(
		possPerTeamGame > 80 && possPerTeamGame < 122,
		`possessions out of band: ${possPerTeamGame}`,
	);
	assert(
		ptsPerTeamGame > 85 && ptsPerTeamGame < 135,
		`points out of band: ${ptsPerTeamGame}`,
	);
});
