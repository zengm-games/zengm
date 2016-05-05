const g = require('../globals');
const ui = require('../ui');
const player = require('../core/player');
const Promise = require('bluebird');
const _ = require('underscore');
const bbgmView = require('../util/bbgmView');
const helpers = require('../util/helpers');

function genFileName(leagueName, season, grouping) {
    const fileName = "BBGM_" + leagueName.replace(/[^a-z0-9]/gi, '_') + "_" + season + "_" + (season === "all" ? "seasons" : "season") + (grouping === "averages" ? "_Average_Stats" : "_Game_Stats");

    return fileName + ".csv";
}

// playerAveragesCSV(2015) - just 2015 stats
// playerAveragesCSV("all") - all stats
async function playerAveragesCSV(season) {
    let players = await g.dbl.players.getAll();
    players = await player.withStats(null, players, {
        statsSeasons: season === "all" ? "all" : [season]
    });

    // Array of seasons in stats, either just one or all of them
    const seasons = _.uniq(_.flatten(players.map(p => p.stats)).map(ps => ps.season));

    let output = "pid,Name,Pos,Age,Team,Season,GP,GS,Min,FGM,FGA,FG%,3PM,3PA,3P%,FTM,FTA,FT%,OReb,DReb,Reb,Ast,TO,Stl,Blk,BA,PF,Pts,+/-,PER,EWA\n";

    seasons.forEach(s => {
        player.filter(players, {
            attrs: ["pid", "name", "age"],
            ratings: ["pos"],
            stats: ["abbrev", "gp", "gs", "min", "fg", "fga", "fgp", "tp", "tpa", "tpp", "ft", "fta", "ftp", "orb", "drb", "trb", "ast", "tov", "stl", "blk", "ba", "pf", "pts", "pm", "per", "ewa"],
            season: s
        }).forEach(p => {
            output += [p.pid, p.name, p.ratings.pos, p.age, p.stats.abbrev, s, p.stats.gp, p.stats.gs, p.stats.min, p.stats.fg, p.stats.fga, p.stats.fgp, p.stats.tp, p.stats.tpa, p.stats.tpp, p.stats.ft, p.stats.fta, p.stats.ftp, p.stats.orb, p.stats.drb, p.stats.trb, p.stats.ast, p.stats.tov, p.stats.stl, p.stats.blk, p.stats.ba, p.stats.pf, p.stats.pts, p.stats.pm, p.stats.per, p.stats.ewa].join(",") + "\n";
        });
    });

    return output;
}

// playerAveragesCSV(2015) - just 2015 games
// playerAveragesCSV("all") - all games
async function playerGamesCSV(season) {
    let games;
    if (season === "all") {
        games = await g.dbl.games.getAll();
    } else {
        games = await g.dbl.games.index('season').getAll(season);
    }

    let output = "pid,Name,Pos,Team,Opp,Score,WL,Season,Playoffs,Min,FGM,FGA,FG%,3PM,3PA,3P%,FTM,FTA,FT%,OReb,DReb,Reb,Ast,TO,Stl,Blk,BA,PF,Pts,+/-\n";

    const teams = games.map(g => g.teams);
    const seasons = games.map(g => g.season);
    for (let i = 0; i < teams.length; i++) {
        for (let j = 0; j < 2; j++) {
            const t = teams[i][j];
            const t2 = teams[i][j === 0 ? 1 : 0];
            t.players.forEach(p => {
                output += [p.pid, p.name, p.pos, g.teamAbbrevsCache[t.tid], g.teamAbbrevsCache[t2.tid], `${t.pts}-${t2.pts}`, t.pts > t2.pts ? "W" : "L", seasons[i], games[i].playoffs, p.min, p.fg, p.fga, p.fgp, p.tp, p.tpa, p.tpp, p.ft, p.fta, p.ftp, p.orb, p.drb, p.trb, p.ast, p.tov, p.stl, p.blk, p.ba, p.pf, p.pts, p.pm].join(",") + "\n";
            });
        }
    }

    return output;
}

function InitViewModel() {
    this.formChanged = () => {
        // Clear old link when form changes
        document.getElementById("download-link").innerHTML = ""; // Clear "Generating..."
    };
}

async function post(req) {
    const downloadLink = document.getElementById("download-link");
    downloadLink.innerHTML = "Generating...";

    const season = req.params.season === "all" ? "all" : parseInt(req.params.season, 10);

    let csvPromise;
    if (req.params.grouping === "averages") {
        csvPromise = playerAveragesCSV(season);
    } else if (req.params.grouping === "games") {
        csvPromise = playerGamesCSV(season);
    } else {
        throw new Error("This should never happen");
    }

    const [output, l] = await Promise.all([
        csvPromise,
        g.dbm.leagues.get(g.lid)
    ]);

    const blob = new Blob([output], {type: "text/csv"});
    const url = window.URL.createObjectURL(blob);
    const fileName = genFileName(l.name, season, req.params.grouping);

    const a = document.createElement("a");
    a.download = fileName;
    a.href = url;
    a.textContent = "Download Exported Stats";
    a.dataset.noDavis = "true";
//    a.click(); // Works in Chrome to auto-download, but not Firefox http://stackoverflow.com/a/20194533/786644

    downloadLink.innerHTML = ""; // Clear "Generating..."
    downloadLink.appendChild(a);

    // Delete object, eventually
    window.setTimeout(() => {
        window.URL.revokeObjectURL(url);
        downloadLink.innerHTML = "Download link expired."; // Remove expired link
    }, 60 * 1000);
}

function updateExportStats(inputs, updateEvents) {
    if (updateEvents.indexOf("firstRun") >= 0 || updateEvents.indexOf("newPhase") >= 0 || updateEvents.indexOf("dbChange") >= 0) {
        const seasons = helpers.getSeasons();
        const options = [{
            key: "all",
            val: "All Seasons"
        }];
        for (let j = 0; j < seasons.length; j++) {
            options.push({
                key: seasons[j].season,
                val: seasons[j].season + " season"
            });
        }
        return {
            seasons: options
        };
    }
}

function uiFirst() {
    ui.title("Export Stats");
}

module.exports = bbgmView.init({
    id: "exportStats",
    InitViewModel,
    post,
    runBefore: [updateExportStats],
    uiFirst
});
