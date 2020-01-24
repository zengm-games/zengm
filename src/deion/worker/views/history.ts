import { idb } from "../db";
import { g, local, updatePlayMenu } from "../util";
import { UpdateEvents, ViewInput } from "../../common/types";

const viewedSeasonSummary = async () => {
	local.unviewedSeasonSummary = false;
	await updatePlayMenu();
};

const updateHistory = async (
	inputs: ViewInput<"history">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	const { season } = inputs;

	if (typeof season !== "number") {
		viewedSeasonSummary(); // Should never happen, but just in case

		return;
	}

	if (season === g.get("season") && local.unviewedSeasonSummary) {
		viewedSeasonSummary();
	}

	if (updateEvents.includes("firstRun") || state.season !== season) {
		if (season < g.get("startingSeason")) {
			viewedSeasonSummary(); // Should never happen, but just in case

			return {
				invalidSeason: true,
				season,
			};
		}

		const awards = await idb.getCopy.awards({
			season,
		});

		const teams = await idb.getCopies.teamsPlus({
			attrs: ["tid", "abbrev", "region", "name"],
			seasonAttrs: ["playoffRoundsWon"],
			season,
		});

		// Hack placeholder for old seasons before Finals MVP existed
		if (awards && !awards.hasOwnProperty("finalsMvp")) {
			awards.finalsMvp = {
				pid: 0,
				name: "N/A",
				tid: -1,
				abbrev: "",
				pts: 0,
				trb: 0,
				ast: 0,
			};
		}

		// Hack placeholder for old seasons before Finals MVP existed
		if (awards && !awards.hasOwnProperty("allRookie")) {
			awards.allRookie = [];
		}

		// For old league files, this format is obsolete now
		if (awards && awards.bre && awards.brw) {
			awards.bestRecordConfs = [awards.bre, awards.brw];
		}

		const retiredPlayersAll = await idb.getCopies.players({
			retired: true,
			filter: p => p.retiredYear === season,
		});
		const retiredPlayers = await idb.getCopies.playersPlus(retiredPlayersAll, {
			attrs: ["pid", "name", "age", "hof"],
			season,
			ratings: ["pos"],
			stats: ["tid", "abbrev"],
			showNoStats: true,
		});
		retiredPlayers.sort((a, b) => b.age - a.age); // Get champs

		const champ = teams.find(
			t =>
				t.seasonAttrs.playoffRoundsWon ===
				g.get("numGamesPlayoffSeries").length,
		);

		return {
			awards,
			champ,
			confs: g.get("confs"),
			invalidSeason: false,
			retiredPlayers,
			season,
			userTid: g.get("userTid"),
		};
	}
};

export default updateHistory;
