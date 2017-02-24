import g from '../../globals';
import {getCopy} from '../db';

async function updatePlayers(inputs, updateEvents, state) {
    if (updateEvents.includes('dbChange') || updateEvents.includes('gameSim') || inputs.abbrev !== state.abbrev || inputs.season !== state.season || inputs.playoffs !== state.playoffs) {
        let feats = await getCopy.playerFeats();

        // Put fake fid on cached feats
        let maxFid = 0;
        for (const feat of feats) {
            if (feat.hasOwnProperty('fid')) {
                if (feat.fid > maxFid) {
                    maxFid = feat.fid;
                }
            } else {
                maxFid += 1;
                feat.fid = maxFid;
            }
        }

        if (inputs.abbrev !== "all") {
            feats = feats.filter(feat => g.teamAbbrevsCache[feat.tid] === inputs.abbrev);
        }
        if (inputs.season !== "all") {
            feats = feats.filter(feat => feat.season === inputs.season);
        }
        feats = feats.filter(feat => {
            if (inputs.playoffs === "regularSeason") {
                return !feat.playoffs;
            }
            if (inputs.playoffs === "playoffs") {
                return feat.playoffs;
            }
        });

        feats.forEach(feat => {
            feat.stats.trb = feat.stats.orb + feat.stats.drb;

            feat.stats.fgp = feat.stats.fga > 0 ? 100 * feat.stats.fg / feat.stats.fga : 0;
            feat.stats.tpp = feat.stats.tpa > 0 ? 100 * feat.stats.tp / feat.stats.tpa : 0;
            feat.stats.ftp = feat.stats.fta > 0 ? 100 * feat.stats.ft / feat.stats.fta : 0;

            if (feat.overtimes === 1) {
                feat.score += " (OT)";
            } else if (feat.overtimes > 1) {
                feat.score += ` (${feat.overtimes}OT)`;
            }
        });

        return {
            feats,
            abbrev: inputs.abbrev,
            season: inputs.season,
            playoffs: inputs.playoffs,
        };
    }
}

export default {
    runBefore: [updatePlayers],
};
