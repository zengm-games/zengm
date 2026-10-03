import { PLAYER } from "../../common/constants.ts";
import { player } from "../core/index.ts";
import { idb } from "../db/index.ts";
import { g } from "../util/index.ts";
import type { Player } from "../../common/types.ts";
import { defineView, type ViewInput } from "../util/defineView.ts";
import addFirstNameShort from "../util/addFirstNameShort.ts";
import { bySport } from "../../common/sportFunctions.ts";
import type { PlayerStatType } from "../../common/types.ts";
import type { RouteParams } from "../../ui/router/types.ts";
import { validateSeasonType } from "../util/processInputs.ts";

const processInputs = (params: RouteParams<"watchList">) => {
	let statType: PlayerStatType;
	if (params.statType === "per36") {
		statType = params.statType;
	} else if (params.statType === "totals") {
		statType = params.statType;
	} else {
		statType = "perGame";
	}

	return { playoffs: validateSeasonType(params.playoffs), statType };
};

export const formatPlayersWatchList = async (
	playersAll: Player[],
	{
		playoffs,
		statType,
	}: Pick<ViewInput<typeof processInputs>, "playoffs" | "statType">,
) => {
	const stats = bySport({
		baseball: ["gp", "keyStats", "war"],
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
	} as const);

	const players = addFirstNameShort(
		await idb.getCopies.playersPlus(playersAll, {
			attrs: [
				"pid",
				"firstName",
				"lastName",
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
			statType,
			seasonType: playoffs,
			fuzz: true,
			showNoStats: true,
			showRookies: true,
			showRetired: true,
			showDraftProspectRookieRatings: true,
			oldStats: true,
		}),
	);

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

	return { players, stats };
};

export default defineView({
	id: "watchList",
	processInputs,
	load: async ({ inputs, updateEvents, prevInputs }) => {
		if (
			updateEvents.has("firstRun") ||
			updateEvents.has("watchList") ||
			updateEvents.has("gameSim") ||
			updateEvents.has("playerMovement") ||
			updateEvents.has("newPhase") ||
			inputs.statType !== prevInputs?.statType ||
			inputs.playoffs !== prevInputs?.playoffs
		) {
			const playersAll = await idb.getCopies.players(
				{
					watch: true,
				},
				"noCopyCache",
			);

			const { players, stats } = await formatPlayersWatchList(
				playersAll,
				inputs,
			);

			return {
				players,
				playoffs: inputs.playoffs,
				statType: inputs.statType,
				stats,
			};
		}
	},
});
