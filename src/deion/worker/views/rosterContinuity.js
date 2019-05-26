// @flow

import range from "lodash/range";
import { idb } from "../db";
import { g } from "../util";
import type { UpdateEvents } from "../../common/types";

async function updateSeasons(
    inputs: { season: number },
    updateEvents: UpdateEvents,
): void | { [key: string]: any } {
    if (
        updateEvents.includes("firstRun") ||
        updateEvents.includes("gameSim") ||
        updateEvents.includes("playerMovement")
    ) {
        const seasons = [];
        let prevMinutesAll;
        for (let season = g.startingSeason; season <= g.season; season++) {
            const players = await idb.getCopies.players({
                activeSeason: season,
            });

            // Can't use getCopies.players easily because it doesn't elegantly handle when a player plays for two teams in a season

            const minutesAll = range(g.numTeams).map(() => new Map());
            for (const p of players) {
                const stats = p.stats.filter(
                    ps => !ps.playoffs && ps.season === season,
                );
                if (stats.length === 0) {
                    continue;
                }
                for (const ps of stats) {
                    const min = minutesAll[ps.tid].get(p.pid) || 0;
                    minutesAll[ps.tid].set(p.pid, min + ps.min);
                }
            }

            if (prevMinutesAll) {
                seasons.push(
                    minutesAll.map((minutes, i) => {
                        // $FlowFixMe
                        const prevMinutes = prevMinutesAll[i];
                        let sumMinutes = 0;
                        let sumMinutesContinuity = 0;
                        for (const [pid, min] of minutes) {
                            sumMinutes += min;
                            if (prevMinutes.has(pid)) {
                                sumMinutesContinuity += min;
                            }
                        }

                        return sumMinutes > 0
                            ? sumMinutesContinuity / sumMinutes
                            : 1;
                    }),
                );
                // compare against previous season
            }
            prevMinutesAll = minutesAll;
        }
        seasons.reverse();

        return {
            abbrevs: g.teamAbbrevsCache,
            season: g.season,
            seasons,
            userTid: g.userTid,
        };
    }
}

export default {
    runBefore: [updateSeasons],
};
