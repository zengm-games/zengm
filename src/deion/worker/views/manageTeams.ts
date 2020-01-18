import { idb } from "../db";
import { g } from "../util";

const updateTeamInfo = async () => {
	const teams = await idb.getCopies.teamsPlus({
		attrs: ["tid", "abbrev", "region", "name", "imgURL", "colors"],
		seasonAttrs: ["pop", "stadiumCapacity"],
		season: g.get("season"),
	});

	for (const t of teams) {
		t.pop = parseFloat(t.seasonAttrs.pop.toFixed(6));
		t.stadiumCapacity = t.seasonAttrs.stadiumCapacity;
		delete t.seasonAttrs;
	}

	return {
		defaultStadiumCapacity: g.get("defaultStadiumCapacity"),
		confs: g.get("confs"),
		divs: g.get("divs"),
		godMode: g.get("godMode"),
		numTeams: g.get("numTeams"),
		phase: g.get("phase"),
		teams,
	};
};

export default updateTeamInfo;
