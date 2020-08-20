import { idb } from "../db";
import { g } from "../util";
import orderBy from "lodash/orderBy";

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
				"disabled",
			],
			seasonAttrs: ["pop", "stadiumCapacity"],
			season: g.get("season"),
			addDummySeason: true,
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
			disabled: t.disabled,
		};
	});

	return {
		defaultStadiumCapacity: g.get("defaultStadiumCapacity"),
		confs: g.get("confs"),
		divs: g.get("divs"),
		godMode: g.get("godMode"),
		phase: g.get("phase"),
		teams: orderBy(teams, ["region", "name", "tid"]),
	};
};

export default updateTeamInfo;
