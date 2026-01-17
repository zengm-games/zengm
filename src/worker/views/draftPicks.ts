import { idb } from "../db/index.ts";
import { g, helpers } from "../util/index.ts";
import type { DraftPick, UpdateEvents, ViewInput } from "../../common/types.ts";
import { groupByUnique } from "../../common/utils.ts";
import { addPowerRankingsStuffToTeams } from "./powerRankings.ts";
import { getEstPicks } from "../core/team/valueChange.ts";
import { PLAYER } from "../../common/index.ts";

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

export const processDraftPicks = async (draftPicksRaw: DraftPick[]) => {
	const draftPicks = [];

	const teamsRaw = await idb.getCopies.teamsPlus(
		{
			attrs: ["tid", "abbrev", "playThroughInjuries"],
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
				projectedPick: estPicksCache[dp.originalTid]!,
				numSeasons: dp.season - g.get("season"),
				numTeams: teamsWithRankings.length,
			});
		}

		// Extra filter at the end is for TypeScript
		const events = (
			await idb.getCopies.events({
				dpid: dp.dpid,
				filter: (event) => event.type === "trade",
			})
		).filter((row) => row.type === "trade");

		let trades;
		if (events.length > 0) {
			trades = events.map((event) => {
				let tid = PLAYER.DOES_NOT_EXIST;

				// Which team traded the pick?
				if (event.teams) {
					for (const i of [0, 1] as const) {
						if (
							event.teams[i].assets.some(
								(asset) => (asset as any).dpid === dp.dpid,
							)
						) {
							tid = event.tids[i];
							break;
						}
					}
				}

				return {
					abbrev: helpers.getAbbrev(tid),
					eid: event.eid,
				};
			});
		}

		draftPicks.push({
			...dp,
			abbrev: teams[dp.tid]?.abbrev ?? "???",
			originalAbbrev: t?.abbrev ?? "???",
			avgAge: t?.powerRankings.avgAge,
			ovr: t?.powerRankings.ovr,
			powerRanking: t?.powerRankings.rank ?? Infinity,
			record: {
				won: t?.seasonAttrs.won ?? 0,
				lost: t?.seasonAttrs.lost ?? 0,
				tied: t?.seasonAttrs.tied ?? 0,
				otl: t?.seasonAttrs.otl ?? 0,
			},
			projectedPick,
			trades,
		});
	}

	return draftPicks;
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
		const draftPicksRaw = (await idb.cache.draftPicks.getAll()).filter(
			(dp) => dp.tid === tid || dp.originalTid === tid,
		);

		const draftPicksProcessed = await processDraftPicks(draftPicksRaw);

		// Do this after processDraftPicks so processDraftPicks can use the same caches for both
		const draftPicks = [];
		const draftPicksOutgoing = [];
		for (const dp of draftPicksProcessed) {
			if (dp.tid === tid) {
				draftPicks.push(dp);
			} else if (dp.originalTid === tid) {
				draftPicksOutgoing.push(dp);
			}
		}

		return {
			abbrev,
			challengeNoRatings: g.get("challengeNoRatings"),
			draftPicks,
			draftPicksOutgoing,
			draftType: g.get("draftType"),
			tid,
		};
	}
};

export default updateDraftPicks;
