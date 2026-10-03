import { allStar } from "../core/index.ts";
import { defineView } from "../util/defineView.ts";
import { idb } from "../db/index.ts";
import { g, helpers } from "../util/index.ts";
import { PHASE } from "../../common/constants.ts";
import { orderBy } from "../../common/utils.ts";
import { getTeamInfoBySeason } from "../util/getTeamInfoBySeason.ts";
import { validateSeasonOnly } from "../util/processInputs.ts";

export default defineView({
	id: "allStarThree",
	processInputs: validateSeasonOnly,
	load: async ({ inputs: { season }, updateEvents, prevInputs }) => {
		if (__SPORT !== "basketball") {
			throw new Error("Not implemented");
		}

		if (
			updateEvents.has("firstRun") ||
			updateEvents.has("gameAttributes") ||
			updateEvents.has("allStarThree") ||
			season !== prevInputs?.season
		) {
			const allStars = await allStar.getOrCreate(season);
			const three = allStars?.three;
			if (three === undefined) {
				if (season === g.get("season") && g.get("phase") < PHASE.PLAYOFFS) {
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
					pids: three.players.map((p) => p.pid),
				},
				"noCopyCache",
			);

			const playersFiltered = await idb.getCopies.playersPlus(playersRaw, {
				attrs: [
					"pid",
					"firstName",
					"lastName",
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
				mergeStats: "totOnly",
				showNoStats: true,
			});

			// Team info from the team the player was on during the contest
			const players = await Promise.all(
				playersFiltered.map(async (p) => {
					const info = three.players.find((info) => info.pid === p.pid);
					const ts = info
						? await getTeamInfoBySeason(info.tid, season)
						: undefined;
					return {
						...p,
						colors: ts?.colors,
						jersey: ts?.jersey,
						abbrev: ts?.abbrev,
					};
				}),
			);

			const resultsByRound = three.rounds.map((round) =>
				orderBy(allStar.threeContest.getRoundResults(round), "index", "asc"),
			);

			const godMode = g.get("godMode");

			const started =
				three.rounds[0]!.results.length > 0 &&
				three.rounds[0]!.results[0]!.racks.length > 0 &&
				three.rounds[0]!.results[0]!.racks[0]!.length > 0;

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
				).map((p) => ({
					pid: p.pid,
					tid: p.tid,
					name: `${p.firstName} ${p.lastName}`,
					abbrev: helpers.getAbbrev(p.tid),
				}));
			}

			return {
				allPossibleContestants,
				players,
				resultsByRound,
				three,
				season,
				started,
			};
		}
	},
});
