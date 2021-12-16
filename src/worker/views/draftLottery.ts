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
	GameAttributesLeague,
} from "../../common/types";
import { draftHasLottey, getLotteryInfo } from "../core/draft/genOrder";

const getNumToPick = (
	draftType: DraftType | "dummy" | undefined,
	numLotteryTeams: number,
) => {
	if (draftHasLottey(draftType)) {
		return getLotteryInfo(draftType, numLotteryTeams).numToPick;
	}

	return 0;
};

const updateDraftLottery = async (
	{ season }: ViewInput<"draftLottery">,
	updateEvents: UpdateEvents,
	state: any,
): Promise<{
	challengeWarning?: boolean;
	notEnoughTeams?: boolean;
	draftType?: DraftType | "dummy";
	godMode?: boolean;
	numToPick: number;
	result: DraftLotteryResultArray | undefined;
	rigged: GameAttributesLeague["riggedLottery"];
	season: number;
	showExpansionTeamMessage: boolean;
	type: "completed" | "projected" | "readyToRun";
	userTid: number;
} | void> => {
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("newPhase") ||
		season !== state.season ||
		(season === g.get("season") &&
			(updateEvents.includes("gameSim") ||
				updateEvents.includes("gameAttributes")))
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
			const draftLotteryResult = await idb.getCopy.draftLotteryResults(
				{
					season,
				},
				"noCopyCache",
			);

			// If season === g.get("season") && g.get("phase") === PHASE.DRAFT_LOTTERY, this will be undefined if the lottery is not done yet
			if (draftLotteryResult || g.get("phase") > PHASE.DRAFT_LOTTERY) {
				const result = draftLotteryResult
					? draftLotteryResult.result
					: undefined; // Past lotteries before draftLotteryResult.draftType were all 1994

				let draftType: DraftLotteryResult["draftType"] | undefined;
				let rigged: GameAttributesLeague["riggedLottery"];

				if (draftLotteryResult) {
					draftType = draftLotteryResult.draftType || "nba1994";
					rigged = draftLotteryResult.rigged;
				}

				return {
					draftType,
					numToPick: getNumToPick(draftType, result ? result.length : 14),
					result,
					rigged,
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
					numToPick: 0,
					result: undefined,
					rigged: undefined,
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
				numToPick: 0,
				result: undefined,
				rigged: undefined,
				season,
				showExpansionTeamMessage,
				type: "projected",
				userTid: g.get("userTid"),
			};
		}

		// View projected draft lottery for this season
		let draftLotteryResult;
		try {
			draftLotteryResult = await draft.genOrder(true);
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

		const draftType = draftLotteryResult
			? draftLotteryResult.draftType
			: "noLottery";

		return {
			challengeWarning:
				!draftLotteryResult &&
				g.get("challengeNoDraftPicks") &&
				g.get("userTids").length > 0,
			notEnoughTeams: !draftLotteryResult,
			draftType,
			godMode: g.get("godMode"),
			numToPick: getNumToPick(
				draftType,
				draftLotteryResult ? draftLotteryResult.result.length : 14,
			),
			result: draftLotteryResult ? draftLotteryResult.result : undefined,
			rigged: g.get("riggedLottery"),
			season: draftLotteryResult ? draftLotteryResult.season : season,
			showExpansionTeamMessage,
			type,
			userTid: g.get("userTid"),
		};
	}
};

export default updateDraftLottery;
