import { g } from "../../util";
import moodInfo from "./moodInfo";
import type { Player } from "../../../common/types";

// Computes moodInfo for both userTid and current team
const moodInfos = async (
	p: Player,
	overrides: {
		contractAmount?: number;
	} = {},
) => {
	const userTid = g.get("userTid");

	const user = await moodInfo(p, userTid, overrides);

	let current;
	if (p.tid === userTid) {
		current = user;
	} else if (p.tid >= 0) {
		current = await moodInfo(p, p.tid, overrides);
	}

	return {
		user,
		current,
	};
};

export default moodInfos;
