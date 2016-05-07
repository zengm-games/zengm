const g = require('../globals');
const ui = require('../ui');
const $ = require('jquery');
const ko = require('knockout');
const _ = require('underscore');
const team = require('../core/team');
const bbgmView = require('../util/bbgmView');
const helpers = require('../util/helpers');
const components = require('./components');
const Promise = require('bluebird');

function get(req) {
    return {
        byType: req.params.byType || "team"
    };
}

function InitViewModel() {
    this.byType = ko.observable();
    this.seasonCount = ko.observable();
}

const mapping = {
    teamRecords: {
        create: options => options.data
    }
};

function getTeamLink(t) {
    return `<a href="${helpers.leagueUrl(["team_history", t.abbrev])}">${t.region} ${t.name}</a>`;
}

function getTeamRecord(t, awards) {
    let totalWon = 0;
    let totalLost = 0;
    let playoffAppearances = 0;
    let championships = 0;
    let finals = 0;
    let lastPlayoffAppearance = "-";
    let lastChampionship = "-";
    for (let i = 0; i < t.seasons.length; i++) {
        totalWon += t.seasons[i].won;
        totalLost += t.seasons[i].lost;
        if (t.seasons[i].playoffRoundsWon >= 0) {
            playoffAppearances++;
            lastPlayoffAppearance = t.seasons[i].season;
        }
        if (t.seasons[i].playoffRoundsWon >= 3) {
            finals++;
        }
        if (t.seasons[i].playoffRoundsWon === 4) {
            championships++;
            lastChampionship = t.seasons[i].season;
        }
    }

    const totalWP = (totalWon > 0) ? helpers.round(totalWon / (totalWon + totalLost), 3) : "0.000";

    return {
        team: getTeamLink(t),
        cid: t.cid,
        did: t.did,
        won: totalWon.toString(),
        lost: totalLost.toString(),
        winp: totalWP.toString().slice(1),
        playoffAppearances: playoffAppearances.toString(),
        lastPlayoffAppearance: lastPlayoffAppearance.toString(),
        championships: championships.toString(),
        lastChampionship: lastChampionship.toString(),
        finals: finals.toString(),
        mvp: awards[t.tid].mvp.toString(),
        dpoy: awards[t.tid].dpoy.toString(),
        smoy: awards[t.tid].smoy.toString(),
        roy: awards[t.tid].roy.toString(),
        bestRecord: awards[t.tid].bestRecord.toString(),
        bestRecordConf: awards[t.tid].bestRecordConf.toString(),
        allRookie: awards[t.tid].allRookie.toString(),
        allLeague: awards[t.tid].allLeagueTotal.toString(),
        allDefense: awards[t.tid].allDefenseTotal.toString()
    };
}

function tallyAwards(awards) {
    const teams = _.range(g.numTeams).map(() => {
        return {
            mvp: 0,
            dpoy: 0,
            smoy: 0,
            roy: 0,
            allLeague: [0, 0, 0],
            allLeagueTotal: 0,
            allDefense: [0, 0, 0],
            allDefenseTotal: 0,
            allRookie: 0,
            bestRecord: 0,
            bestRecordConf: 0
        };
    });

    awards.forEach(a => {
        teams[a.mvp.tid].mvp++;
        teams[a.dpoy.tid].dpoy++;
        teams[a.smoy.tid].smoy++;
        teams[a.roy.tid].roy++;
        teams[a.bre.tid].bestRecordConf++;
        teams[a.brw.tid].bestRecordConf++;
        if (a.bre.won === a.brw.won) {
            teams[a.bre.tid].bestRecord += 0.5;
            teams[a.brw.tid].bestRecord += 0.5;
        } else if (a.bre.won > a.brw.won) {
            teams[a.bre.tid].bestRecord++;
        } else {
            teams[a.brw.tid].bestRecord++;
        }

        for (let i = 0; i < a.allRookie.length; i++) {
            teams[a.allRookie[i].tid].allRookie++;
        }

        for (let i = 0; i < a.allLeague.length; i++) {
            a.allLeague[i].players.forEach(p => {
                teams[p.tid].allLeague[i]++;
                teams[p.tid].allLeagueTotal++;
            });
        }

        for (let i = 0; i < a.allDefensive.length; i++) {
            a.allDefensive[i].players.forEach(p => {
                teams[p.tid].allDefense[i]++;
                teams[p.tid].allDefenseTotal++;
            });
        }
    });

    return teams;
}

function sumRecordsFor(group, id, name, records) {
    const except = ['lastChampionship', 'lastPlayoffAppearance', 'team', 'cid', 'did', 'winp'];
    const keys = Object.keys(records[0]);
    const out = {};

    const xRecords = records.filter(r => r[group] === id);

    keys.forEach(k => {
        let v;
        if (except.indexOf(k) >= 0) {
            v = "-";
        } else {
            v = xRecords.reduce((a, b) => a + Number(b[k]), 0);
        }
        out[k] = v.toString();
    });
    out.team = name;
    out.winp = String(out.won / (out.won + out.lost));
    out.winp = (out.won > 0) ? helpers.round(Number(out.won) / (Number(out.won) + Number(out.lost)), 3) : "0.000";
    return out;
}

async function updateTeamRecords(inputs, updateEvents, vm) {
    if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("firstRun") >= 0 || inputs.byType !== vm.byType()) {
        const [teams, awards] = await Promise.all([
            team.filter({
                attrs: ["tid", "cid", "did", "abbrev", "region", "name"],
                seasonAttrs: ["season", "playoffRoundsWon", "won", "lost"]
            }),
            g.dbl.awards.getAll()
        ]);

        const awardsPerTeam = tallyAwards(awards);
        const teamRecords = [];
        for (let i = 0; i < teams.length; i++) {
            teamRecords.push(getTeamRecord(teams[i], awardsPerTeam));
        }
        const seasonCount = teamRecords.map(tr => tr.championships).reduce((a, b) => Number(a) + Number(b));

        let display, displayName;
        if (inputs.byType === "team") {
            display = teamRecords;
            displayName = "Team";
        } else if (inputs.byType === "conf") {
            display = g.confs.map(conf => sumRecordsFor('cid', conf.cid, conf.name, teamRecords));
            displayName = "Conference";
        } else {
            display = g.divs.map(div => sumRecordsFor('did', div.did, div.name, teamRecords));
            displayName = "Division";
        }

        return {
            teamRecords: display,
            displayName,
            seasonCount,
            byType: inputs.byType
        };
    }
}

function uiFirst(vm) {
    ko.computed(() => {
        ui.title("Team Records");
    }).extend({
        throttle: 1
    });

    ko.computed(() => {
        ui.datatableSinglePage($("#team-records"), 0, vm.teamRecords().map(t => {
            return [t.team, t.won, t.lost, t.winp, t.playoffAppearances, t.lastPlayoffAppearance, t.finals, t.championships, t.lastChampionship, t.mvp, t.dpoy, t.smoy, t.roy, t.bestRecord, t.bestRecordConf, t.allRookie, t.allLeague, t.allDefense];
        }));
    }).extend({
        throttle: 1
    });

    ui.tableClickableRows($("#team-records"));
}

function uiEvery(updateTeamRecords, vm) {
    components.dropdown("team-records-dropdown", ["teamRecordType"], [vm.byType(), updateTeamRecords]);
}

module.exports = bbgmView.init({
    id: "teamRecords",
    get,
    InitViewModel,
    mapping,
    runBefore: [updateTeamRecords],
    uiFirst,
    uiEvery
});

