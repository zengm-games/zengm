import { idb } from "../db";
import { g } from "../util";
import type { UpdateEvents, ViewInput } from "../../common/types";
import { groupByUnique } from "../../common/utils";
import { addPowerRankingsStuffToTeams } from "./powerRankings";
import { getEstPicks } from "../core/team/valueChange";

const adjustProjectedPick = ({
	projectedPick,
	numSeasons,
	numTeams,
}: {
	projectedPick: number;
	numSeasons: number;
	numTeams: number;
}) => {
	if (numSeasons <= 0) {
		return projectedPick;
	}

	const averagePick = numTeams / 2;

	const NUM_SEASONS_CUTOFF = 8;

	// Many years in the future, we know basically nothing
	if (numSeasons >= NUM_SEASONS_CUTOFF) {
		return Math.round(averagePick);
	}

	// Before then, average projectedPick and averagePick with increasing weight
	const fractionProjectedPick = 1 - numSeasons / NUM_SEASONS_CUTOFF;
	return Math.round(
		fractionProjectedPick * projectedPick +
			(1 - fractionProjectedPick) * averagePick,
	);
};

const updateDraftPicks = async (
	{ abbrev, tid }: ViewInput<"draftPicks">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("gameSim") ||
		updateEvents.includes("playerMovement") ||
		updateEvents.includes("newPhase") ||
		abbrev !== state.abbrev
	) {
		const draftPicksRaw = await idb.cache.draftPicks.indexGetAll(
			"draftPicksByTid",
			tid,
		);

		const draftPicks = [];

		const teamsRaw = await idb.getCopies.teamsPlus(
			{
				attrs: ["tid", "abbrev"],
				seasonAttrs: ["lastTen", "won", "lost", "tied", "otl"],
				stats: ["gp", "mov"],
				season: g.get("season"),
				showNoStats: true,
			},
			"noCopyCache",
		);

		const teamsWithRankings = await addPowerRankingsStuffToTeams(
			teamsRaw,
			g.get("season"),
			"regularSeason",
		);

		const teams = groupByUnique(teamsWithRankings, "tid");

		let estPicksCache;

		for (const dp of draftPicksRaw) {
			const t = teams[dp.originalTid];

			let projectedPick;
			if (dp.pick === 0 && typeof dp.season === "number") {
				if (!estPicksCache) {
					const teamOvrsSorted = teamsWithRankings
						.map((t) => {
							return {
								ovr: t.powerRankings.ovr,
								tid: t.tid,
							};
						})
						.sort((a, b) => b.ovr - a.ovr);
					const { estPicks } = await getEstPicks(teamOvrsSorted);
					estPicksCache = estPicks;
				}

				projectedPick = adjustProjectedPick({
					projectedPick: estPicksCache[dp.originalTid],
					numSeasons: dp.season - g.get("season"),
					numTeams: teamsWithRankings.length,
				});
			}

			draftPicks.push({
				...dp,
				originalAbbrev: t?.abbrev ?? "???",
				avgAge: t?.powerRankings.avgAge ?? 0,
				ovr: t?.powerRankings.ovr ?? 0,
				powerRanking: t?.powerRankings.rank ?? Infinity,
				record: {
					won: t?.seasonAttrs.won ?? 0,
					lost: t?.seasonAttrs.lost ?? 0,
					tied: t?.seasonAttrs.tied ?? 0,
					otl: t?.seasonAttrs.otl ?? 0,
				},
				projectedPick,
			});
		}

		return {
			abbrev,
			challengeNoRatings: g.get("challengeNoRatings"),
			draftPicks,
			draftType: g.get("draftType"),
		};
	}
};

export default updateDraftPicks;
