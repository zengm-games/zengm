import { g, logEvent } from "../../util";
import type { Team } from "../../../common/types";
import generate from "./generate";
import genSeasonRow from "./genSeasonRow";
import genStatsRow from "./genStatsRow";
import { draft, league, finances } from "..";
import { idb } from "../../db";
import { PHASE } from "../../../common";

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
		numTeams: g.get("numTeams") + 1,
		teamAbbrevsCache: [...g.get("teamAbbrevsCache"), t.abbrev],
		teamRegionsCache: [...g.get("teamRegionsCache"), t.region],
		teamNamesCache: [...g.get("teamNamesCache"), t.name],
		teamImgURLsCache: [...g.get("teamImgURLsCache"), t.imgURL],
	});

	const dpOffset = g.get("phase") > PHASE.DRAFT ? 1 : 0;
	for (let i = 0; i < g.get("numSeasonsFutureDraftPicks"); i++) {
		const draftYear = g.get("season") + dpOffset + i;

		for (let round = 1; round <= g.get("numDraftRounds"); round++) {
			await idb.cache.draftPicks.put({
				tid: t.tid,
				originalTid: t.tid,
				round,
				pick: 0,
				season: draftYear,
			});
		}
	}

	// Add new draft prospects to draft classes
	for (let i = 0; i < 3; i++) {
		const draftYear = g.get("season") + dpOffset + i;

		await draft.genPlayers(draftYear, undefined, g.get("numDraftRounds"));
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
