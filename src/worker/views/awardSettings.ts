import { g } from "../util/index.ts";
import type { UpdateEvents } from "../../common/types.ts";
import { idb } from "../db/index.ts";
import { getAwardCandidates } from "../core/awards/getAwardCandidates.ts";
import { groupByUnique } from "../../common/utils.ts";
import { actualPhase } from "../util/actualPhase.ts";
import { PHASE } from "../../common/constants.ts";
import getPlayoffsByConf from "../core/season/getPlayoffsByConf.ts";
import { defaultAwards } from "../../common/defaultGameAttributes.ts";

const getTeams = async (season: number) => {
	const teams = await idb.getCopies.teamsPlus(
		{
			attrs: ["tid"],
			seasonAttrs: ["won", "lost", "tied", "otl"],
			season,
		},
		"noCopyCache",
	);

	return teams;
};

const updateAwardSettings = async (
	inputs: unknown,
	updateEvents: UpdateEvents,
) => {
	if (
		// In theory could update on gameSim and playerMovement, but it's actually tricky to keep editing state in sync so save it for later
		updateEvents.includes("firstRun")
	) {
		let season;
		let teams;
		const phase = actualPhase();
		if (phase === PHASE.PRESEASON) {
			season = g.get("season") - 1;
		} else if (phase === PHASE.REGULAR_SEASON) {
			// See if we have 0 GP in the regular season so far
			const teamsTemp = await getTeams(g.get("season"));
			if (
				teamsTemp.every(
					(t) =>
						t.seasonAttrs.won === 0 &&
						t.seasonAttrs.lost === 0 &&
						t.seasonAttrs.tied === 0 &&
						t.seasonAttrs.otl === 0,
				)
			) {
				season = g.get("season") - 1;
			} else {
				season = g.get("season");
				teams = teamsTemp;
			}
		} else {
			season = g.get("season");
		}
		const { awardCandidates, errorMessages } = await getAwardCandidates(
			season,
			g.get("awards"),
		);

		teams ??= await getTeams(season);

		const mvp = defaultAwards.mvp;
		const baseNewAward: (typeof awardCandidates)[number][number] = {
			shortName: "NEW",
			name: "New Award",
			formula: mvp.formula,
			showStats: mvp.showStats,
			numTeams: undefined,
			players: [],
			stats: [],
			winner: [],
		};

		return {
			awardCandidates,
			baseNewAward,
			confs: g.get("confs", season),
			divs: g.get("divs", season),
			errorMessages,
			numGamesPlayoffSeries: g.get("numGamesPlayoffSeries", season),
			playoffsByConf: await getPlayoffsByConf(season),
			season,
			teams: groupByUnique(teams, "tid"),
		};
	}
};

export default updateAwardSettings;
