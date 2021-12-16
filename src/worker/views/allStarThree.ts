import { allStar } from "../core";
import type { UpdateEvents, ViewInput } from "../../common/types";
import { idb } from "../db";
import { g, getTeamInfoBySeason, helpers } from "../util";
import orderBy from "lodash-es/orderBy";
import { isSport, PHASE } from "../../common";

const updateAllStarThree = async (
	{ season }: ViewInput<"allStarThree">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (!isSport("basketball")) {
		throw new Error("Not implemented");
	}

	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("gameAttributes") ||
		updateEvents.includes("allStarThree") ||
		updateEvents.includes("watchList") ||
		season !== state.season
	) {
		const allStars = await allStar.getOrCreate(season);
		const three = allStars?.three;
		if (three === undefined) {
			if (
				season === g.get("season") &&
				g.get("phase") <= PHASE.REGULAR_SEASON
			) {
				return {
					redirectUrl: helpers.leagueUrl(["all_star", "three", season - 1]),
				};
			}

			// https://stackoverflow.com/a/59923262/786644
			const returnValue = {
				errorMessage: "Three point contest not found",
			};
			return returnValue;
		}

		const playersRaw = await idb.getCopies.players(
			{
				pids: three.players.map(p => p.pid),
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
			ratings: ["ovr", "pot", "tp", "pos"],
			stats: ["gp", "pts", "tpa", "tpp", "jerseyNumber"],
			season,
			fuzz: true,
			mergeStats: true,
			showNoStats: true,
		});

		for (const p of three.players) {
			const p2 = players.find(p2 => p2.pid === p.pid);
			const ts = await getTeamInfoBySeason(p.tid, season);
			if (ts) {
				p2.colors = ts.colors;
				p2.jersey = ts.jersey;
				p2.abbrev = ts.abbrev;
			}
		}

		const resultsByRound = three.rounds.map(round =>
			orderBy(allStar.threeContest.getRoundResults(round), "index", "asc"),
		);

		const godMode = g.get("godMode");

		const started =
			three.rounds[0].results.length > 0 &&
			three.rounds[0].results[0].racks.length > 0 &&
			three.rounds[0].results[0].racks[0].length > 0;

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

		return {
			allPossibleContestants,
			challengeNoRatings: g.get("challengeNoRatings"),
			godMode,
			players,
			resultsByRound,
			three,
			season,
			started,
			userTid: g.get("userTid"),
		};
	}
};

export default updateAllStarThree;
