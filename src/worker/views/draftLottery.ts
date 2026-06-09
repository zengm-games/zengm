import { PHASE, NO_LOTTERY_DRAFT_TYPES } from "../../common/constants.ts";
import { draft } from "../core/index.ts";
import { idb } from "../db/index.ts";
import { g } from "../util/index.ts";
import type {
	UpdateEvents,
	ViewInput,
	DraftType,
	DraftLotteryResult,
	GameAttributesLeague,
	TeamFiltered,
	DraftPickWithoutKey,
} from "../../common/types.ts";
import {
	getNumToPick,
	NotEnoughTeamsError,
	type GenOrderResult,
} from "../core/draft/genOrder.ts";
import { groupByUnique, orderBy } from "../../common/utils.ts";
import { getDraftLotteryProbs } from "../core/draft/draftLottery.ts";
import getNumPlayoffTeams from "../core/season/getNumPlayoffTeams.ts";

const filterDraftPicks = (
	draftPicks: DraftPickWithoutKey[],
	draftLotteryResult: DraftLotteryResult<boolean> | undefined,
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
	| ({
			challengeWarning: boolean;
			notEnoughTeams: boolean;
			colaOptOutAvailable: boolean;
			colaOptOutStatus: boolean;
			colaTable:
				| TeamFiltered<
						[
							"tid",
							"abbrev",
							"name",
							"region",
							"draftLottery",
							"imgURL",
							"imgURLSmall",
						]
				  >[]
				| undefined;
			draftPicks: DraftPickWithoutKey[] | undefined;
			draftType?: DraftType | "dummy";
			dpidsAvailableToTrade: Set<number | undefined>;
			numToPick: number;
			draftLotteryResult:
				| DraftLotteryResult<true>
				| DraftLotteryResult<false>
				| undefined;
			rigged: GameAttributesLeague["riggedLottery"];
			season: number;
			showExpansionTeamMessage: boolean;
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
	  } & ReturnType<typeof getDraftLotteryProbs>)
	| undefined
> => {
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("newPhase") ||
		updateEvents.includes("draftLottery") ||
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

		let colaTable;
		if (g.get("draftType") === "cola" && season === g.get("season")) {
			colaTable = await idb.getCopies.teamsPlus({
				attrs: [
					"tid",
					"abbrev",
					"name",
					"region",
					"imgURL",
					"imgURLSmall",
					"draftLottery",
				],
				active: true,
			});
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
				let draftType: DraftLotteryResult["draftType"] | undefined;
				let rigged: GameAttributesLeague["riggedLottery"];

				if (draftLotteryResult) {
					// Past lotteries before draftLotteryResult.draftType were all 1994
					draftType = draftLotteryResult.draftType ?? "nba1994";
					rigged = draftLotteryResult.rigged;
				}

				const { numPlayInTeams } = await getNumPlayoffTeams(season);
				const numToPick = getNumToPick(
					draftType,
					draftLotteryResult ? draftLotteryResult.result.length : 14,
					numPlayInTeams,
				);

				const { tooSlow, probs } = getDraftLotteryProbs(
					draftLotteryResult,
					draftType,
					numToPick,
				);

				return {
					dpidsAvailableToTrade,
					draftPicks,
					draftType,
					numToPick,
					draftLotteryResult,
					probs,
					rigged,
					season,
					showExpansionTeamMessage,
					teams,
					tooSlow,
					type: "completed",
					usePts,
					challengeWarning: false,
					notEnoughTeams: false,
					colaOptOutAvailable: false,
					colaOptOutStatus: false,
					colaTable,
				};
			}

			if (season < g.get("season")) {
				// Maybe there was no draft lottery done, or it was deleted from the database
				return {
					dpidsAvailableToTrade,
					draftPicks: undefined,
					draftType: "noLottery",
					numToPick: 0,
					draftLotteryResult: undefined,
					rigged: undefined,
					season,
					showExpansionTeamMessage,
					teams,
					tooSlow: false,
					type: "completed",
					usePts,
					challengeWarning: false,
					notEnoughTeams: false,
					colaOptOutAvailable: false,
					colaOptOutStatus: false,
					colaTable,
				};
			}
		}

		// View projected draft lottery for this season
		let draftLotteryResult;
		let draftPicks;
		try {
			const result = (await draft.genOrder(
				true,
			)) as unknown as GenOrderResult<false>;
			draftLotteryResult = result.draftLotteryResult;
			draftPicks = result.draftPicks;
		} catch (error) {
			console.log(error);
			if (!(error instanceof NotEnoughTeamsError)) {
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
			: g.get("draftType");

		if (draftPicks) {
			draftPicks = filterDraftPicks(draftPicks, draftLotteryResult);
		}

		const userTid = g.get("userTid");

		let colaOptOutAvailable = false;
		let colaOptOutStatus = false;
		if (draftType === "cola" && draftLotteryResult) {
			const t = await idb.cache.teams.get(userTid);
			if (!t) {
				throw new Error("Should never happen");
			}
			colaOptOutStatus =
				t.draftLottery?.type === "cola" ? !!t.draftLottery.optOut : false;

			// Opt out is available if user has their own lottery pick
			colaOptOutAvailable = draftLotteryResult.result.some(
				(row) => row.tid === userTid && row.originalTid === userTid,
			);
		}

		const { numPlayInTeams } = await getNumPlayoffTeams(season);
		const numToPick = getNumToPick(
			draftType,
			draftLotteryResult ? draftLotteryResult.result.length : 14,
			numPlayInTeams,
		);

		const { tooSlow, probs } = getDraftLotteryProbs(
			draftLotteryResult,
			draftType,
			numToPick,
		);

		return {
			challengeWarning:
				!draftLotteryResult &&
				g.get("challengeNoDraftPicks") &&
				g.get("userTids").length > 0,
			notEnoughTeams:
				!draftLotteryResult && !NO_LOTTERY_DRAFT_TYPES.has(g.get("draftType")),
			dpidsAvailableToTrade,
			draftPicks,
			draftType,
			numToPick,
			draftLotteryResult,
			rigged: g.get("riggedLottery"),
			probs,
			season,
			showExpansionTeamMessage,
			teams,
			tooSlow,
			type,
			usePts,
			colaOptOutAvailable,
			colaOptOutStatus,
			colaTable,
		};
	}
};

export default updateDraftLottery;
