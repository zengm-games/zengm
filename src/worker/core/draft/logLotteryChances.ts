import logAction from "./logAction";
import logLotteryTxt from "./logLotteryTxt";
import type {
	Conditions,
	DraftPickWithoutKey,
	TeamFiltered,
} from "../../../common/types";

const logLotteryChances = (
	chances: number[],
	teams: TeamFiltered<["tid"]>[],
	draftPicksIndexed: DraftPickWithoutKey[][],
	conditions?: Conditions,
) => {
	for (let i = 0; i < chances.length; i++) {
		if (i < teams.length) {
			const originalTid = teams[i].tid;
			const dp = draftPicksIndexed[originalTid]?.[1];

			if (dp) {
				const tid = dp.tid;
				const txt = logLotteryTxt(tid, "chance", chances[i]);
				logAction(tid, txt, 0, conditions);
			}
		}
	}
};

export default logLotteryChances;
