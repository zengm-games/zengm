import { idb } from "../db";
import type { ViewInput, RealTeamInfo } from "../../common/types";
import { getNewLeagueLid, newLeagueGodModeLimits } from "../util";

const updateNewLeague = async ({ lid, type }: ViewInput<"newLeague">) => {
	const godModeLimits = newLeagueGodModeLimits();

	if (lid !== undefined) {
		// Importing!
		const l = await idb.meta.get("leagues", lid);

		if (l) {
			return {
				lid,
				difficulty: l.difficulty,
				name: l.name,
				type,
				godModeLimits,
			};
		}
	}

	// Find most recent league and add one to the LID
	const newLid = await getNewLeagueLid();

	const realTeamInfo = (await idb.meta.get("attributes", "realTeamInfo")) as
		| RealTeamInfo
		| undefined;

	return {
		lid: undefined,
		difficulty: undefined,
		name: `League ${newLid}`,
		realTeamInfo,
		type,
		godModeLimits,
	};
};

export default updateNewLeague;
