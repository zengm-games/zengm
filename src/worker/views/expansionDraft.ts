import { g, helpers, newLeagueGodModeLimits } from "../util";
import getTeamInfos from "../../common/getTeamInfos";
import type { ExpansionDraftSetupTeam } from "../../common/types";
import { idb } from "../db";
import orderBy from "lodash-es/orderBy";
import getUnusedAbbrevs from "../../common/getUnusedAbbrevs";
import { bySport, DEFAULT_JERSEY } from "../../common";

const updateExpansionDraft = async () => {
	const expansionDraft = g.get("expansionDraft");
	if (expansionDraft.phase === "protection") {
		// https://stackoverflow.com/a/59923262/786644
		const returnValue = {
			redirectUrl: helpers.leagueUrl(["protect_players"]),
		};
		return returnValue;
	} else if (expansionDraft.phase === "draft") {
		// https://stackoverflow.com/a/59923262/786644
		const returnValue = {
			redirectUrl: helpers.leagueUrl(["draft"]),
		};
		return returnValue;
	}

	const currentTeams = g.get("teamInfoCache");
	const allAbbrevs = getUnusedAbbrevs(currentTeams);

	const divs = g.get("divs", "current");
	const div = divs.at(-1);
	const param = allAbbrevs.map(abbrev => ({
		tid: -1,
		cid: div.cid,
		did: div.did,
		abbrev,
	}));

	const builtInTeams: ExpansionDraftSetupTeam[] = getTeamInfos(param).map(
		t => ({
			abbrev: t.abbrev,
			region: t.region,
			name: t.name,
			imgURL: t.imgURL,
			imgURLSmall: t.imgURLSmall,
			colors: t.colors,
			jersey: t.jersey,
			pop: String(t.pop),
			stadiumCapacity: String(g.get("defaultStadiumCapacity")),
			did: String(t.did),
			takeControl: false,
		}),
	);

	const disabledTeams = (await idb.cache.teams.getAll()).filter(
		t => t.disabled,
	);
	for (const t of disabledTeams) {
		builtInTeams.push({
			abbrev: t.abbrev,
			region: t.region,
			name: t.name,
			imgURL: t.imgURL,
			imgURLSmall: t.imgURLSmall,
			colors: t.colors,
			jersey: t.jersey ?? DEFAULT_JERSEY,
			pop: String(t.pop ?? 1),
			stadiumCapacity: String(
				t.stadiumCapacity !== undefined
					? t.stadiumCapacity
					: g.get("defaultStadiumCapacity"),
			),
			did: String(t.did),
			takeControl: false,
			tid: t.tid,
		});
	}

	const initialTeams = expansionDraft.teams ?? [];
	const initialNumPerTeam =
		expansionDraft.numPerTeam ??
		String(
			helpers.getExpansionDraftMinimumPlayersPerActiveTeam(
				initialTeams.length,
				g.get("minRosterSize"),
				g.get("numActiveTeams"),
			),
		);

	const godModeLimits = newLeagueGodModeLimits();

	const defaultNumProtectedPlayers = bySport({
		hockey: Math.max(g.get("minRosterSize") - 4, 0),
		default: g.get("minRosterSize"),
	});

	return {
		builtInTeams: orderBy(builtInTeams, ["region", "name", "tid"]),
		confs: g.get("confs"),
		defaultNumProtectedPlayers,
		divs: g.get("divs"),
		godMode: g.get("godMode"),
		godModeLimits,
		initialTeams,
		initialNumPerTeam,
		initialNumProtectedPlayers:
			expansionDraft.numProtectedPlayers ?? String(defaultNumProtectedPlayers),
		minRosterSize: g.get("minRosterSize"),
		multiTeamMode: g.get("userTids").length > 1,
		numActiveTeams: g.get("numActiveTeams"),
		phase: g.get("phase"),
	};
};

export default updateExpansionDraft;
