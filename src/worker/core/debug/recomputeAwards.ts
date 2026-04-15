import { idb } from "../../db/index.ts";
import doAwards from "../season/doAwards.football.ts";

const recomputeHallOfFame = async () => {
	const allAwards = await idb.getCopies.awards();
	for (const awards of allAwards) {
		console.log(awards.season);
		await doAwards(awards.season, {});
	}
	console.log("Done");
};

export default recomputeHallOfFame;
