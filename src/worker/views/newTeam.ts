import { idb } from "../db";
import { g, helpers } from "../util";
import { PHASE } from "../../common";
import orderBy from "lodash/orderBy";
import { team } from "../core";

const getTeamOvr = async (tid: number) => {
	const playersAll = await idb.cache.players.indexGetAll("playersByTid", tid);
	const players = await idb.getCopies.playersPlus(playersAll, {
		ratings: ["ovr", "pot"],
		season: g.get("season"),
		tid,
		showNoStats: true,
		showRookies: true,
		fuzz: true,
	});
	return team.ovr(players);
};

const updateTeamSelect = async () => {
	const rawTeams = await idb.getCopies.teamsPlus({
		attrs: ["tid", "region", "name", "pop", "imgURL", "cid", "abbrev"],
		seasonAttrs: [
			"winp",
			"won",
			"lost",
			"tied",
			"season",
			"playoffRoundsWon",
			"revenue",
		],
		season: g.get("season"),
		active: true,
		addDummySeason: true,
	});

	let teams = helpers.addPopRank(rawTeams);

	const numActiveTeams = teams.length;

	const expansionDraft = g.get("expansionDraft");
	const expansion =
		g.get("phase") === PHASE.EXPANSION_DRAFT &&
		expansionDraft.phase === "protection" &&
		expansionDraft.allowSwitchTeam;
	const expansionTids =
		expansionDraft.phase === "protection" ? expansionDraft.expansionTids : []; // TypeScript bullshit
	const otherTeamsWantToHire = g.get("otherTeamsWantToHire");

	const t = await idb.cache.teams.get(g.get("userTid"));
	const disabled = t ? t.disabled : false;

	if (!expansion) {
		// Remove user's team (no re-hiring immediately after firing)
		teams = teams.filter(t => t.tid !== g.get("userTid"));
	}

	if (expansion) {
		// User team will always be first, cause expansion teams are at the end of the teams list
		teams = teams.filter(
			t => t.tid === g.get("userTid") || expansionTids.includes(t.tid),
		);
	} else if (otherTeamsWantToHire) {
		// Deterministic random selection of teams
		teams = orderBy(teams, t => t.seasonAttrs.revenue % 10, "asc").slice(0, 5);
	} else if (!g.get("godMode")) {
		// If not in god mode, user must have been fired or team folded

		// Only get option of 5 worst
		teams = orderBy(teams, "seasonAttrs.winp", "asc").slice(0, 5);
	}

	let orderedTeams = orderBy(teams, ["region", "name", "tid"]);
	if (expansion) {
		// User team first!
		const userTeam = teams.find(t => t.tid === g.get("userTid"));
		if (userTeam) {
			orderedTeams = [userTeam, ...orderedTeams.filter(t => t !== userTeam)];
		}
	}

	const finalTeams = orderedTeams.map(t => ({
		...t,
		ovr: 0,
	}));
	for (const t of finalTeams) {
		t.ovr = await getTeamOvr(t.tid);
	}

	return {
		confs: g.get("confs", "current"),
		disabled,
		expansion,
		gameOver: g.get("gameOver"),
		godMode: g.get("godMode"),
		numActiveTeams,
		numPlayoffRounds: g.get("numGamesPlayoffSeries", "current").length,
		otherTeamsWantToHire,
		phase: g.get("phase"),
		teams: finalTeams,
		userTid: g.get("userTid"),
	};
};

export default updateTeamSelect;
