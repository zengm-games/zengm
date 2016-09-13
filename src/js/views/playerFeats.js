import g from '../globals';
import bbgmViewReact from '../util/bbgmViewReact';
import helpers from '../util/helpers';
import PlayerFeats from './views/PlayerFeats';

function get(req) {
    let abbrev;
    if (g.teamAbbrevsCache.indexOf(req.params.abbrev) >= 0) {
        abbrev = req.params.abbrev;
    } else {
        abbrev = "all";
    }

    let season;
    if (req.params.season && req.params.season !== "all") {
        season = helpers.validateSeason(req.params.season);
    } else {
        season = "all";
    }

    return {
        abbrev,
        season,
        playoffs: req.params.playoffs !== undefined ? req.params.playoffs : "regular_season",
    };
}

async function updatePlayers(inputs, updateEvents, state) {
    if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("gameSim") >= 0 || inputs.abbrev !== state.abbrev || inputs.season !== state.season || inputs.playoffs !== state.playoffs) {
        let feats = await g.dbl.playerFeats.getAll();

        if (inputs.abbrev !== "all") {
            feats = feats.filter(feat => g.teamAbbrevsCache[feat.tid] === inputs.abbrev);
        }
        if (inputs.season !== "all") {
            feats = feats.filter(feat => feat.season === inputs.season);
        }
        feats = feats.filter(feat => {
            if (inputs.playoffs === "regular_season") {
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

export default bbgmViewReact.init({
    id: "playerFeats",
    get,
    runBefore: [updatePlayers],
    Component: PlayerFeats,
});
