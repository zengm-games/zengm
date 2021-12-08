import { bySport, PLAYER } from "../../common";
import type { Player } from "../../common/types";
import { player, team } from "../core";
import { idb } from "../db";
import { g } from "../util";
import { TableConfig } from "../../ui/util/TableConfig";

export const addMood = async (players: Player[]) => {
	const moods: Awaited<ReturnType<typeof player["moodInfos"]>>[] = [];
	for (const p of players) {
		moods.push(await player.moodInfos(p));
	}

	return players.map((p, i) => ({
		...p,
		mood: moods[i],
	}));
};

const updateFreeAgents = async () => {
	const userTid = g.get("userTid");

	const payroll = await team.getPayroll(userTid);
	const userPlayersAll = await addMood(
		await idb.cache.players.indexGetAll("playersByTid", userTid),
	);
	const playersAll = await addMood(
		await idb.cache.players.indexGetAll("playersByTid", PLAYER.FREE_AGENT),
	);
	const capSpace = (g.get("salaryCap") - payroll) / 1000;

	const stats = bySport({
		basketball: [
			"stat:gp",
			"stat:min",
			"stat:pts",
			"stat:trb",
			"stat:ast",
			"stat:per",
		],
		football: ["stat:gp", "stat:keyStats", "stat:av"],
		hockey: ["stat:gp", "stat:keyStats", "stat:ops", "stat:dps", "stat:ps"],
	});

	const config: TableConfig = new TableConfig("freeAgents", [
		"Name",
		"Pos",
		"Age",
		"Ovr",
		"Pot",
		...stats,
		"Mood",
		"Asking For",
		"Exp",
	]);
	await config.load();

	const players = await idb.getCopies.playersPlus(playersAll, {
		attrs: config.attrsNeeded,
		ratings: config.ratingsNeeded,
		stats: config.statsNeeded,
		season: g.get("season"),
		showNoStats: true,
		showRookies: true,
		fuzz: true,
		oldStats: true,
	});

	const userPlayers = await idb.getCopies.playersPlus(userPlayersAll, {
		attrs: [],
		ratings: ["pos"],
		stats: [],
		season: g.get("season"),
		showNoStats: true,
		showRookies: true,
	});

	return {
		capSpace,
		challengeNoFreeAgents: g.get("challengeNoFreeAgents"),
		challengeNoRatings: g.get("challengeNoRatings"),
		godMode: g.get("godMode"),
		hardCap: g.get("hardCap"),
		maxContract: g.get("maxContract"),
		minContract: g.get("minContract"),
		numRosterSpots: g.get("maxRosterSize") - userPlayers.length,
		spectator: g.get("spectator"),
		phase: g.get("phase"),
		config,
		players,
		userPlayers,
	};
};

export default updateFreeAgents;
