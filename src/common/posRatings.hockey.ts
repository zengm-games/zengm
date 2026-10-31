import type { RatingKey } from "./types.hockey.ts";

const posRatings = (pos: string): RatingKey[] => {
	if (pos === "G") {
		return ["glk"];
	}

	if (pos === "D") {
		return ["pss", "wst", "sst", "stk", "oiq", "chk", "blk", "diq"];
	}

	return ["pss", "wst", "sst", "stk", "oiq", "chk", "blk", "fcf", "diq"];
};

export default posRatings;
