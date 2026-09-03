import { PHASE, PLAYER } from "../../common/constants.ts";
import type { UpdateEvents, ViewInput } from "../../common/types.ts";
import { omit, orderBy } from "../../common/utils.ts";
import { idb } from "../db/index.ts";
import { g } from "../util/index.ts";
import { getPlayers } from "../core/awards/getPlayers.ts";

const updateEditAwardWinners = async (
	inputs: ViewInput<"editAwardWinners">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (updateEvents.includes("firstRun") || state.season !== inputs.season) {
		if (!g.get("godMode")) {
			// https://stackoverflow.com/a/59923262/786644
			const returnValue = {
				errorMessage:
					"You can't edit award winners unless you enable God Mode.",
			};
			return returnValue;
		}

		let season = inputs.season;
		let awards = await idb.getCopy.awards(
			{
				season,
			},
			"noCopyCache",
		);
		if (!awards) {
			if (g.get("season") === season && g.get("phase") <= PHASE.PLAYOFFS) {
				season -= 1;
				awards = await idb.getCopy.awards(
					{
						season,
					},
					"noCopyCache",
				);
			}
		}

		if (!awards) {
			// https://stackoverflow.com/a/59923262/786644
			const returnValue = {
				errorMessage: "No awards found for this season.",
			};
			return returnValue;
		}

		const statRanges = new Set(
			awards.awards.map((award) => award.statRange ?? "regularSeason"),
		);

		// const { statOverridesByMatchup } = persistedAwardsToAwardSetting(awards);

		const { players: playersRaw } = await getPlayers(
			season,
			statRanges,
			undefined, // statOverridesByMatchup,
			undefined,
		);

		// stats not needed, since we're only showing currentStats
		const players = orderBy(
			playersRaw.map((p) => {
				const lastTid =
					p.stats.findLast((row) => row.season === season)?.tid ??
					PLAYER.DOES_NOT_EXIST;
				return {
					...omit(p, ["stats"]),
					lastTid,
				};
			}),
			[
				(p) => p.ratings.findLast((row) => row.season === season)?.ovr ?? 0,
				"lastName",
				"firstName",
			],
			["desc", "asc", "asc"],
		);

		const actualAwards = awards.awards;

		const teams = await idb.getCopies.teamsPlus(
			{
				attrs: ["tid"],
				seasonAttrs: ["abbrev"],
				season,
			},
			"noCopyCache",
		);
		const abbrevsByTid: Record<number, string> = {};
		for (const t of teams) {
			abbrevsByTid[t.tid] = t.seasonAttrs.abbrev;
		}

		return {
			abbrevsByTid,
			awards: actualAwards,
			confs: g.get("confs", season),
			divs: g.get("divs", season),
			players,
			season,
		};
	}
};
export default updateEditAwardWinners;
