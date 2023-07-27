import { g, helpers } from "../util";
import getTeamInfos from "../../common/getTeamInfos";
import { idb } from "../db";
import { orderBy } from "lodash-es";

const getRealignInfo = (
	teams: {
		tid: number;
		cid: number;
		did: number;
		region: string;
		name: string;
	}[],
	override: {
		tid: number;
		region: string;
		name: string;
	},
) => {
	const current: {
		tid: number;
		region: string;
		name: string;
	}[][][] = [];

	for (const t of teams) {
		if (!current[t.cid]) {
			current[t.cid] = [];
		}
		if (!current[t.cid][t.did]) {
			current[t.cid][t.did] = [];
		}

		const t2 = t.tid === override.tid ? override : t;

		current[t.cid][t.did].push({
			tid: t2.tid,
			region: t2.region,
			name: t2.name,
		});
	}

	// Indexed on did, so there are gaps unless we filter out undefined. Then it's no longer indexed by did but that's fine.
	for (let cid = 0; cid < current.length; cid++) {
		current[cid] = current[cid]
			.filter(row => row !== undefined)
			.map(row => orderBy(row, ["region", "name"]));
	}

	return current;
};

const updateRelocate = async () => {
	const autoRelocate = g.get("autoRelocate");
	if (!autoRelocate) {
		// https://stackoverflow.com/a/59923262/786644
		const returnValue = {
			redirectUrl: helpers.leagueUrl([]),
		};
		return returnValue;
	}

	const t = await idb.cache.teams.get(autoRelocate.tid);
	if (!t) {
		throw new Error("Invalid tid");
	}

	const currentTeam = {
		tid: t.tid,
		abbrev: t.abbrev,
		region: t.region,
		name: t.name,
		imgURL: t.imgURL,
		pop: t.pop,
		colors: t.colors,
		jersey: t.jersey,
	};

	const newTeam: typeof currentTeam = getTeamInfos([
		{
			tid: t.tid,
			cid: -1,
			did: -1,
			abbrev: autoRelocate.abbrev,
		},
	])[0];

	const teams = (await idb.cache.teams.getAll()).filter(t => !t.disabled);

	let realignInfo:
		| undefined
		| {
				current: ReturnType<typeof getRealignInfo>;
				realigned: ReturnType<typeof getRealignInfo>;
		  };
	if (autoRelocate.realigned) {
		const current = getRealignInfo(teams, newTeam);
		const realigned: typeof current = [];

		const confs = g.get("confs");
		const divs = g.get("divs");

		for (const div of divs) {
			const tids = autoRelocate.realigned[div.did];
			if (tids) {
				const conf = confs[div.cid];
				if (!realigned[conf.cid]) {
					realigned[conf.cid] = [];
				}
				realigned[conf.cid].push(
					orderBy(
						tids.map(tid => {
							const t =
								tid === newTeam.tid ? newTeam : teams.find(t => t.tid === tid)!;
							return {
								tid,
								region: t.region,
								name: t.name,
							};
						}),
						["region", "name"],
					),
				);
			}
		}

		realignInfo = {
			current,
			realigned,
		};
	}

	return {
		autoRelocateRealign: g.get("autoRelocateRealign"),
		autoRelocateRebrand: g.get("autoRelocateRebrand"),
		currentTeam,
		godMode: g.get("godMode"),
		newTeam,
		realignInfo,
	};
};

export default updateRelocate;
