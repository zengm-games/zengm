import { idb } from "../../db";
import { g } from "../../util";

const draftUser = async (pid: number): Promise<boolean> => {
	const allStars = await idb.cache.allStars.get(g.get("season"));
	if (!allStars) {
		throw new Error("allStars not found");
	}

	const pick = allStars.remaining.find(p => p.pid === pid);
	if (!pick) {
		throw new Error("Player not found");
	}

	const teamInd = allStars.teams[0].length > allStars.teams[1].length ? 1 : 0;
	allStars.teams[teamInd].push(pick);
	allStars.remaining = allStars.remaining.filter(p => p.pid !== pick.pid);

	if (allStars.remaining.every(({ injured }) => injured)) {
		allStars.finalized = true;
	}

	await idb.cache.allStars.put(allStars);
	return allStars.finalized;
};

export default draftUser;
