// @flow

import {
    getPlayers,
    getTopPlayers,
    saveAwardsByPlayer,
} from "../season/awards";
import { g } from "../../util";
import type { Conditions, PlayerFiltered } from "../../../common/types";

const NUM_ALL_STARS = 2 * (process.env.SPORT === "football" ? 40 : 12);

const create = async (fillTeams: boolean = false, conditions: Conditions) => {
    const allStars = {
        season: g.season,
        teams: [[], []],
        remaining: [],
        finalized: false,
    };

    const players = await getPlayers();
    const score = (p: PlayerFiltered) =>
        process.env.SPORT === "football"
            ? p.currentStats.av
            : p.currentStats.ewa + p.currentStats.ws;
    const sortedPlayers = getTopPlayers(
        {
            amount: Infinity,
            score,
        },
        players,
    );

    let healthyCount = 0;
    for (const p of sortedPlayers) {
        allStars.remaining.push(p);
        if (p.injury.gamesRemaining === 0) {
            healthyCount += 1;
        }

        if (healthyCount >= NUM_ALL_STARS) {
            break;
        }
    }

    // Pick two captains
    for (const team of allStars.teams) {
        team.push(allStars.remaining.shift());
    }

    const awardsByPlayer = allStars.remaining.map(p => {
        return {
            pid: p.pid,
            tid: p.tid,
            name: p.name,
            type: "All-Star",
        };
    });

    await saveAwardsByPlayer(awardsByPlayer, conditions);

    if (fillTeams) {
        console.log("FILL TEAMS");
    }

    return allStars;
};

export default create;
