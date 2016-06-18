const g = require('../globals');
const ui = require('../ui');
const Promise = require('bluebird');
const $ = require('jquery');
const ko = require('knockout');
const team = require('../core/team');
const bbgmView = require('../util/bbgmView');
const helpers = require('../util/helpers');


const mapping = {
    seasons: {
        create: options => options.data,
    },
};

async function updateHistory(inputs, updateEvents) {
    if (updateEvents.indexOf("firstRun") >= 0) {
        const [awards, teams] = await Promise.all([
            g.dbl.awards.getAll(),
            team.filter({
                attrs: ["tid", "abbrev", "region", "name"],
                seasonAttrs: ["season", "playoffRoundsWon", "won", "lost"],
            }),
        ]);

        const seasons = awards.map(a => {
            return {
                season: a.season,
                finalsMvp: a.finalsMvp,
                mvp: a.mvp,
                dpoy: a.dpoy,
                roy: a.roy,
            };
        });

        teams.forEach(t => {
            // t.seasons has same season entries as the "seasons" array built from awards
            for (let i = 0; i < seasons.length; i++) {
                // Find corresponding entries in seasons and t.seasons. Can't assume they are the same because they aren't if some data has been deleted (Improve Performance)
                let found = false;
                let j;
                for (j = 0; j < t.seasons.length; j++) {
                    if (t.seasons[j].season === seasons[i].season) {
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    continue;
                }

                if (t.seasons[j].playoffRoundsWon === 4) {
                    seasons[i].champ = {
                        tid: t.tid,
                        abbrev: t.abbrev,
                        region: t.region,
                        name: t.name,
                        won: t.seasons[j].won,
                        lost: t.seasons[j].lost,
                    };
                } else if (t.seasons[j].playoffRoundsWon === 3) {
                    seasons[i].runnerUp = {
                        abbrev: t.abbrev,
                        region: t.region,
                        name: t.name,
                        won: t.seasons[j].won,
                        lost: t.seasons[j].lost,
                    };
                }
            }
        });

        // Count up number of championships per team
        const championshipsByTid = [];
        for (let i = 0; i < g.numTeams; i++) {
            championshipsByTid.push(0);
        }
        for (let i = 0; i < seasons.length; i++) {
            if (seasons[i].champ) {
                championshipsByTid[seasons[i].champ.tid] += 1;
                seasons[i].champ.count = championshipsByTid[seasons[i].champ.tid];
                delete seasons[i].champ.tid;
            }
        }

        return {
            seasons,
        };
    }
}

function uiFirst(vm) {
    ui.title("League History");

    const awardName = (award, season) => {
        if (!award) {
            // For old seasons with no Finals MVP
            return 'N/A';
        }

        return `${helpers.playerNameLabels(award.pid, award.name)} (<a href="${helpers.leagueUrl(["roster", g.teamAbbrevsCache[award.tid], season])}">${g.teamAbbrevsCache[award.tid]}</a>)`;
    };
    const teamName = (t, season) => {
        if (t) {
            return `<a href="${helpers.leagueUrl(["roster", t.abbrev, season])}">${t.region}</a> (${t.won}-${t.lost})`;
        }

        // This happens if there is missing data, such as from Improve Performance
        return 'N/A';
    };

    ko.computed(() => {
        ui.datatable($("#history-all"), 0, vm.seasons().map(s => {
            let countText, seasonLink;
            if (s.champ) {
                seasonLink = `<a href="${helpers.leagueUrl(["history", s.season])}">${s.season}</a>`;
                countText = ` - ${helpers.ordinal(s.champ.count)} title`;
            } else {
                // This happens if there is missing data, such as from Improve Performance
                seasonLink = String(s.season);
                countText = '';
            }

            return [seasonLink, teamName(s.champ, s.season) + countText, teamName(s.runnerUp, s.season), awardName(s.finalsMvp, s.season), awardName(s.mvp, s.season), awardName(s.dpoy, s.season), awardName(s.roy, s.season)];
        }));
    }).extend({throttle: 1});
}

module.exports = bbgmView.init({
    id: "historyAll",
    mapping,
    runBefore: [updateHistory],
    uiFirst,
});
