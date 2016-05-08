const g = require('../globals');
const ui = require('../ui');
const player = require('../core/player');
const boxPlot = require('../lib/boxPlot');
const $ = require('jquery');
const ko = require('knockout');
const components = require('./components');
const bbgmView = require('../util/bbgmView');
const helpers = require('../util/helpers');

function get(req) {
    return {
        season: helpers.validateSeason(req.params.season)
    };
}

function InitViewModel() {
    this.season = ko.observable();
}

async function updatePlayers(inputs, updateEvents, vm) {
    if (updateEvents.indexOf("dbChange") >= 0 || (inputs.season === g.season && (updateEvents.indexOf("gameSim") >= 0 || updateEvents.indexOf("playerMovement") >= 0)) || inputs.season !== vm.season()) {
        let players = await g.dbl.players.getAll();
        players = await player.withStats(null, players, {statsSeasons: [inputs.season]});

        players = player.filter(players, {
            ratings: ["ovr", "pot", "hgt", "stre", "spd", "jmp", "endu", "ins", "dnk", "ft", "fg", "tp", "blk", "stl", "drb", "pss", "reb"],
            season: inputs.season,
            showNoStats: true,
            showRookies: true,
            fuzz: true
        });

        const ratingsAll = players.reduce((memo, player) => {
            for (const rating in player.ratings) {
                if (player.ratings.hasOwnProperty(rating)) {
                    if (memo.hasOwnProperty(rating)) {
                        memo[rating].push(player.ratings[rating]);
                    } else {
                        memo[rating] = [player.ratings[rating]];
                    }
                }
            }
            return memo;
        }, {});

        return {
            season: inputs.season,
            ratingsAll
        };
    }
}

function uiFirst(vm) {
    ko.computed(() => {
        ui.title(`Player Rating Distributions - ${vm.season()}`);
    }).extend({throttle: 1});


    const tbody = $("#player-rating-dists tbody");

    for (const rating in vm.ratingsAll) {
        if (vm.ratingsAll.hasOwnProperty(rating)) {
            tbody.append(`<tr><td style="text-align: right; padding-right: 1em;">${rating}</td><td width="100%"><div id="${rating}BoxPlot"></div></td></tr>`);
        }
    }

    ko.computed(() => {
        for (const rating in vm.ratingsAll) {
            if (vm.ratingsAll.hasOwnProperty(rating)) {
                boxPlot.create({
                    data: vm.ratingsAll[rating](),
                    scale: [0, 100],
                    container: `${rating}BoxPlot`
                });
            }
        }
    }).extend({throttle: 1});
}

function uiEvery(updateEvents, vm) {
    components.dropdown("player-rating-dists-dropdown", ["seasons"], [vm.season()], updateEvents);
}

module.exports = bbgmView.init({
    id: "playerRatingDists",
    get,
    InitViewModel,
    runBefore: [updatePlayers],
    uiFirst,
    uiEvery
});
