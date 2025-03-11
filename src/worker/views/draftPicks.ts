import { idb } from "../db";
import { g } from "../util";
import type { UpdateEvents, ViewInput } from "../../common/types";
import { groupByUnique } from "../../common/utils";
import { addPowerRankingsStuffToTeams } from "./powerRankings";
import { getEstPicks } from "../core/team/valueChange";

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

		let estPicks;

		for (const dp of draftPicksRaw) {
			const t = teams[dp.originalTid];

			let projectedPick;
			if (dp.pick === 0) {
				if (!estPicks) {
					const teamOvrsSorted = teamsWithRankings
						.map((t) => {
							return {
								ovr: t.powerRankings.ovr,
								tid: t.tid,
							};
						})
						.sort((a, b) => b.ovr - a.ovr);
					const output = await getEstPicks(teamOvrsSorted);
					estPicks = output.estPicks;
					console.log(estPicks);
				}

				projectedPick = estPicks[dp.originalTid];
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
