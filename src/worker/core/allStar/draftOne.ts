import { idb } from "../../db";
import { g } from "../../util";
import type { AllStarPlayer } from "../../../common/types";

const draftOne = async (
	allowNone?: boolean,
): Promise<{
	finalized: boolean;
	pid?: number;
}> => {
	const allStars = await idb.cache.allStars.get(g.get("season"));
	if (!allStars) {
		throw new Error("allStars not found");
	}

	if (allStars.finalized) {
		return {
			finalized: allStars.finalized,
		};
	}

	const teamInd = allStars.teams[0].length > allStars.teams[1].length ? 1 : 0;
	const remaining = allStars.remaining.filter(p => !p.injured);

	let pick: AllStarPlayer;
	const r = Math.random();
	if (r < 0.4 || remaining.length === 1) {
		pick = remaining[0];
	} else if (r < 0.7 || remaining.length === 2) {
		pick = remaining[1];
	} else if (r < 0.9 || remaining.length === 3) {
		pick = remaining[2];
	} else {
		pick = remaining[3];
	}

	if (!pick && !allowNone) {
		throw new Error("No player found");
	}

	if (pick) {
		allStars.teams[teamInd].push(pick);
		allStars.remaining = allStars.remaining.filter(p => p.pid !== pick.pid);
	}

	if (allStars.remaining.every(({ injured }) => injured)) {
		allStars.finalized = true;
	}

	await idb.cache.allStars.put(allStars);
	return {
		finalized: allStars.finalized,
		pid: pick?.pid,
	};
};

export default draftOne;
