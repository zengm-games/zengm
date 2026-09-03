import { idb } from "../../db/index.ts";

const recomputeAwards = async () => {
	const allAwards = await idb.getCopies.awards();
	for (const awards of allAwards) {
		console.log(awards.season);
		throw new Error("Not implemented");
		//await doAwards(awards.season);
	}
	console.log("Done");
};

export default recomputeAwards;
