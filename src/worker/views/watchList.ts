import { bySport, PLAYER } from "../../common/index.ts";
import { player } from "../core/index.ts";
import { idb } from "../db/index.ts";
import { g } from "../util/index.ts";
import type { Player, UpdateEvents, ViewInput } from "../../common/types.ts";
import addFirstNameShort from "../util/addFirstNameShort.ts";

export const formatPlayersWatchList = async (
	playersAll: Player[],
	{ playoffs, statType }: Pick<ViewInput<"watchList">, "playoffs" | "statType">,
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
	});

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
			playoffs: playoffs === "playoffs",
			regularSeason: playoffs === "regularSeason",
			combined: playoffs === "combined",
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

const updatePlayers = async (
	inputs: ViewInput<"watchList">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("watchList") ||
		updateEvents.includes("gameSim") ||
		updateEvents.includes("playerMovement") ||
		updateEvents.includes("newPhase") ||
		inputs.statType !== state.statType ||
		inputs.playoffs !== state.playoffs
	) {
		const playersAll = await idb.getCopies.players(
			{
				watch: true,
			},
			"noCopyCache",
		);

		const { players, stats } = await formatPlayersWatchList(playersAll, inputs);

		return {
			challengeNoRatings: g.get("challengeNoRatings"),
			currentSeason: g.get("season"),
			phase: g.get("phase"),
			players,
			playoffs: inputs.playoffs,
			statType: inputs.statType,
			stats,
		};
	}
};

export default updatePlayers;
