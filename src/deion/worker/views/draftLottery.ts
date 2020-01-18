import { PHASE } from "../../common";
import { draft } from "../core";
import { idb } from "../db";
import { g } from "../util";
import {
	UpdateEvents,
	DraftLotteryResultArray,
	ViewInput,
} from "../../common/types";

const updateDraftLottery = async (
	{ season }: ViewInput<"draftLottery">,
	updateEvents: UpdateEvents,
	state: any,
): Promise<{
	draftType: "nba1994" | "nba2019" | "noLottery" | "random";
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
		(season === g.season && updateEvents.includes("gameSim"))
	) {
		// View completed draft lottery
		if (
			season < g.season ||
			(season === g.season && g.phase >= PHASE.DRAFT_LOTTERY)
		) {
			const draftLotteryResult = await idb.getCopy.draftLotteryResults({
				season,
			});

			// If season === g.season && g.phase === PHASE.DRAFT_LOTTERY, this will be undefined if the lottery is not done yet
			if (draftLotteryResult || g.phase > PHASE.DRAFT_LOTTERY) {
				const result = draftLotteryResult
					? draftLotteryResult.result
					: undefined; // Past lotteries before draftLotteryResult.draftType were all 1994

				let draftType;

				if (draftLotteryResult) {
					draftType = draftLotteryResult.draftType || "nba1994";
				}

				return {
					draftType,
					result,
					season,
					ties: g.ties,
					type: "completed",
					userTid: g.userTid,
				};
			}

			if (season < g.season) {
				// Maybe there was no draft lottery done, or it was deleted from the database
				return {
					draftType: "noLottery",
					result: undefined,
					season,
					ties: g.ties,
					type: "completed",
					userTid: g.userTid,
				};
			}
		}

		// View projected draft lottery for this season
		const draftLotteryResult = await draft.genOrderNBA(true);

		for (const pick of draftLotteryResult.result) {
			pick.pick = undefined;
		}

		const type =
			season === g.season && g.phase === PHASE.DRAFT_LOTTERY
				? "readyToRun"
				: "projected";
		return {
			draftType: draftLotteryResult.draftType,
			result: draftLotteryResult.result,
			season: draftLotteryResult.season,
			ties: g.ties,
			type,
			userTid: g.userTid,
		};
	}
};

export default updateDraftLottery;
