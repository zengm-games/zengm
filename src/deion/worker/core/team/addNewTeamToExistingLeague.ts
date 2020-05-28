import { g, logEvent, helpers } from "../../util";
import type { Team } from "../../../common/types";
import generate from "./generate";
import genSeasonRow from "./genSeasonRow";
import genStatsRow from "./genStatsRow";
import { draft, league, finances } from "..";
import { idb } from "../../db";
import { PHASE, PLAYER } from "../../../common";

const addNewTeamToExistingLeague = async (
	teamInfo: {
		did: number;
		region: string;
		name: string;
		abbrev: string;
		pop: number;
		imgURL: string | undefined;
		firstSeasonAfterExpansion?: number;
	},
	expansionDraft: boolean = false,
): Promise<Team> => {
	const div = g.get("divs", Infinity).find(d => d.did === teamInfo.did);
	if (!div) {
		throw new Error("Invalid division");
	}
	const cid = div.cid;

	const t = generate({
		tid: g.get("numTeams"),
		cid,
		...teamInfo,
	});
	await idb.cache.teams.put(t);

	if (g.get("phase") <= PHASE.PLAYOFFS) {
		const teamSeason = genSeasonRow(t);
		const teamStats = genStatsRow(t.tid);
		await idb.cache.teamSeasons.put(teamSeason);
		await idb.cache.teamStats.put(teamStats);
	}

	await league.setGameAttributes({
		numActiveTeams: g.get("numActiveTeams") + 1,
		numTeams: g.get("numTeams") + 1,
		teamInfoCache: [
			...g.get("teamInfoCache"),
			{
				abbrev: t.abbrev,
				disabled: false,
				imgURL: t.imgURL,
				name: t.name,
				region: t.region,
			},
		],
	});

	await draft.createTeamPicks(t.tid);

	// Add new draft prospects to draft classes
	const draftClassTargetSize = Math.round(
		(g.get("numDraftRounds") * g.get("numActiveTeams") * 7) / 6,
	);
	const draftProspects = await idb.cache.players.indexGetAll(
		"playersByTid",
		PLAYER.UNDRAFTED,
	);

	const dpOffset = g.get("phase") > PHASE.DRAFT ? 1 : 0;
	for (let i = 0; i < 3; i++) {
		const draftYear = g.get("season") + dpOffset + i;

		const numPlayersAlreadyInDraftClass = draftProspects.filter(
			p => p.draft.year === draftYear,
		).length;

		const numNeeded = helpers.bound(
			draftClassTargetSize - numPlayersAlreadyInDraftClass,
			0,
			g.get("numDraftRounds"),
		);
		if (numNeeded > 0) {
			// Generate scrubs only!
			await draft.genPlayers(draftYear, undefined, numNeeded, true);
		}
	}

	await finances.updateRanks(["budget"]);

	logEvent({
		text: `A new team called the ${t.region} ${t.name} was created${
			expansionDraft ? " in an expansion draft" : ""
		}.`,
		type: "newTeam",
		tids: [t.tid],
		showNotification: false,
	});

	return t;
};

export default addNewTeamToExistingLeague;
