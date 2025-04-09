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
	DraftPick,
	TeamFiltered,
} from "../../common/types";
import { getNumToPick } from "../core/draft/genOrder";
import { groupByUnique, orderBy } from "../../common/utils";

const updateDraftLottery = async (
	{ season }: ViewInput<"draftLottery">,
	updateEvents: UpdateEvents,
	state: any,
): Promise<
	| {
			challengeWarning: boolean;
			notEnoughTeams: boolean;
			draftPicks: DraftPick[] | undefined;
			draftType?: DraftType | "dummy";
			dpidsAvailableToTrade: Set<number>;
			godMode: boolean;
			numToPick: number;
			result: DraftLotteryResultArray | undefined;
			rigged: GameAttributesLeague["riggedLottery"];
			season: number;
			showExpansionTeamMessage: boolean;
			spectator: boolean;
			teams: Record<
				string,
				| TeamFiltered<
						["tid"],
						[
							"won",
							"lost",
							"tied",
							"otl",
							"pts",
							"abbrev",
							"imgURL",
							"imgURLSmall",
						],
						undefined,
						number
				  >
				| undefined
			>;
			type: "completed" | "projected" | "readyToRun";
			usePts: boolean;
			userTid: number;
	  }
	| undefined
> => {
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

		const dpidsAvailableToTrade = new Set(
			(
				await idb.cache.draftPicks.indexGetAll("draftPicksBySeason", season)
			).map((dp) => dp.dpid),
		);

		const teams = groupByUnique(
			await idb.getCopies.teamsPlus({
				attrs: ["tid"],
				seasonAttrs: [
					"won",
					"lost",
					"tied",
					"otl",
					"pts",
					"abbrev",
					"imgURL",
					"imgURLSmall",
				],
				season,
			}),
			"tid",
		);

		const pointsFormula = g.get("pointsFormula", season);
		const usePts = pointsFormula !== "";

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
					draftType = draftLotteryResult.draftType ?? "nba1994";
					rigged = draftLotteryResult.rigged;
				}

				return {
					dpidsAvailableToTrade,
					draftPicks: undefined,
					draftType,
					numToPick: getNumToPick(draftType, result ? result.length : 14),
					result,
					rigged,
					season,
					showExpansionTeamMessage,
					spectator: g.get("spectator"),
					teams,
					type: "completed",
					usePts,
					userTid: g.get("userTid"),
					challengeWarning: false,
					notEnoughTeams: false,
					godMode: g.get("godMode"),
				};
			}

			if (season < g.get("season")) {
				// Maybe there was no draft lottery done, or it was deleted from the database
				return {
					dpidsAvailableToTrade,
					draftPicks: undefined,
					draftType: "noLottery",
					numToPick: 0,
					result: undefined,
					rigged: undefined,
					season,
					showExpansionTeamMessage,
					spectator: g.get("spectator"),
					teams,
					type: "completed",
					usePts,
					userTid: g.get("userTid"),
					challengeWarning: false,
					notEnoughTeams: false,
					godMode: g.get("godMode"),
				};
			}
		}

		if (NO_LOTTERY_DRAFT_TYPES.includes(g.get("draftType"))) {
			return {
				dpidsAvailableToTrade,
				draftPicks: undefined,
				draftType: g.get("draftType"),
				numToPick: 0,
				result: undefined,
				rigged: undefined,
				season,
				showExpansionTeamMessage,
				spectator: g.get("spectator"),
				teams,
				type: "projected",
				usePts,
				userTid: g.get("userTid"),
				challengeWarning: false,
				notEnoughTeams: false,
				godMode: g.get("godMode"),
			};
		}

		// View projected draft lottery for this season
		let draftLotteryResult;
		let draftPicks;
		try {
			const result = await draft.genOrder(true);
			draftLotteryResult = result.draftLotteryResult;
			draftPicks = result.draftPicks;
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

		if (draftPicks) {
			const numLotteryPicks = draftLotteryResult?.result.length ?? 0;
			draftPicks = orderBy(
				draftPicks.filter((dp) => {
					// Remove any lottery picks
					if (dp.round === 1 && dp.pick <= numLotteryPicks) {
						return false;
					}
					return true;
				}),
				["round", "pick"],
			);
			console.log("draftLotteryResult", draftLotteryResult, draftPicks);
		}

		return {
			challengeWarning:
				!draftLotteryResult &&
				g.get("challengeNoDraftPicks") &&
				g.get("userTids").length > 0,
			notEnoughTeams: !draftLotteryResult,
			dpidsAvailableToTrade,
			draftPicks,
			draftType,
			godMode: g.get("godMode"),
			numToPick: getNumToPick(
				draftType,
				draftLotteryResult ? draftLotteryResult.result.length : 14,
			),
			result: draftLotteryResult?.result,
			rigged: g.get("riggedLottery"),
			season,
			spectator: g.get("spectator"),
			showExpansionTeamMessage,
			teams,
			type,
			usePts,
			userTid: g.get("userTid"),
		};
	}
};

export default updateDraftLottery;
