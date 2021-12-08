import { bySport, PHASE, PLAYER } from "../../common";
import { g } from "../util";
import type { UpdateEvents, ViewInput } from "../../common/types";
import { getPlayers } from "./playerRatings";
import { player } from "../core";
import { idb } from "../db";
import { TableConfig } from "../../ui/util/TableConfig";

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
			basketball: ["pts", "trb", "ast"],
			football: ["keyStats"],
			hockey: ["keyStats"],
		});

		const config: TableConfig = new TableConfig("playerBios", [
			"Name",
			"Pos",
			"stat:jerseyNumber",
			"Team",
			"Age",
			"Height",
			"Weight",
			"Mood",
			"Contract",
			"Exp",
			"Country",
			"College",
			"Draft Year",
			"Pick",
			"Experience",
			"Ovr",
			"Pot",
			...stats.map(s => `stat:${s}`),
		]);
		await config.load();

		const players = await getPlayers(
			inputs.season,
			inputs.abbrev,
			[],
			[],
			[],
			inputs.tid,
			config,
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
			config,
			userTid,
		};
	}
};

export default updatePlayers;
