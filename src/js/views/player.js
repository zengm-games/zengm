const g = require('../globals');
const freeAgents = require('../core/freeAgents');
const player = require('../core/player');
const trade = require('../core/trade');
const faces = require('facesjs');
const ko = require('knockout');
const komapping = require('knockout.mapping');
const Promise = require('bluebird');
const bbgmViewReact = require('../util/bbgmViewReact');
const helpers = require('../util/helpers');
const Player = require('./views/Player');

function get(req) {
    return {
        pid: req.params.pid !== undefined ? parseInt(req.params.pid, 10) : undefined,
    };
}

async function updatePlayer(inputs, updateEvents, vm) {
    if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("firstRun") >= 0 || !vm.retired()) {
        let [p, events] = await Promise.all([
            g.dbl.players.get(inputs.pid).then(p => {
                return player.withStats(null, [p], {
                    statsSeasons: "all",
                    statsPlayoffs: true,
                }).then(players => players[0]);
            }),
            g.dbl.events.index('pids').getAll(inputs.pid),
        ]);

        p = player.filter(p, {
            attrs: ["pid", "name", "tid", "abbrev", "teamRegion", "teamName", "age", "hgtFt", "hgtIn", "weight", "born", "diedYear", "contract", "draft", "face", "mood", "injury", "salaries", "salariesTotal", "awardsGrouped", "freeAgentMood", "imgURL", "watch", "gamesUntilTradable", "college"],
            ratings: ["season", "abbrev", "age", "ovr", "pot", "hgt", "stre", "spd", "jmp", "endu", "ins", "dnk", "ft", "fg", "tp", "blk", "stl", "drb", "pss", "reb", "skills", "pos"],
            stats: ["psid", "season", "abbrev", "age", "gp", "gs", "min", "fg", "fga", "fgp", "fgAtRim", "fgaAtRim", "fgpAtRim", "fgLowPost", "fgaLowPost", "fgpLowPost", "fgMidRange", "fgaMidRange", "fgpMidRange", "tp", "tpa", "tpp", "ft", "fta", "ftp", "pm", "orb", "drb", "trb", "ast", "tov", "stl", "blk", "ba", "pf", "pts", "per", "ewa"],
            playoffs: true,
            showNoStats: true,
            showRookies: true,
            fuzz: true,
        });

        // Account for extra free agent demands
        if (p.tid === g.PLAYER.FREE_AGENT) {
            p.contract.amount = freeAgents.amountWithMood(p.contract.amount, p.freeAgentMood[g.userTid]);
        }

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

function uiFirst(vm) {
    ko.computed(() => {
        // Manually clear picture, since we're not using Knockout for this
        const pic = document.getElementById("picture");
        if (pic) {
            while (pic.firstChild) {
                pic.removeChild(pic.firstChild);
            }
        }

        // If playerImgURL is not an empty string, use it instead of the generated face
        if (vm.player.imgURL()) {
            const img = document.createElement("img");
            img.src = vm.player.imgURL();
            img.style.maxHeight = "100%";
            img.style.maxWidth = "100%";
            if (pic) {
                pic.appendChild(img);
            }
        } else {
            faces.display("picture", komapping.toJS(vm.player.face));
        }
    }).extend({throttle: 1});
}

module.exports = bbgmViewReact.init({
    id: "player",
    get,
    runBefore: [updatePlayer],
    Component: Player,
});
