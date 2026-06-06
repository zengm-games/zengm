import { DEFAULT_COACHING } from "../../../common/constants.ts";
import { helpers } from "../../util/index.ts";
import { last } from "../../../common/utils.ts";
import type { Coach, Player, TeamCoaching } from "../../../common/types.ts";

const DIAL_KEYS = Object.keys(DEFAULT_COACHING) as (keyof TeamCoaching)[];

const round1 = (x: number) => Math.round(helpers.bound(x, -1, 1) * 10) / 10;

// Map a 0-100-ish rating average to a signed [-1, 1] signal centered on 50.
const toSignal = (v: number, scale = 1) =>
	helpers.bound(((v - 50) / 25) * scale, -1, 1);

const avg = (xs: number[]) =>
	xs.length === 0 ? 50 : xs.reduce((a, b) => a + b, 0) / xs.length;

// The top ~8 players by value, as raw ratings objects.
const topRatings = (players: Player[]) =>
	[...players]
		.sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
		.slice(0, 8)
		.map((p) => last(p.ratings) as any);

// The style that best fits a roster's strengths.
export const rosterOptimalStyle = (players: Player[]): TeamCoaching => {
	const top = topRatings(players);
	if (top.length === 0) {
		return { ...DEFAULT_COACHING };
	}
	const m = (key: string) => avg(top.map((r) => r[key] ?? 50));

	const tp = m("tp");
	const spd = m("spd");
	const dnk = m("dnk");
	const reb = m("reb");
	const hgt = m("hgt");
	const diq = m("diq");

	return {
		threePointTendency: round1(toSignal(tp, 0.8)),
		pace: round1(toSignal((spd + dnk) / 2, 0.8)),
		crashOffensiveGlass: round1(toSignal((reb + hgt) / 2, 0.6)),
		// Tall/high-IQ interior teams pack the paint; quick teams guard the perimeter.
		paintDefense: round1((((hgt + diq) / 2 - spd) / 25) * 0.8),
		defensiveAggression: round1(toSignal((diq + spd) / 2, 0.6)),
	};
};

// The season's effective style: blend the coach's philosophy with the roster-optimal
// style, weighted by how adaptable the coach is.
export const seasonStyle = (
	coach: Coach,
	rosterOptimal: TeamCoaching,
): TeamCoaching => {
	const a = helpers.bound(coach.ratings.adaptability / 100, 0, 1);
	const out = {} as TeamCoaching;
	for (const k of DIAL_KEYS) {
		out[k] = round1(coach.philosophy[k] * (1 - a) + rosterOptimal[k] * a);
	}
	return out;
};

export type OpponentProfile = {
	threeReliance: number;
	interiorReliance: number;
	ballHandling: number;
	defReb: number;
};

// A normalized [-1, 1] read on what the opponent does well, used for scouting.
export const opponentProfile = (players: Player[]): OpponentProfile => {
	const top = topRatings(players);
	const m = (key: string) => avg(top.map((r) => r[key] ?? 50));
	return {
		threeReliance: toSignal(m("tp")),
		interiorReliance: toSignal((m("ins") + m("dnk") + m("hgt")) / 3),
		ballHandling: toSignal((m("drb") + m("pss")) / 2),
		defReb: toSignal((m("reb") + m("hgt")) / 2),
	};
};

// Maximum weight (at tactics = 100) given to re-optimizing the style for the
// players actually available tonight.
const AVAILABILITY_MAX = 0.4;

// Adapt the style to who's actually on the floor (e.g. when starters are injured),
// scaled by tactics. A high-tactics coach shifts toward what the healthy roster
// does well; a low-tactics coach plays the same regardless of availability.
export const availabilityAdjust = (
	style: TeamCoaching,
	tactics: number,
	availablePlayers: Player[],
): TeamCoaching => {
	const w = helpers.bound(tactics / 100, 0, 1) * AVAILABILITY_MAX;
	if (w === 0 || availablePlayers.length === 0) {
		return style;
	}
	const optimal = rosterOptimalStyle(availablePlayers);
	const out = {} as TeamCoaching;
	for (const k of DIAL_KEYS) {
		out[k] = round1(style[k] * (1 - w) + optimal[k] * w);
	}
	return out;
};

// Per-matchup adjustment: a high-tactics coach tweaks the dials to exploit the
// opponent. Ephemeral (applied at game time, not stored).
export const matchupAdjust = (
	style: TeamCoaching,
	tactics: number,
	opp: OpponentProfile,
): TeamCoaching => {
	const scale = helpers.bound(tactics / 100, 0, 1) * 0.5;
	return {
		...style,
		// Pack the paint vs. interior teams; guard the arc vs. shooting teams.
		paintDefense: round1(
			style.paintDefense + scale * (opp.interiorReliance - opp.threeReliance),
		),
		// Gamble for turnovers vs. poor ball handlers.
		defensiveAggression: round1(
			style.defensiveAggression + scale * -opp.ballHandling,
		),
		// Crash the glass vs. poor defensive-rebounding teams.
		crashOffensiveGlass: round1(
			style.crashOffensiveGlass + scale * -opp.defReb,
		),
	};
};
