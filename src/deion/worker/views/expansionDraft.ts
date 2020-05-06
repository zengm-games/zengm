import { g, helpers } from "../util";

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

	return {
		confs: g.get("confs", Infinity),
		divs: g.get("divs", Infinity),
		initialTeams: expansionDraft.teams || [],
		initialNumProtectedPlayers:
			expansionDraft.numProtectedPlayers || String(g.get("minRosterSize")),
		minRosterSize: g.get("minRosterSize"),
		multiTeamMode: g.get("userTids").length > 1,
		phase: g.get("phase"),
	};
};

export default updateExpansionDraft;
