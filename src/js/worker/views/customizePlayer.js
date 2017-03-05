// @flow

import {PHASE, PLAYER, g} from '../../common';
import {finances, player} from '../core';
import {getCopy, idb} from '../db';
import type {GetOutput, UpdateEvents} from '../../common/types';

async function updateCustomizePlayer(
    inputs: GetOutput,
    updateEvents: UpdateEvents,
): void | {[key: string]: any} {
    if (!g.godMode) {
        return {
            godMode: g.godMode,
        };
    }

    if (updateEvents.includes('firstRun')) {
        const teams = await getCopy.teams({
            attrs: ["tid", "region", "name"],
        });

        // Once a new draft class is generated, if the next season hasn't started, need to bump up year numbers
        const seasonOffset = g.phase < PHASE.FREE_AGENCY ? 0 : 1;

        for (let i = 0; i < teams.length; i++) {
            teams[i].text = `${teams[i].region} ${teams[i].name}`;
        }
        teams.unshift({
            tid: PLAYER.RETIRED,
            text: "Retired",
        });
        teams.unshift({
            tid: PLAYER.UNDRAFTED_3,
            text: `${g.season + seasonOffset + 2} Draft Prospect`,
        });
        teams.unshift({
            tid: PLAYER.UNDRAFTED_2,
            text: `${g.season + seasonOffset + 1} Draft Prospect`,
        });
        teams.unshift({
            tid: PLAYER.UNDRAFTED,
            text: `${g.season + seasonOffset} Draft Prospect`,
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
            const teamSeasons = await idb.cache.indexGetAll('teamSeasonsByTidSeason', [`${g.userTid},${g.season - 2}`, `${g.userTid},${g.season}`]);
            const scoutingRank = finances.getRankLastThree(teamSeasons, "expenses", "scouting");

            p = player.generate(
                PLAYER.FREE_AGENT,
                20,
                '',
                50,
                50,
                g.season,
                false,
                scoutingRank,
            );

            p.face.fatness = p.face.fatness.toFixed(2);
            p.face.eyes[0].angle = p.face.eyes[0].angle.toFixed(1);
            p.face.eyes[1].angle = p.face.eyes[1].angle.toFixed(1);

            appearanceOption = 'Cartoon Face';
            p.imgURL = "http://";
        } else {
            // Load a player to edit
            p = await getCopy.players({pid: inputs.pid});
            if (p.imgURL.length > 0) {
                appearanceOption = 'Image URL';
            } else {
                appearanceOption = 'Cartoon Face';
                p.imgURL = "http://";
            }

            originalTid = p.tid;
        }

        return {
            appearanceOption,
            godMode: g.godMode,
            originalTid,
            p,
            season: g.season,
            teams,
        };
    }
}

export default {
    runBefore: [updateCustomizePlayer],
};
