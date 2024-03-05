import { PHASE } from "../../../common";
import { idb } from "../../db";
import { g } from "../../util";

const ensureValidDivsConfs = async () => {
	const divs = g.get("divs");
	const confs = g.get("confs");

	const teams = await idb.cache.teams.getAll();
	for (const t of teams) {
		const div = divs.find(d => d.did === t.did);
		const conf = confs.find(c => c.cid === t.cid);
		const divMatchesConf = div && conf ? conf.cid === div.cid : false;

		if (divMatchesConf) {
			// No update needed
			continue;
		}

		let newDid: number | undefined;
		let newCid: number | undefined;

		if (div) {
			// Move to correct conference based on did
			newCid = div.cid;
		} else if (conf) {
			// Put in last division of conference, if possible
			const potentialDivs = divs.filter(d => d.cid === conf.cid);
			if (potentialDivs.length > 0) {
				newDid = potentialDivs.at(-1)!.did;
			}
		}

		// If this hasn't resulted in a newCid or newDid, we need to pick a new one
		if (newDid === undefined && newCid === undefined) {
			const newDiv = divs.at(-1)!;
			newDid = newDiv.did;
			newCid = newDiv.cid;
		}

		if (newDid !== undefined) {
			t.did = newDid;
		}
		if (newCid !== undefined) {
			t.cid = newCid;
		}
		await idb.cache.teams.put(t);

		if (g.get("phase") < PHASE.PLAYOFFS) {
			const teamSeason = await idb.cache.teamSeasons.indexGet(
				"teamSeasonsByTidSeason",
				[t.tid, g.get("season")],
			);

			if (teamSeason) {
				// Also apply team info changes to this season
				if (newDid !== undefined) {
					teamSeason.did = newDid;
				}
				if (newCid !== undefined) {
					teamSeason.cid = newCid;
				}

				await idb.cache.teamSeasons.put(teamSeason);
			}
		}
	}
};

export default ensureValidDivsConfs;
