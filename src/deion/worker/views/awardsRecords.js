// @flow

import { idb } from "../db";
import type { GetOutput, UpdateEvents } from "../../common/types";

const optionsTmp = [
    {
        val: "Won Championship",
        key: "champion",
    },
    {
        val: "Most Valuable Player",
        key: "mvp",
    },
    {
        val: "Finals MVP",
        key: "finals_mvp",
    },
    {
        val: "Defensive Player of the Year",
        key: "dpoy",
    },
    {
        val: "Sixth Man of the Year",
        key: "smoy",
    },
    {
        val: "Most Improved Player",
        key: "mip",
    },
    {
        val: "Rookie of the Year",
        key: "roy",
    },
    {
        val: "Offensive Rookie of the Year",
        key: "oroy",
    },
    {
        val: "Defensive Rookie of the Year",
        key: "droy",
    },
    {
        val: "First Team All-League",
        key: "first_team",
    },
    {
        val: "Second Team All-League",
        key: "second_team",
    },
    {
        val: "Third Team All-League",
        key: "third_team",
    },
    {
        val: "First Team All-Defensive",
        key: "first_def",
    },
    {
        val: "Second Team All-Defensive",
        key: "second_def",
    },
    {
        val: "Third Team All-Defensive",
        key: "third_def",
    },
    {
        val: "All-League",
        key: "all_league",
    },
    {
        val: "All-Defensive",
        key: "all_def",
    },
    {
        val: "League Scoring Leader",
        key: "ppg_leader",
    },
    {
        val: "League Rebounding Leader",
        key: "rpg_leader",
    },
    {
        val: "League Assists Leader",
        key: "apg_leader",
    },
    {
        val: "League Steals Leader",
        key: "spg_leader",
    },
    {
        val: "League Blocks Leader",
        key: "bpg_leader",
    },
];

const awardOptions = {};
optionsTmp.forEach(o => {
    awardOptions[o.key] = o.val;
});

function getPlayerAwards(p, awardType) {
    const aType = awardOptions[awardType];
    let filter;
    if (awardType === "all_league") {
        filter = a => {
            const o = awardOptions;
            return (
                a.type === o.first_team ||
                a.type === o.second_team ||
                a.type === o.third_team
            );
        };
    } else if (awardType === "all_def") {
        filter = a => {
            const o = awardOptions;
            return (
                a.type === o.first_def ||
                a.type === o.second_def ||
                a.type === o.third_def
            );
        };
    } else {
        filter = a => a.type === aType;
    }

    const getTeam = season => {
        const stats = p.stats.filter(s => s.season === season);
        if (stats.length > 0) {
            return stats[stats.length - 1].abbrev;
        }
        return "???";
    };

    const awards = p.awards.filter(filter);
    const years = awards.map(a => {
        return { team: getTeam(a.season), season: a.season };
    });
    const lastYear = Math.max(...years.map(y => y.season)).toString();

    return {
        name: `${p.firstName} ${p.lastName}`,
        pid: p.pid,
        count: awards.length,
        countText: awards.length.toString(),
        years,
        lastYear,
        retired: p.retiredYear !== Infinity,
        hof: p.hof,
    };
}

async function updateAwardsRecords(
    inputs: GetOutput,
    updateEvents: UpdateEvents,
    state: any,
): void | { [key: string]: any } {
    if (
        updateEvents.includes("firstRun") ||
        inputs.awardType !== state.awardType
    ) {
        let players = await idb.getCopies.players({
            activeAndRetired: true,
            filter: p => p.awards.length > 0,
        });
        players = await idb.getCopies.playersPlus(players, {
            attrs: [
                "awards",
                "firstName",
                "lastName",
                "pid",
                "retiredYear",
                "hof",
            ],
            stats: ["abbrev", "season"],
        });

        const awardType = inputs.awardType;
        if (typeof awardType !== "string") {
            return {
                errorMessage: "Invalid input for awardType.",
            };
        }

        const awardsRecords = players
            .map(p => getPlayerAwards(p, awardType))
            .filter(o => o.count > 0);

        return {
            awardsRecords,
            playerCount: awardsRecords.length,
            awardTypeVal: awardOptions[awardType],
            awardType,
        };
    }
}

export default {
    runBefore: [updateAwardsRecords],
};
