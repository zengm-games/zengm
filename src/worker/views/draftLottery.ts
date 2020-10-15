import { PHASE, NO_LOTTERY_DRAFT_TYPES } from "../../common";
import { draft } from "../core";
import { idb } from "../db";
import { g } from "../util";
import type {
	UpdateEvents,
	DraftLotteryResultArray,
	ViewInput,
	DraftType,
	DraftLotteryResult,
} from "../../common/types";

const updateDraftLottery = async (
	{ season }: ViewInput<"draftLottery">,
	updateEvents: UpdateEvents,
	state: any,
): Promise<{
	challengeWarning?: boolean;
	notEnoughTeams?: boolean;
	draftType?: DraftType | "dummy";
	result: DraftLotteryResultArray | undefined;
	season: number;
	showExpansionTeamMessage: boolean;
	type: "completed" | "projected" | "readyToRun";
	userTid: number;
} | void> => {
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("newPhase") ||
		season !== state.season ||
		(season === g.get("season") && updateEvents.includes("gameSim"))
	) {
		let showExpansionTeamMessage = false;
		if (season === g.get("season")) {
			const teams = await idb.cache.teams.getAll();
			for (const t of teams) {
				if (
					t.firstSeasonAfterExpansion !== undefined &&
					t.firstSeasonAfterExpansion - 1 === g.get("season")
				) {
					showExpansionTeamMessage = true;
					break;
				}
			}
		}

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

				let draftType: DraftLotteryResult["draftType"] | undefined;

				if (draftLotteryResult) {
					draftType = draftLotteryResult.draftType || "nba1994";
				}

				return {
					draftType,
					result,
					season,
					showExpansionTeamMessage,
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
					showExpansionTeamMessage,
					type: "completed",
					userTid: g.get("userTid"),
				};
			}
		}

		if (NO_LOTTERY_DRAFT_TYPES.includes(g.get("draftType"))) {
			return {
				draftType: g.get("draftType"),
				result: undefined,
				season,
				showExpansionTeamMessage,
				type: "projected",
				userTid: g.get("userTid"),
			};
		}

		// View projected draft lottery for this season
		let draftLotteryResult;
		try {
			draftLotteryResult = await draft.genOrderNBA(true);
		} catch (error) {
			console.log(error);
			if (!(error as any).notEnoughTeams) {
				throw error;
			}
		}

		if (draftLotteryResult) {
			for (const pick of draftLotteryResult.result) {
				pick.pick = undefined;
			}
		}

		const type =
			season === g.get("season") && g.get("phase") === PHASE.DRAFT_LOTTERY
				? "readyToRun"
				: "projected";

		return {
			challengeWarning:
				!draftLotteryResult &&
				g.get("challengeNoDraftPicks") &&
				g.get("userTids").length > 0,
			notEnoughTeams: !draftLotteryResult,
			draftType: draftLotteryResult
				? draftLotteryResult.draftType
				: "noLottery",
			result: draftLotteryResult ? draftLotteryResult.result : undefined,
			season: draftLotteryResult ? draftLotteryResult.season : season,
			showExpansionTeamMessage,
			type,
			userTid: g.get("userTid"),
		};
	}
};

export default updateDraftLottery;
