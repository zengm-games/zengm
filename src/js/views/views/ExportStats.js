const Promise = require('bluebird');
const React = require('react');
const _ = require('underscore');
const g = require('../../globals');
const player = require('../../core/player');
const bbgmViewReact = require('../../util/bbgmViewReact');
const {DownloadDataLink} = require('../components');

function genFilename(leagueName, season, grouping) {
    const filename = `BBGM_${leagueName.replace(/[^a-z0-9]/gi, '_')}_${season}_${season === "all" ? "seasons" : "season"}_${grouping === "averages" ? "Average_Stats" : "Game_Stats"}`;

    return `${filename}.csv`;
}

// playerAveragesCSV(2015) - just 2015 stats
// playerAveragesCSV("all") - all stats
async function playerAveragesCSV(season) {
    let players = await g.dbl.players.getAll();
    players = await player.withStats(null, players, {
        statsSeasons: season === "all" ? "all" : [season],
    });

    // Array of seasons in stats, either just one or all of them
    const seasons = _.uniq(_.flatten(players.map(p => p.stats)).map(ps => ps.season));

    let output = "pid,Name,Pos,Age,Team,Season,GP,GS,Min,FGM,FGA,FG%,3PM,3PA,3P%,FTM,FTA,FT%,OReb,DReb,Reb,Ast,TO,Stl,Blk,BA,PF,Pts,+/-,PER,EWA\n";

    seasons.forEach(s => {
        player.filter(players, {
            attrs: ["pid", "name", "age"],
            ratings: ["pos"],
            stats: ["abbrev", "gp", "gs", "min", "fg", "fga", "fgp", "tp", "tpa", "tpp", "ft", "fta", "ftp", "orb", "drb", "trb", "ast", "tov", "stl", "blk", "ba", "pf", "pts", "pm", "per", "ewa"],
            season: s,
        }).forEach(p => {
            output += `${[p.pid, p.name, p.ratings.pos, p.age, p.stats.abbrev, s, p.stats.gp, p.stats.gs, p.stats.min, p.stats.fg, p.stats.fga, p.stats.fgp, p.stats.tp, p.stats.tpa, p.stats.tpp, p.stats.ft, p.stats.fta, p.stats.ftp, p.stats.orb, p.stats.drb, p.stats.trb, p.stats.ast, p.stats.tov, p.stats.stl, p.stats.blk, p.stats.ba, p.stats.pf, p.stats.pts, p.stats.pm, p.stats.per, p.stats.ewa].join(",")}\n`;
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

    const teams = games.map(gm => gm.teams);
    const seasons = games.map(gm => gm.season);
    for (let i = 0; i < teams.length; i++) {
        for (let j = 0; j < 2; j++) {
            const t = teams[i][j];
            const t2 = teams[i][j === 0 ? 1 : 0];
            for (const p of t.players) {
                output += `${[p.pid, p.name, p.pos, g.teamAbbrevsCache[t.tid], g.teamAbbrevsCache[t2.tid], `${t.pts}-${t2.pts}`, t.pts > t2.pts ? "W" : "L", seasons[i], games[i].playoffs, p.min, p.fg, p.fga, p.fgp, p.tp, p.tpa, p.tpp, p.ft, p.fta, p.ftp, p.orb, p.drb, p.trb, p.ast, p.tov, p.stl, p.blk, p.ba, p.pf, p.pts, p.pm].join(",")}\n`;
            }
        }
    }

    return output;
}

class ExportStats extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            data: null,
            filename: null,
            status: null,
        };
        this.handleSubmit = this.handleSubmit.bind(this);
        this.resetState = this.resetState.bind(this);
    }

    async handleSubmit(e) {
        e.preventDefault();

        this.setState({
            data: null,
            filename: null,
            status: 'Generating...',
        });

        // Get array of object stores to export
        const selectEls = e.target.getElementsByTagName('select');
        const grouping = selectEls[0].value;
        const season = selectEls[1].value === "all" ? "all" : parseInt(selectEls[1].value, 10);

        let csvPromise;
        if (grouping === "averages") {
            csvPromise = playerAveragesCSV(season);
        } else if (grouping === "games") {
            csvPromise = playerGamesCSV(season);
        } else {
            this.setState({
                data: null,
                filename: null,
                status: 'Invalid grouping selected',
            });
            return;
        }

        const [data, l] = await Promise.all([
            csvPromise,
            g.dbm.leagues.get(g.lid),
        ]);

        const filename = genFilename(l.name, season, grouping);

        this.setState({
            data,
            filename,
            status: null,
        });
    }

    resetState() {
        this.setState({
            data: null,
            filename: null,
            status: null,
        });
    }

    render() {
        bbgmViewReact.title('Export Stats');

        const {seasons} = this.props;

        return <div>
            <h1>Export Stats</h1>

            <p>Here you can export your league's stats to CSV files which can be easily viewed in any spreadsheet program like Excel or <a href="http://www.libreoffice.org/">LibreOffice Calc</a>.</p>

            <h2>Player Stats</h2>

            <form className="form-inline" onSubmit={this.handleSubmit} data-no-davis="true">
                <div className="form-group">
                    <select className="form-control" onChange={this.resetState}>
                        <option value="averages">Season Averages</option>
                        <option value="games">Individual Games</option>
                    </select>
                </div>{" "}
                <div className="form-group">
                    <select className="form-control" onChange={this.resetState}>
                        {seasons.map(s => {
                            return <option key={s.key} value={s.key}>{s.val}</option>;
                        })}
                    </select>
                </div>{" "}
                <button type="submit" className="btn btn-primary" disabled={this.state.generating}>Export Stats</button>
            </form>

            <p style={{marginTop: '1em'}}>
                <DownloadDataLink
                    data={this.state.data}
                    downloadText="Download Exported Stats"
                    filename={this.state.filename}
                    mimeType="text/csv"
                    status={this.state.status}
                />
            </p>
        </div>;
    }
}

ExportStats.propTypes = {
    seasons: React.PropTypes.arrayOf(React.PropTypes.shape({
        key: React.PropTypes.string.isRequired,
        val: React.PropTypes.string.isRequired,
    })).isRequired,
};

module.exports = ExportStats;
