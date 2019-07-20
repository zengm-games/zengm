// @flow

import { PLAYER } from "../../common";
import { finances, player } from "../core";
import { idb } from "../db";
import { g } from "../util";
import type { GetOutput, UpdateEvents } from "../../common/types";

async function updateCustomizePlayer(
    inputs: GetOutput,
    updateEvents: UpdateEvents,
): void | { [key: string]: any } {
    if (!g.godMode) {
        return {
            godMode: g.godMode,
        };
    }

    if (updateEvents.includes("firstRun")) {
        const teams = await idb.getCopies.teamsPlus({
            attrs: ["tid", "region", "name"],
        });

        for (let i = 0; i < teams.length; i++) {
            teams[i].text = `${teams[i].region} ${teams[i].name}`;
        }
        teams.unshift({
            tid: PLAYER.RETIRED,
            text: "Retired",
        });
        teams.unshift({
            tid: PLAYER.UNDRAFTED,
            text: "Draft Prospect",
        });
        teams.unshift({
            tid: PLAYER.FREE_AGENT,
            text: "Free Agent",
        });

        let appearanceOption;
        let originalTid;
        let p;

        if (inputs.pid === null) {
            // Generate new player as basis
            const teamSeasons = await idb.cache.teamSeasons.indexGetAll(
                "teamSeasonsByTidSeason",
                [[g.userTid, g.season - 2], [g.userTid, g.season]],
            );
            const scoutingRank = finances.getRankLastThree(
                teamSeasons,
                "expenses",
                "scouting",
            );

            p = player.generate(
                PLAYER.FREE_AGENT,
                20,
                g.season,
                false,
                scoutingRank,
            );

            p.face.fatness = p.face.fatness.toFixed(2);
            p.face.eyes[0].angle = p.face.eyes[0].angle.toFixed(1);
            p.face.eyes[1].angle = p.face.eyes[1].angle.toFixed(1);

            appearanceOption = "Cartoon Face";
            p.imgURL = "http://";
        } else if (typeof inputs.pid === "number") {
            // Load a player to edit
            p = await idb.getCopy.players({ pid: inputs.pid });
            if (!p) {
                return {
                    errorMessage: "Player not found.",
                };
            }
            if (p.imgURL.length > 0) {
                appearanceOption = "Image URL";
            } else {
                appearanceOption = "Cartoon Face";
                p.imgURL = "http://";
            }

            originalTid = p.tid;
        }

        return {
            appearanceOption,
            godMode: g.godMode,
            minContract: g.minContract,
            originalTid,
            p,
            phase: g.phase,
            season: g.season,
            teams,
        };
    }
}

export default {
    runBefore: [updateCustomizePlayer],
};
