import range from "lodash/range";
import { PHASE } from "../../../common";
import { season } from "..";
import { g, helpers, random } from "../../util";
import type { TeamFiltered } from "../../../common/types";

/**
 * Sort teams in place in correct order for lottery.
 *
 * Sort teams by making playoffs (NOT playoff performance) and winp, for first round
 */
const lotterySort = (
	teams: TeamFiltered<
		["tid"],
		["playoffRoundsWon", "won", "lost", "tied", "winp", "cid", "did"],
		any,
		number
	>[],
) => {
	/**
	 * http://www.nba.com/2015/news/04/17/2015-draft-order-of-selection-tiebreak-official-release/index.html
	 *
	 * The tiebreaker used after the lottery is random. Which is then reversed for the 2nd round.
	 */
	const randValues = range(teams.length);
	random.shuffle(randValues);

	// If the playoffs haven't started yet, need to project who would be in the playoffs
	if (g.get("phase") < PHASE.PLAYOFFS) {
		const { tidPlayoffs } = season.genPlayoffSeries(helpers.orderByWinp(teams));

		for (const t of teams) {
			if (tidPlayoffs.includes(t.tid)) {
				t.seasonAttrs.playoffRoundsWon = 0;
			}
		}
	}

	for (let i = 0; i < teams.length; i++) {
		const t = teams[i];
		(t as any).randVal = randValues[i];

		// Expansion teams and re-activated teams who did not play this season
		if (
			t.seasonAttrs.won === 0 &&
			t.seasonAttrs.lost === 0 &&
			t.seasonAttrs.tied === 0
		) {
			t.seasonAttrs.winp = 0.5;
		}
	}

	teams.sort((a, b) => {
		let r;
		r = 0;

		if (
			a.seasonAttrs.playoffRoundsWon >= 0 &&
			!(b.seasonAttrs.playoffRoundsWon >= 0)
		) {
			r = 1;
		}

		if (
			!(a.seasonAttrs.playoffRoundsWon >= 0) &&
			b.seasonAttrs.playoffRoundsWon >= 0
		) {
			r = -1;
		}

		r = r === 0 ? a.seasonAttrs.winp - b.seasonAttrs.winp : r;
		r = r === 0 ? (a as any).randVal - (b as any).randVal : r;
		return r;
	});
};

export default lotterySort;
