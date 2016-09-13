import backboard from 'backboard';
import g from '../globals';
import finances from '../core/finances';
import player from '../core/player';
import team from '../core/team';
import bbgmViewReact from '../util/bbgmViewReact';
import helpers from '../util/helpers';
import CustomizePlayer from './views/CustomizePlayer';

function get(req) {
    if (req.params.hasOwnProperty("pid")) {
        return {
            pid: parseInt(req.params.pid, 10),
        };
    }

    return {
        pid: null,
    };
}

async function updateCustomizePlayer(inputs, updateEvents) {
    if (!g.godMode) {
        return {
            godMode: g.godMode,
        };
    }

    if (updateEvents.indexOf("firstRun") >= 0) {
        const teams = await team.filter({
            attrs: ["tid", "region", "name"],
        });

        // Once a new draft class is generated, if the next season hasn't started, need to bump up year numbers
        const seasonOffset = g.phase < g.PHASE.FREE_AGENCY ? 0 : 1;

        for (let i = 0; i < teams.length; i++) {
            teams[i].text = `${teams[i].region} ${teams[i].name}`;
        }
        teams.unshift({
            tid: g.PLAYER.RETIRED,
            text: "Retired",
        });
        teams.unshift({
            tid: g.PLAYER.UNDRAFTED_3,
            text: `${g.season + seasonOffset + 2} Draft Prospect`,
        });
        teams.unshift({
            tid: g.PLAYER.UNDRAFTED_2,
            text: `${g.season + seasonOffset + 1} Draft Prospect`,
        });
        teams.unshift({
            tid: g.PLAYER.UNDRAFTED,
            text: `${g.season + seasonOffset} Draft Prospect`,
        });
        teams.unshift({
            tid: g.PLAYER.FREE_AGENT,
            text: "Free Agent",
        });

        const vars = {
            godMode: g.godMode,
            season: g.season,
            teams,
        };

        if (inputs.pid === null) {
            // Generate new player as basis
            const teamSeasons = await g.dbl.teamSeasons.index("tid, season").getAll(backboard.bound([g.userTid, g.season - 2], [g.userTid, g.season]));
            const scoutingRank = finances.getRankLastThree(teamSeasons, "expenses", "scouting");

            const p = player.generate(g.PLAYER.FREE_AGENT,
                20,
                null,
                50,
                50,
                g.season,
                false,
                scoutingRank);

            p.face.fatness = helpers.round(p.face.fatness, 2);
            p.face.eyes[0].angle = helpers.round(p.face.eyes[0].angle, 1);
            p.face.eyes[1].angle = helpers.round(p.face.eyes[1].angle, 1);

            vars.appearanceOption = "Cartoon Face";
            p.imgURL = "http://";

            vars.p = p;
        } else {
            // Load a player to edit
            const p = await g.dbl.players.get(inputs.pid);
            if (p.imgURL.length > 0) {
                vars.appearanceOption = "Image URL";
            } else {
                vars.appearanceOption = "Cartoon Face";
                p.imgURL = "http://";
            }

            vars.originalTid = p.tid;
            vars.p = p;
        }

        return vars;
    }
}

export default bbgmViewReact.init({
    id: "customizePlayer",
    get,
    runBefore: [updateCustomizePlayer],
    Component: CustomizePlayer,
});
