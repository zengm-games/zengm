import g from '../../globals';
import * as freeAgents from '../core/freeAgents';
import * as trade from '../core/trade';
import {getCopy} from '../db';
import bbgmViewReact from '../../util/bbgmViewReact';
import * as helpers from '../../util/helpers';
import Player from '../../ui/views/Player';

function get(ctx) {
    return {
        pid: ctx.params.pid !== undefined ? parseInt(ctx.params.pid, 10) : undefined,
    };
}

async function updatePlayer(inputs, updateEvents, state) {
    if (updateEvents.includes('dbChange') || updateEvents.includes('firstRun') || !state.retired) {
        let p = await getCopy.players({pid: inputs.pid});
        p = await getCopy.playersPlus(p, {
            attrs: ["pid", "name", "tid", "abbrev", "teamRegion", "teamName", "age", "hgtFt", "hgtIn", "weight", "born", "diedYear", "contract", "draft", "face", "mood", "injury", "salaries", "salariesTotal", "awardsGrouped", "freeAgentMood", "imgURL", "watch", "gamesUntilTradable", "college"],
            ratings: ["season", "abbrev", "age", "ovr", "pot", "hgt", "stre", "spd", "jmp", "endu", "ins", "dnk", "ft", "fg", "tp", "blk", "stl", "drb", "pss", "reb", "skills", "pos"],
            stats: ["psid", "season", "tid", "abbrev", "age", "gp", "gs", "min", "fg", "fga", "fgp", "fgAtRim", "fgaAtRim", "fgpAtRim", "fgLowPost", "fgaLowPost", "fgpLowPost", "fgMidRange", "fgaMidRange", "fgpMidRange", "tp", "tpa", "tpp", "ft", "fta", "ftp", "pm", "orb", "drb", "trb", "ast", "tov", "stl", "blk", "ba", "pf", "pts", "per", "ewa"],
            playoffs: true,
            showRookies: true,
            fuzz: true,
        });

        // Account for extra free agent demands
        if (p.tid === g.PLAYER.FREE_AGENT) {
            p.contract.amount = freeAgents.amountWithMood(p.contract.amount, p.freeAgentMood[g.userTid]);
        }

        let events = await getCopy.events({pid: inputs.pid});

        const feats = events.filter(event => event.type === "playerFeat").map(event => {
            return {
                eid: event.eid,
                season: event.season,
                text: event.text,
            };
        });

        events = events.filter(event => {
            return !(event.type === "award" || event.type === "injured" || event.type === "healed" || event.type === "hallOfFame" || event.type === "playerFeat" || event.type === "tragedy");
        }).map(event => {
            return {
                eid: event.eid,
                season: event.season,
                text: event.text,
            };
        });

        // Add untradable property
        p = trade.filterUntradable([p])[0];
        events.forEach(helpers.correctLinkLid);
        feats.forEach(helpers.correctLinkLid);

        return {
            player: p,
            showTradeFor: p.tid !== g.userTid && p.tid >= 0,
            freeAgent: p.tid === g.PLAYER.FREE_AGENT,
            retired: p.tid === g.PLAYER.RETIRED,
            showContract: p.tid !== g.PLAYER.UNDRAFTED && p.tid !== g.PLAYER.UNDRAFTED_2 && p.tid !== g.PLAYER.UNDRAFTED_3 && p.tid !== g.PLAYER.UNDRAFTED_FANTASY_TEMP && p.tid !== g.PLAYER.RETIRED,
            injured: p.injury.type !== "Healthy",
            godMode: g.godMode,
            events,
            feats,
        };
    }
}

export default bbgmViewReact.init({
    id: "player",
    get,
    runBefore: [updatePlayer],
    Component: Player,
});
