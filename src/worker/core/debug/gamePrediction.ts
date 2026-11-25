import { realGauss, shuffle } from "../../../common/random.ts";
import type { GameAttributesLeague } from "../../../common/types.ts";
import { idb } from "../../db/index.ts";
import { g } from "../../util/index.ts";
import { getGameResult } from "../game/play.ts";
import GameSim from "../GameSim.ts";
import loadTeams from "../game/loadTeams.ts";
import { team } from "../index.ts";

// Tools for measuring how well team ovr predicts game results, which is what the point spread and win probability are based on. Run these from the console in a throwaway league, then fit a model to the output.

type PredictionSettings = Partial<
	Pick<
		GameAttributesLeague,
		"homeCourtAdvantage" | "numPeriods" | "quarterLength"
	>
>;

// Game state before each plate appearance in baseball. o is the team batting, bases is a bitmask of occupied bases (1 is first base).
type BaseballState = {
	inning: number;
	o: number;
	outs: number;
	bases: number;
	pts: [number, number];
};

// Game state before each possession in basketball. o is the team about to run the possession.
type BasketballState = {
	period: number;
	clock: number;
	o: 0 | 1;
	pts: [number, number];
};

// Records BaseballState for every plate appearance in games simulated while this is on, by wrapping GameSim. Baseball only.
const recordBaseballStates = () => {
	const proto = GameSim.prototype as any;
	const original = proto.simPlateAppearance;
	let states: BaseballState[] = [];
	proto.simPlateAppearance = function (this: any) {
		states.push({
			inning: this.inning,
			o: this.o,
			outs: this.outs,
			bases: this.bases.reduce(
				(mask: number, runner: unknown, i: number) =>
					runner ? mask | (1 << i) : mask,
				0,
			),
			pts: [this.team[0].t.stat.pts, this.team[1].t.stat.pts],
		});
		return original.call(this);
	};

	return {
		takeStates: () => {
			const taken = states;
			states = [];
			return taken;
		},
		stop: () => {
			proto.simPlateAppearance = original;
		},
	};
};

// Records BasketballState before every non-Elam possession in games simulated while this is on, by wrapping GameSim. Basketball only.
const recordBasketballStates = () => {
	const proto = GameSim.prototype as any;
	const original = proto.simPossession;
	let states: BasketballState[] = [];
	proto.simPossession = function (this: any) {
		if (!this.elamActive && this.t > 0) {
			// simPossession swaps this.o at the start, so the upcoming offense is the opposite of this.o
			const nextO: 0 | 1 = this.o === 1 ? 0 : 1;
			states.push({
				period: this.team[0].stat.ptsQtrs.length,
				clock: this.t,
				o: nextO,
				pts: [this.team[0].stat.pts, this.team[1].stat.pts],
			});
		}
		return original.call(this);
	};

	return {
		takeStates: () => {
			const taken = states;
			states = [];
			return taken;
		},
		stop: () => {
			proto.simPossession = original;
		},
	};
};

/**
 * Simulates games between random pairs of teams, without saving anything. ovrs are the same injury adjusted ovrs that are shown for upcoming games.
 *
 * recordStates (baseball and basketball only) also returns the game state before every plate appearance / possession, for evaluating live win probability.
 */
export const simGamesForPrediction = async ({
	neutralSite = false,
	numGames,
	recordStates = false,
	settings = {},
}: {
	neutralSite?: boolean;
	numGames: number;
	recordStates?: boolean;
	settings?: PredictionSettings;
}) => {
	if (recordStates && __SPORT !== "baseball" && __SPORT !== "basketball") {
		throw new Error(
			"recordStates is only supported in baseball and basketball",
		);
	}
	const tids = (await idb.cache.teams.getAll())
		.filter((t) => !t.disabled)
		.map((t) => t.tid);

	const original: PredictionSettings = {};
	for (const key of Object.keys(settings) as (keyof PredictionSettings)[]) {
		original[key] = g.get(key);
		g.setWithoutSavingToDB(key, settings[key]!);
	}

	const recorder = recordStates
		? __SPORT === "baseball"
			? recordBaseballStates()
			: recordBasketballStates()
		: undefined;
	const results = [];
	try {
		for (let i = 0; i < numGames; i++) {
			const shuffled = [...tids];
			shuffle(shuffled);
			const [homeTid, awayTid] = shuffled as [number, number];
			const teams = await loadTeams([homeTid, awayTid], {});
			const home = teams[homeTid]!;
			const away = teams[awayTid]!;
			const ovrs = [home.ovr, away.ovr];

			const result = getGameResult({
				gid: i,
				day: undefined,
				teams: [home, away],
				neutralSite,
			});

			results.push({
				ovrs,
				overtimes: result.overtimes,
				pts: result.team.map((t: any) => t.stat.pts),
				ptsQtrs: result.team.map((t: any) => t.stat.ptsQtrs),
				sPts: result.team.map((t: any) => t.stat.sPts),
				states: recorder?.takeStates(),
			});
		}
	} finally {
		recorder?.stop();
		for (const key of Object.keys(original) as (keyof PredictionSettings)[]) {
			g.setWithoutSavingToDB(key, original[key]!);
		}
	}

	return results;
};

/**
 * Redistributes players so some teams are much better than others, to measure predictions for large ovr gaps that are rare in a normal league. Lower noise means bigger gaps. This permanently changes the league!
 */
export const stackRostersForPrediction = async (noise: number) => {
	const teams = (await idb.cache.teams.getAll()).filter((t) => !t.disabled);
	const strengths = new Map(teams.map((t) => [t.tid, Math.random()]));

	const players = await idb.cache.players.indexGetAll("playersByTid", [
		0,
		Infinity,
	]);
	const playersByPos = Map.groupBy(players, (p) => p.ratings.at(-1)!.pos);

	for (const playersPos of playersByPos.values()) {
		playersPos.sort((a, b) => b.value - a.value);

		// Each round, every team gets one player at this position, so position counts stay balanced. Stronger teams pick first, with some noise so they are not the best at every position.
		for (let i = 0; i < playersPos.length; i += teams.length) {
			const keys = new Map(
				teams.map((t) => [t.tid, strengths.get(t.tid)! + realGauss(0, noise)]),
			);
			const order = teams.toSorted(
				(a, b) => keys.get(b.tid)! - keys.get(a.tid)!,
			);

			for (const [j, p] of playersPos.slice(i, i + teams.length).entries()) {
				p.tid = order[j]!.tid;
				await idb.cache.players.put(p);
			}
		}
	}

	for (const t of teams) {
		await team.rosterAutoSort(t.tid);
	}
};
