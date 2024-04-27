import { idb } from "../db";
import { g, helpers } from "../util";
import { PHASE } from "../../common";
import { season, team } from "../core";
import { orderBy } from "../../common/utils";
import { getHistoryTeam } from "./teamHistory";
import { getPlayoffsByConfBySeason } from "./frivolitiesTeamSeasons";

export const getTeamOvr = async (tid: number) => {
	const playersAll = await idb.cache.players.indexGetAll("playersByTid", tid);
	const players = await idb.getCopies.playersPlus(playersAll, {
		attrs: ["value", "pid"],
		ratings: ["ovr", "pot", "ovrs", "pos"],
		season: g.get("season"),
		tid,
		showNoStats: true,
		showRookies: true,
		fuzz: true,
	});
	return team.ovr(players);
};

const addHistoryAndPicksAndPlayers = async <T extends { tid: number }>(
	teams: T[],
) => {
	const teamsAugmented = [];

	const playoffsByConfBySeason = await getPlayoffsByConfBySeason();
	for (const t of teams) {
		const teamSeasons = await idb.getCopies.teamSeasons(
			{
				tid: t.tid,
			},
			"noCopyCache",
		);

		const historyTotal = getHistoryTeam(teamSeasons, playoffsByConfBySeason);
		const historyUser = getHistoryTeam(
			teamSeasons.filter(
				teamSeason => g.get("userTid", teamSeason.season) === teamSeason.tid,
			),
			playoffsByConfBySeason,
		);

		const draftPicksRaw = await idb.getCopies.draftPicks(
			{
				tid: t.tid,
			},
			"noCopyCache",
		);

		const draftPicks = await Promise.all(
			draftPicksRaw.map(async dp => {
				return {
					...dp,
					desc: await helpers.pickDesc(dp),
				};
			}),
		);

		const playersRaw = await idb.cache.players.indexGetAll(
			"playersByTid",
			t.tid,
		);
		const players = orderBy(
			await idb.getCopies.playersPlus(playersRaw, {
				attrs: [
					"pid",
					"firstName",
					"lastName",
					"age",
					"watch",
					"value",
					"draft",
				],
				ratings: ["ovr", "pot", "dovr", "dpot", "pos", "skills", "ovrs"],
				season: g.get("season"),
				fuzz: true,
				showNoStats: true,
				showRookies: true,
			}),
			"value",
			"desc",
		).slice(0, 5);

		teamsAugmented.push({
			...t,
			total: {
				won: historyTotal.totalWon,
				lost: historyTotal.totalLost,
				tied: historyTotal.totalTied,
				otl: historyTotal.totalOtl,
				winp: historyTotal.totalWinp,
				finalsAppearances: historyTotal.finalsAppearances,
				championships: historyTotal.championships,
				lastChampionship: historyTotal.lastChampionship,
			},
			user: {
				won: historyUser.totalWon,
				lost: historyUser.totalLost,
				tied: historyUser.totalTied,
				otl: historyUser.totalOtl,
				winp: historyUser.totalWinp,
				finalsAppearances: historyUser.finalsAppearances,
				championships: historyUser.championships,
				lastChampionship: historyUser.lastChampionship,
			},
			draftPicks,
			players,
		});
	}

	return teamsAugmented;
};

const updateTeamSelect = async () => {
	const rawTeams = await idb.getCopies.teamsPlus(
		{
			attrs: [
				"tid",
				"region",
				"name",
				"pop",
				"imgURL",
				"imgURLSmall",
				"cid",
				"abbrev",
			],
			seasonAttrs: [
				"winp",
				"won",
				"lost",
				"tied",
				"otl",
				"season",
				"playoffRoundsWon",
				"revenue",
			],
			season: g.get("season"),
			active: true,
			addDummySeason: true,
		},
		"noCopyCache",
	);

	const teamsAll = helpers.addPopRank(rawTeams);

	const numActiveTeams = teamsAll.length;

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

	// Remove user's team (no re-hiring immediately after firing)
	let teams = teamsAll.filter(t => t.tid !== g.get("userTid"));

	if (expansion) {
		// User team will always be first, cause expansion teams are at the end of the teams list
		teams = teams.filter(t => expansionTids.includes(t.tid));
	} else if (otherTeamsWantToHire) {
		// Deterministic random selection of teams
		teams = orderBy(teams, t => t.seasonAttrs.revenue % 10, "asc").slice(0, 5);
	} else if (!g.get("godMode")) {
		// If not in god mode, user must have been fired or team folded

		// Only get option of 5 worst
		teams = orderBy(teams, t => t.seasonAttrs.winp, "asc").slice(0, 5);
	}

	let orderedTeams = orderBy(teams, ["region", "name", "tid"]);
	if ((expansion && !g.get("gameOver")) || otherTeamsWantToHire) {
		// User team first!
		const userTeam = teamsAll.find(t => t.tid === g.get("userTid"));
		if (userTeam) {
			orderedTeams = [userTeam, ...orderedTeams.filter(t => t !== userTeam)];
		}
	}

	const teamsWithOvr = orderedTeams.map(t => ({
		...t,
		ovr: 0,
	}));
	for (const t of teamsWithOvr) {
		t.ovr = await getTeamOvr(t.tid);
	}

	const finalTeams = await addHistoryAndPicksAndPlayers(teamsWithOvr);

	const playoffsByConf = await season.getPlayoffsByConf(g.get("season"));

	return {
		challengeNoRatings: g.get("challengeNoRatings"),
		confs: g.get("confs", "current"),
		disabled,
		expansion,
		gameOver: g.get("gameOver"),
		godMode: g.get("godMode"),
		numActiveTeams,
		numPlayoffRounds: g.get("numGamesPlayoffSeries", "current").length,
		otherTeamsWantToHire,
		phase: g.get("phase"),
		playoffsByConf,
		season: g.get("season"),
		teams: finalTeams,
		userTid: g.get("userTid"),
	};
};

export default updateTeamSelect;
