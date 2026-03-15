import { idb } from "../../db/index.ts";
import doAwards from "../season/doAwards.football.ts";

const recomputeHallOfFame = async () => {
	const allAwards = await idb.getCopies.awards();
	for (const awards of allAwards) {
		await doAwards(awards.season, {});
	}
};

export default recomputeHallOfFame;
