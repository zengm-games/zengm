const g = require('../globals');
const ui = require('../ui');
const $ = require('jquery');
const ko = require('knockout');
const _ = require('underscore');
const player = require('../core/player');
const bbgmView = require('../util/bbgmView');
const helpers = require('../util/helpers');
const components = require('./components');

function get(req) {
    return {
        awardType: req.params.awardType || 'champion',
    };
}

function InitViewModel() {
    this.awardType = ko.observable();
    this.playerCount = ko.observable();
    this.awardTypeVal = ko.observable();
}

const mapping = {
    awardsRecords: {
        create: options => options.data,
    },
};

const optionsTmp = [{
    val: "Won Championship",
    key: "champion",
}, {
    val: "Most Valuable Player",
    key: "mvp",
}, {
    val: "Finals MVP",
    key: "finals_mvp",
}, {
    val: "Defensive Player of the Year",
    key: "dpoy",
}, {
    val: "Sixth Man of the Year",
    key: "smoy",
}, {
    val: "Rookie of the Year",
    key: "roy",
}, {
    val: "First Team All-League",
    key: "first_team",
}, {
    val: "Second Team All-League",
    key: "second_team",
}, {
    val: "Third Team All-League",
    key: "third_team",
}, {
    val: "First Team All-Defensive",
    key: "first_def",
}, {
    val: "Second Team All-Defensive",
    key: "second_def",
}, {
    val: "Third Team All-Defensive",
    key: "third_def",
}, {
    val: "All-League",
    key: "all_league",
}, {
    val: "All-Defensive",
    key: "all_def",
}, {
    val: "League Scoring Leader",
    key: "ppg_leader",
}, {
    val: "League Rebounding Leader",
    key: "rpg_leader",
}, {
    val: "League Assists Leader",
    key: "apg_leader",
}, {
    val: "League Steals Leader",
    key: "spg_leader",
}, {
    val: "League Blocks Leader",
    key: "bpg_leader",
}];

const awardOptions = {};
optionsTmp.forEach(o => {
    awardOptions[o.key] = o.val;
});

function getPlayerAwards(p, awardType) {
    const aType = awardOptions[awardType];
    let filter;
    if (awardType === 'all_league') {
        filter = a => {
            const o = awardOptions;
            return a.type === o.first_team || a.type === o.second_team || a.type === o.third_team;
        };
    } else if (awardType === 'all_def') {
        filter = a => {
            const o = awardOptions;
            return a.type === o.first_def || a.type === o.second_def || a.type === o.third_def;
        };
    } else {
        filter = a => a.type === aType;
    }

    const getTeam = season => {
        const stats = p.stats.filter(s => s.season === season);
        if (stats.length > 0) {
            const tid = stats[stats.length - 1].tid;
            return g.teamAbbrevsCache[tid];
        }

        return '-';
    };

    const formatYear = year => {
        return Object.keys(year).map(k => {
            const years = helpers.yearRanges(year[k].map(y => y.season)).join(', ');
            return `${k} <small>(${years})</small>`;
        }).join(', ');
    };

    const awards = p.awards.filter(filter);
    let years = awards.map(a => {
        return {team: getTeam(a.season), season: a.season};
    });
    const lastYear = _.max(years.map(y => y.season)).toString();
    years = formatYear(_.groupBy(years, 'team'));

    return {
        player: `<a href="${helpers.leagueUrl(["player", p.pid])}">${p.firstName} ${p.lastName}</a>`,
        count: awards.length,
        countText: awards.length.toString(),
        years,
        lastYear,
        retired: (p.retiredYear) ? "yes" : "no",
        hof: (p.hof) ? "yes" : "no",
    };
}

async function updateAwardsRecords(inputs, updateEvents, vm) {
    if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("firstRun") >= 0 || inputs.awardType !== vm.awardType) {
        let players = await g.dbl.players.getAll();
        players = await player.withStats(null, players, {
            statsSeasons: 'all',
        });
        players = players.filter(p => p.awards.length > 0);

        const awardsRecords = players
            .map(p => getPlayerAwards(p, inputs.awardType))
            .filter(o => o.count > 0);

        return {
            awardsRecords,
            playerCount: awardsRecords.length,
            awardTypeVal: awardOptions[inputs.awardType],
            awardType: inputs.awardType,
        };
    }
}

function uiFirst(vm) {
    ko.computed(() => {
        ui.title("Awards Records");
    }).extend({
        throttle: 1,
    });

    ko.computed(() => {
        ui.datatableSinglePage($("#awards-records"), 0, vm.awardsRecords().map(p => {
            return [p.player, p.countText, p.years, p.lastYear, p.retired, p.hof];
        }), {
            paging: true,
            searching: true,
            pagingType: "bootstrap",
        });
    }).extend({
        throttle: 1,
    });

    ui.tableClickableRows($("#awards-records"));
}

function uiEvery(updateEvents, vm) {
    components.dropdown("awards-records-dropdown", ["awardType"], [vm.awardType()], updateEvents);
}

module.exports = bbgmView.init({
    id: "awardsRecords",
    get,
    InitViewModel,
    mapping,
    runBefore: [updateAwardsRecords],
    uiFirst,
    uiEvery,
});

