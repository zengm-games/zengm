import { idb } from "../db";
import { g } from "../util";

const updateTeamInfo = async () => {
	const teams = (
		await idb.getCopies.teamsPlus({
			attrs: [
				"tid",
				"abbrev",
				"region",
				"name",
				"imgURL",
				"colors",
				"did",
				"pop",
				"stadiumCapacity",
			],
			seasonAttrs: ["pop", "stadiumCapacity"],
			season: g.get("season"),
		})
	).map(t => {
		if (t.pop === undefined) {
			t.pop = t.seasonAttrs.pop;
		}
		if (t.stadiumCapacity === undefined) {
			t.stadiumCapacity = t.seasonAttrs.stadiumCapacity;
		}

		return {
			tid: t.tid,
			abbrev: t.abbrev,
			region: t.region,
			name: t.name,
			imgURL: t.imgURL,
			colors: t.colors,
			pop: parseFloat(t.pop.toFixed(6)),
			stadiumCapacity: t.stadiumCapacity,
			did: t.did,
		};
	});

	return {
		defaultStadiumCapacity: g.get("defaultStadiumCapacity"),
		confs: g.get("confs", Infinity),
		divs: g.get("divs", Infinity),
		godMode: g.get("godMode"),
		numTeams: g.get("numTeams"),
		phase: g.get("phase"),
		teams,
	};
};

export default updateTeamInfo;
