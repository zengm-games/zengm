import { idb } from "../db";
import { g } from "../util";

const updateTeamInfo = async () => {
	const teams = (
		await idb.getCopies.teamsPlus({
			attrs: ["tid", "abbrev", "region", "name", "imgURL", "colors", "did"],
			seasonAttrs: ["pop", "stadiumCapacity"],
			season: g.get("season"),
		})
	).map(t => {
		return {
			tid: t.tid,
			abbrev: t.abbrev,
			region: t.region,
			name: t.name,
			imgURL: t.imgURL,
			colors: t.colors,
			pop: parseFloat(t.seasonAttrs.pop.toFixed(6)),
			stadiumCapacity: t.seasonAttrs.stadiumCapacity,
			did: t.did,
		};
	});

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
