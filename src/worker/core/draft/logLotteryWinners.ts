import logAction from "./logAction";
import logLotteryTxt from "./logLotteryTxt";
import type { Conditions, TeamFiltered } from "../../../common/types";

const logLotteryWinners = (
	teams: TeamFiltered<["tid"]>[],
	tm: number,
	origTm: number,
	pick: number,
	conditions?: Conditions,
) => {
	const idx = teams.findIndex(t => t.tid === origTm);

	if (idx >= 0) {
		const expectedPick = idx + 1;

		let txt;

		if (expectedPick > pick) {
			txt = logLotteryTxt(tm, "movedup", pick);
		} else if (expectedPick < pick) {
			txt = logLotteryTxt(tm, "moveddown", pick);
		} else {
			txt = logLotteryTxt(tm, "normal", pick);
		}

		let score = 0;
		if (pick === 1) {
			score = 20;
		} else if (pick <= 5) {
			score = 10;
		}

		logAction(tm, txt, score, conditions);
	}
};

export default logLotteryWinners;
