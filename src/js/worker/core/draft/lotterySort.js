// @flow

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
const lotterySort = (teams: TeamFiltered[]) => {
    /**
     * http://www.nba.com/2015/news/04/17/2015-draft-order-of-selection-tiebreak-official-release/index.html
     *
     * The tiebreaker used after the lottery is random. Which is then reversed for the 2nd round.
     */
    const randValues = range(g.numTeams);
    random.shuffle(randValues);
    for (let i = 0; i < teams.length; i++) {
        teams[i].randVal = randValues[i];
    }

    // If the playoffs haven't started yet, need to project who would be in the playoffs
    if (g.phase < PHASE.PLAYOFFS) {
        const { tidPlayoffs } = season.genPlayoffSeries(
            helpers.orderByWinp(teams),
        );
        for (const t of teams) {
            if (tidPlayoffs.includes(t.tid)) {
                t.seasonAttrs.playoffRoundsWon = 0;
            }
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
        r = r === 0 ? a.randVal - b.randVal : r;
        return r;
    });
};

export default lotterySort;
