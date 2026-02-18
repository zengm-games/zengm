import { PHASE, NO_LOTTERY_DRAFT_TYPES } from "../../common/index.ts";
import { draft } from "../core/index.ts";
import { idb } from "../db/index.ts";
import { g } from "../util/index.ts";
import type {
	UpdateEvents,
	DraftLotteryResultArray,
	ViewInput,
	DraftType,
	DraftLotteryResult,
	GameAttributesLeague,
	TeamFiltered,
	DraftPickWithoutKey,
} from "../../common/types.ts";
import { getNumToPick } from "../core/draft/genOrder.ts";
import { groupByUnique, orderBy } from "../../common/utils.ts";

const filterDraftPicks = (
	draftPicks: DraftPickWithoutKey[],
	draftLotteryResult: DraftLotteryResult | undefined,
) => {
	const numLotteryPicks = draftLotteryResult?.result.length ?? 0;
	return orderBy(
		draftPicks.filter((dp) => {
			// Remove any lottery picks
			if (dp.round === 1 && dp.pick <= numLotteryPicks) {
				return false;
			}
			return true;
		}),
		["round", "pick"],
	);
};

const updateDraftLottery = async (
	{ season }: ViewInput<"draftLottery">,
	updateEvents: UpdateEvents,
	state: any,
): Promise<
	| {
			challengeWarning: boolean;
			notEnoughTeams: boolean;
			draftPicks: DraftPickWithoutKey[] | undefined;
			draftType?: DraftType | "dummy";
			dpidsAvailableToTrade: Set<number | undefined>;
			godMode: boolean;
			numToPick: number;
			result: DraftLotteryResultArray | undefined;
			rigged: GameAttributesLeague["riggedLottery"];
			season: number;
			showExpansionTeamMessage: boolean;
			spectator: boolean;
			teams: Record<
				string,
				TeamFiltered<
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
				updateEvents.includes("gameAttributes") ||
				updateEvents.includes("playerMovement")))
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

		const seasonDraftPicks = await idb.cache.draftPicks.indexGetAll(
			"draftPicksBySeason",
			season,
		);

		const dpidsAvailableToTrade = new Set(
			seasonDraftPicks.map((dp) => dp.dpid),
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

			let draftPicks;
			if (season === g.get("season") && g.get("phase") === PHASE.DRAFT) {
				// Draft is in progress, so show upcoming picks as well as made picks
				const drafted = (
					await idb.cache.players.indexGetAll("playersByTid", [0, Infinity])
				)
					.filter((p) => p.draft.year === g.get("season"))
					.map((p) => {
						return {
							tid: p.draft.tid,
							originalTid: p.draft.originalTid,
							round: p.draft.round,
							pick: p.draft.pick,
							season: p.draft.year,
						};
					});

				draftPicks = filterDraftPicks(
					[...seasonDraftPicks, ...drafted],
					draftLotteryResult,
				);
			}

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
					draftPicks,
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
			draftPicks = filterDraftPicks(draftPicks, draftLotteryResult);
		}

		return {
			challengeWarning:
				!draftLotteryResult &&
				g.get("challengeNoDraftPicks") &&
				g.get("userTids").length > 0,
			notEnoughTeams:
				!draftLotteryResult &&
				!NO_LOTTERY_DRAFT_TYPES.includes(g.get("draftType")),
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
