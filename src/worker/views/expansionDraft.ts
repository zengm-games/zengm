import { g, helpers } from "../util";
import teamInfos from "../../common/teamInfos";
import getTeamInfos from "../../common/getTeamInfos";
import type { ExpansionDraftSetupTeam } from "../../common/types";
import { idb } from "../db";
import orderBy from "lodash/orderBy";

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
	const allAbbrevs: string[] = [];
	for (const [abbrev, t] of Object.entries(teamInfos)) {
		const blacklist = [...allAbbrevs, ...currentTeams.map(t => t.abbrev)];

		// Handle a couple teams with multiple abbrevs
		if (blacklist.includes("LA") && abbrev === "LAC") {
			continue;
		}
		if (blacklist.includes("LA") && abbrev === "LAE") {
			continue;
		}
		if (blacklist.includes("LAC") && abbrev === "LA") {
			continue;
		}
		if (blacklist.includes("LAC") && abbrev === "LAE") {
			continue;
		}
		if (blacklist.includes("LAE") && abbrev === "LA") {
			continue;
		}
		if (blacklist.includes("LAE") && abbrev === "LAC") {
			continue;
		}
		if (blacklist.includes("GS") && abbrev === "SF") {
			continue;
		}
		if (blacklist.includes("SF") && abbrev === "GS") {
			continue;
		}

		if (blacklist.includes(abbrev)) {
			continue;
		}

		const currentTeam = currentTeams.find(t2 => t2.region === t.region);
		if (currentTeam) {
			continue;
		}

		allAbbrevs.push(abbrev);
	}

	const divs = g.get("divs", "current");
	const div = divs[divs.length - 1];
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
			colors: t.colors,
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
			colors: t.colors,
			pop: String(t.pop !== undefined ? t.pop : 1),
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

	return {
		builtInTeams: orderBy(builtInTeams, ["region", "name", "tid"]),
		confs: g.get("confs"),
		divs: g.get("divs"),
		godMode: g.get("godMode"),
		initialTeams: expansionDraft.teams || [],
		initialNumProtectedPlayers:
			expansionDraft.numProtectedPlayers || String(g.get("minRosterSize")),
		minRosterSize: g.get("minRosterSize"),
		multiTeamMode: g.get("userTids").length > 1,
		phase: g.get("phase"),
	};
};

export default updateExpansionDraft;
