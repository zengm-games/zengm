import { bySport, PHASE, PLAYER } from "../../common";
import { g } from "../util";
import type { UpdateEvents, ViewInput } from "../../common/types";
import { getPlayers } from "./playerRatings";
import { player } from "../core";
import { idb } from "../db";
import addFirstNameShort from "../util/addFirstNameShort";

const updatePlayers = async (
	inputs: ViewInput<"playerBios">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (
		(inputs.season === g.get("season") &&
			(updateEvents.includes("gameSim") ||
				updateEvents.includes("playerMovement"))) ||
		(updateEvents.includes("newPhase") && g.get("phase") === PHASE.PRESEASON) ||
		inputs.season !== state.season ||
		inputs.abbrev !== state.abbrev
	) {
		const stats = bySport({
			baseball: ["keyStats"],
			basketball: ["pts", "trb", "ast"],
			football: ["keyStats"],
			hockey: ["keyStats"],
		});

		const players = addFirstNameShort(
			await getPlayers(
				inputs.season,
				inputs.abbrev,
				["born", "college", "hgt", "weight", "draft", "experience"],
				["ovr", "pot"],
				[...stats, "jerseyNumber"],
				inputs.tid,
			),
		);

		const userTid = g.get("userTid");

		for (const p of players) {
			if (p.tid !== PLAYER.RETIRED) {
				const p2 = await idb.cache.players.get(p.pid);
				if (p2) {
					p.mood = await player.moodInfos(p2);
				}
			}
		}

		return {
			abbrev: inputs.abbrev,
			challengeNoRatings: g.get("challengeNoRatings"),
			currentSeason: g.get("season"),
			season: inputs.season,
			players,
			stats,
			userTid,
		};
	}
};

export default updatePlayers;
