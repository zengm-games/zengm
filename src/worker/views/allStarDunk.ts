import { allStar } from "../core";
import type { DunkAttempt, UpdateEvents, ViewInput } from "../../common/types";
import { idb } from "../db";
import { g, getTeamInfoBySeason, helpers } from "../util";
import orderBy from "lodash-es/orderBy";
import { isSport, PHASE } from "../../common";

const getShortTall = async (pids: [number, number]) => {
	if (!pids) {
		return [];
	}

	return Promise.all(
		pids.map(async pid => {
			const p = await idb.getCopy.players({ pid }, "noCopyCache");
			if (p) {
				return {
					pid: p.pid,
					name: `${p.firstName} ${p.lastName}`,
					hgt: p.hgt,
				};
			}
		}),
	);
};

const updateAllStarDunk = async (
	{ season }: ViewInput<"allStarDunk">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (!isSport("basketball")) {
		throw new Error("Not implemented");
	}

	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("gameAttributes") ||
		updateEvents.includes("allStarDunk") ||
		updateEvents.includes("watchList") ||
		season !== state.season
	) {
		const allStars = await allStar.getOrCreate(season);
		const dunk = allStars?.dunk;
		if (dunk === undefined) {
			if (
				season === g.get("season") &&
				g.get("phase") <= PHASE.REGULAR_SEASON
			) {
				return {
					redirectUrl: helpers.leagueUrl(["all_star", "dunk", season - 1]),
				};
			}

			// https://stackoverflow.com/a/59923262/786644
			const returnValue = {
				errorMessage: "Dunk contest not found",
			};
			return returnValue;
		}

		const playersRaw = await idb.getCopies.players(
			{
				pids: dunk.players.map(p => p.pid),
			},
			"noCopyCache",
		);

		const players = await idb.getCopies.playersPlus(playersRaw, {
			attrs: [
				"pid",
				"name",
				"age",
				"watch",
				"face",
				"imgURL",
				"hgt",
				"weight",
				"awards",
			],
			ratings: ["ovr", "pot", "dnk", "jmp", "pos"],
			stats: ["gp", "pts", "trb", "ast", "jerseyNumber"],
			season,
			fuzz: true,
			mergeStats: true,
			showNoStats: true,
		});

		for (const p of dunk.players) {
			const p2 = players.find(p2 => p2.pid === p.pid);
			const ts = await getTeamInfoBySeason(p.tid, season);
			if (ts) {
				p2.colors = ts.colors;
				p2.jersey = ts.jersey;
				p2.abbrev = ts.abbrev;
			}
		}

		const resultsByRound = dunk.rounds.map(round =>
			orderBy(allStar.dunkContest.getRoundResults(round), "index", "asc"),
		);

		const log: (
			| {
					type: "round";
					num: number;
			  }
			| {
					type: "tiebreaker";
			  }
			| {
					type: "attempt";
					player: number;
					num?: number; // Not needed in tiebreaker
					try: number;
					dunk: DunkAttempt;
					made: boolean;
			  }
			| {
					type: "score";
					player: number;
					made: boolean;
					score: number;
			  }
		)[] = [];
		for (const round of dunk.rounds) {
			if (round === dunk.rounds[0]) {
				log.push({
					type: "round",
					num: 1,
				});
			} else if (round.tiebreaker) {
				log.push({
					type: "tiebreaker",
				});
			} else {
				log.push({
					type: "round",
					num: 2,
				});
			}

			const seenDunkers = new Set<number>();
			for (const { attempts, index, made, score } of round.dunks) {
				let num: number | undefined;
				if (!round.tiebreaker) {
					num = seenDunkers.has(index) ? 2 : 1;
					seenDunkers.add(index);
				}

				for (let i = 0; i < attempts.length; i++) {
					const attempt = attempts[i];
					log.push({
						type: "attempt",
						player: index,
						num,
						try: i + 1,
						dunk: attempt,
						made: attempt === attempts.at(-1) && made,
					});
				}

				if (score !== undefined) {
					log.push({
						type: "score",
						player: index,
						made,
						score,
					});
				}
			}
		}

		const godMode = g.get("godMode");

		const started = log.length > 1;

		let allPossibleContestants: {
			pid: number;
			tid: number;
			name: string;
			abbrev: string;
		}[] = [];
		if (godMode && !started) {
			allPossibleContestants = orderBy(
				await idb.cache.players.indexGetAll("playersByTid", [0, Infinity]),
				["lastName", "firstName"],
			).map(p => ({
				pid: p.pid,
				tid: p.tid,
				name: `${p.firstName} ${p.lastName}`,
				abbrev: g.get("teamInfoCache")[p.tid].abbrev,
			}));
		}

		const awaitingUserDunkIndex =
			allStar.dunkContest.getAwaitingUserDunkIndex(dunk);

		const dunkAugmented = {
			...dunk,
			playersShort: await getShortTall(dunk.pidsShort),
			playersTall: await getShortTall(dunk.pidsTall),
		};

		return {
			allPossibleContestants,
			awaitingUserDunkIndex,
			challengeNoRatings: g.get("challengeNoRatings"),
			dunk: dunkAugmented,
			godMode,
			log,
			players,
			resultsByRound,
			season,
			started,
			userTid: g.get("userTid"),
		};
	}
};

export default updateAllStarDunk;
