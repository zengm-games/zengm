import { bySport, PLAYER } from "../../common";
import { player } from "../core";
import { idb } from "../db";
import { g } from "../util";
import type { UpdateEvents, ViewInput } from "../../common/types";

const updatePlayers = async (
	inputs: ViewInput<"watchList">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (
		updateEvents.includes("watchList") ||
		updateEvents.includes("gameSim") ||
		updateEvents.includes("playerMovement") ||
		inputs.statType !== state.statType ||
		inputs.playoffs !== state.playoffs ||
		inputs.flagNote !== state.flagNote
	) {
		const stats = bySport({
			basketball: [
				"gp",
				"min",
				"fgp",
				"tpp",
				"ftp",
				"trb",
				"ast",
				"tov",
				"stl",
				"blk",
				"pts",
				"per",
				"ewa",
			],
			football: ["gp", "keyStats", "av"],
			hockey: ["gp", "keyStats", "ops", "dps", "ps"],
		});

		const playersAll = await idb.getCopies.players(
			{
				watch: inputs.flagNote === "flag" || inputs.flagNote === "either",
				note: inputs.flagNote === "note" || inputs.flagNote === "either",
			},
			"noCopyCache",
		);

		const players = await idb.getCopies.playersPlus(playersAll, {
			attrs: [
				"pid",
				"name",
				"age",
				"ageAtDeath",
				"injury",
				"tid",
				"abbrev",
				"watch",
				"contract",
				"draft",
				"jerseyNumber",
				"note",
			],
			ratings: ["ovr", "pot", "skills", "pos"],
			stats,
			season: g.get("season"),
			statType: inputs.statType,
			playoffs: inputs.playoffs === "playoffs",
			regularSeason: inputs.playoffs !== "playoffs",
			fuzz: true,
			showNoStats: true,
			showRookies: true,
			showRetired: true,
			showDraftProspectRookieRatings: true,
			oldStats: true,
		});

		// Add mood to free agent contracts
		for (const p of players) {
			if (p.tid === PLAYER.FREE_AGENT) {
				const p2 = await idb.cache.players.get(p.pid);
				if (p2) {
					const mood = await player.moodInfo(p2, g.get("userTid"));
					p.contract.amount = mood.contractAmount / 1000;
				}
			}
		}

		return {
			challengeNoRatings: g.get("challengeNoRatings"),
			flagNote: inputs.flagNote,
			players,
			playoffs: inputs.playoffs,
			statType: inputs.statType,
			stats,
		};
	}
};

export default updatePlayers;
