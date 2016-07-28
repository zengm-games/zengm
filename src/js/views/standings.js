const g = require('../globals');
const ui = require('../ui');
const team = require('../core/team');
const React = require('react');
const components = require('./components');
const bbgmViewReact = require('../util/bbgmViewReact');
const helpers = require('../util/helpers');


function get(req) {
    return {
        season: helpers.validateSeason(req.params.season),
    };
}

async function updateStandings(inputs, updateEvents, state) {
console.log('updateStandings', inputs, state);
    if (updateEvents.indexOf("dbChange") >= 0 || (inputs.season === g.season && updateEvents.indexOf("gameSim") >= 0) || inputs.season !== state.season) {
        const teams = await team.filter({
            attrs: ["tid", "cid", "did", "abbrev", "region", "name"],
            seasonAttrs: ["won", "lost", "winp", "wonHome", "lostHome", "wonAway", "lostAway", "wonDiv", "lostDiv", "wonConf", "lostConf", "lastTen", "streak"],
            season: inputs.season,
            sortBy: ["winp", "-lost", "won"],
        });

        const numPlayoffTeams = Math.pow(2, g.numPlayoffRounds);

        const confs = [];
        for (let i = 0; i < g.confs.length; i++) {
            const playoffsRank = [];
            const confTeams = [];
            let l = 0;
            for (let k = 0; k < teams.length; k++) {
                if (g.confs[i].cid === teams[k].cid) {
                    playoffsRank[teams[k].tid] = l + 1; // Store ranks by tid, for use in division standings
                    confTeams.push(helpers.deepCopy(teams[k]));
                    confTeams[l].rank = l + 1;
                    if (l === 0) {
                        confTeams[l].gb = 0;
                    } else {
                        confTeams[l].gb = helpers.gb(confTeams[0], confTeams[l]);
                    }
                    if (confTeams[l].tid === g.userTid) {
                        confTeams[l].highlight = true;
                    } else {
                        confTeams[l].highlight = false;
                    }
                    l += 1;
                }
            }

            confs.push({name: g.confs[i].name, divs: [], teams: confTeams});

            for (let j = 0; j < g.divs.length; j++) {
                if (g.divs[j].cid === g.confs[i].cid) {
                    const divTeams = [];
                    let l = 0;
                    for (let k = 0; k < teams.length; k++) {
                        if (g.divs[j].did === teams[k].did) {
                            divTeams.push(helpers.deepCopy(teams[k]));
                            if (l === 0) {
                                divTeams[l].gb = 0;
                            } else {
                                divTeams[l].gb = helpers.gb(divTeams[0], divTeams[l]);
                            }

                            if (playoffsRank[divTeams[l].tid] <= numPlayoffTeams / 2) {
                                divTeams[l].playoffsRank = playoffsRank[divTeams[l].tid];
                            } else {
                                divTeams[l].playoffsRank = null;
                            }

                            if (divTeams[l].tid === g.userTid) {
                                divTeams[l].highlight = true;
                            } else {
                                divTeams[l].highlight = false;
                            }

                            l += 1;
                        }
                    }

                    confs[i].divs.push({did: g.divs[j].did, name: g.divs[j].name, teams: divTeams});
                }
            }
        }

        const playoffsByConference = g.confs.length === 2 && !localStorage.top16playoffs;

        // Fix playoffsRank if conferences don't matter
        if (!playoffsByConference) {
            for (let i = 0; i < teams.length; i++) {
                const t = teams[i];
                const div = confs[t.cid].divs.find(div => t.did === div.did);
                if (div) {
                    const t2 = div.teams.find(t2 => t.tid === t2.tid);
                    if (t2) {
                        t2.playoffsRank = i < numPlayoffTeams ? i + 1 : null;
                    }
                }
            }
        }

        return {
            confs,
            playoffsByConference,
            season: inputs.season,
        };
    }
}

/*function uiFirst(vm) {
    ko.computed(() => {
        ui.title(`Standings - ${vm.season()}`);
    }).extend({throttle: 1});

    ui.tableClickableRows($(".standings-division"));
}

function uiEvery(updateEvents, vm) {
    components.dropdown("standings-dropdown", ["seasons"], [vm.season()], updateEvents);
}*/

const initialState = {
    season: null,
    confs: [],
};

const Component = props => {
console.log('standings props', props);
    return (
        <div>
            DROPDOWNS
            <h1>Standings NEWWINDOW</h1>
            {props.confs.map(conf => {
                return <div key={conf.cid}>
                    <h2>{conf.name}</h2>
                    <div className="row">
                        <div className="col-sm-9">
                            {conf.divs.map(div => {
                                return <div className="table-responsive" key={div.did}>
                                    <table className="table table-striped table-bordered table-condensed standings-division">
                                        <thead>
                                            <tr><th width="100%">{div.name}</th><th>W</th><th>L</th><th>Pct</th><th>GB</th><th>Home</th><th>Road</th><th>Div</th><th>Conf</th><th>Streak</th><th>L10</th></tr>
                                        </thead>
                                        <tbody>
                                            {div.teams.map(t => {
                                                return <tr data-bind="css: {info: highlight}" key={t.tid}>
                                                    <td>
                                                        <a data-bind="attrLeagueUrl: {href: ['roster', abbrev, $parents[2].season]}">{t.region} {t.name}</a>
                                                        <span>{t.playoffsRank ? ` (${t.playoffsRank})` : ''}</span>
                                                    </td>
                                                    <td>{t.won}</td>
                                                    <td>{t.lost}</td>
                                                    <td>{helpers.roundWinp(t.winp)}</td>
                                                    <td>{t.gb}</td>
                                                    <td>{t.wonHome} {t.lostHome}</td>
                                                    <td>{t.wonAway} {t.lostAway}</td>
                                                    <td>{t.wonDiv} {t.lostDiv}</td>
                                                    <td>{t.wonConf} {t.lostConf}</td>
                                                    <td>{t.streak}</td>
                                                    <td>{t.lastTen}</td>
                                                </tr>;
                                            })}
                                        </tbody>
                                    </table>
                                </div>;
                            })}
                        </div>

                        <div className="col-sm-3 hidden-xs">
                            <table className="table table-striped table-bordered table-condensed">
                            <thead>
                                <tr><th width="100%">Team</th><th style={{textAlign: 'right'}}>GB</th></tr>
                            </thead>
                            <tbody>
                                {conf.teams.map(t => {
                                    return <tr data-bind="css: {separator: $index() === 7 && $root.playoffsByConference(), info: highlight}" key={t.tid}>
                                        <td>{t.rank}. <a data-bind="attrLeagueUrl: {href: ['roster', abbrev, $parents[1].season]}">{t.region}</a></td>
                                        <td style={{textAlign: 'right'}}>{t.gb}</td>
                                    </tr>;
                                })}
                            </tbody>
                            </table>
                        </div>
                    </div>
                </div>;
            })}
        </div>
    );
};

module.exports = bbgmViewReact.init({
    id: "standings",
    get,
    runBefore: [updateStandings],
    initialState,
    Component,
});
