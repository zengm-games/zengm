import { PHASE } from "../../common";
import { draft } from "../core";
import { idb } from "../db";
import { g } from "../util";
import {
	UpdateEvents,
	DraftLotteryResultArray,
	ViewInput,
	DraftType,
} from "../../common/types";

const updateDraftLottery = async (
	{ season }: ViewInput<"draftLottery">,
	updateEvents: UpdateEvents,
	state: any,
): Promise<{
	draftType?: DraftType;
	result: DraftLotteryResultArray | undefined;
	season: number;
	ties: boolean;
	type: "completed" | "projected" | "readyToRun";
	userTid: number;
} | void> => {
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("newPhase") ||
		season !== state.season ||
		(season === g.get("season") && updateEvents.includes("gameSim"))
	) {
		// View completed draft lottery
		if (
			season < g.get("season") ||
			(season === g.get("season") && g.get("phase") >= PHASE.DRAFT_LOTTERY)
		) {
			const draftLotteryResult = await idb.getCopy.draftLotteryResults({
				season,
			});

			// If season === g.get("season") && g.get("phase") === PHASE.DRAFT_LOTTERY, this will be undefined if the lottery is not done yet
			if (draftLotteryResult || g.get("phase") > PHASE.DRAFT_LOTTERY) {
				const result = draftLotteryResult
					? draftLotteryResult.result
					: undefined; // Past lotteries before draftLotteryResult.draftType were all 1994

				let draftType: DraftType | undefined;

				if (draftLotteryResult) {
					draftType = draftLotteryResult.draftType || "nba1994";
				}

				return {
					draftType,
					result,
					season,
					ties: g.get("ties"),
					type: "completed",
					userTid: g.get("userTid"),
				};
			}

			if (season < g.get("season")) {
				// Maybe there was no draft lottery done, or it was deleted from the database
				return {
					draftType: "noLottery",
					result: undefined,
					season,
					ties: g.get("ties"),
					type: "completed",
					userTid: g.get("userTid"),
				};
			}
		}

		// View projected draft lottery for this season
		const draftLotteryResult = await draft.genOrderNBA(true);

		for (const pick of draftLotteryResult.result) {
			pick.pick = undefined;
		}

		const type =
			season === g.get("season") && g.get("phase") === PHASE.DRAFT_LOTTERY
				? "readyToRun"
				: "projected";
		return {
			draftType: draftLotteryResult.draftType,
			result: draftLotteryResult.result,
			season: draftLotteryResult.season,
			ties: g.get("ties"),
			type,
			userTid: g.get("userTid"),
		};
	}
};

export default updateDraftLottery;
