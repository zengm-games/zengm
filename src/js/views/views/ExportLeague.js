import React from 'react';
import g from '../../globals';
import * as league from '../../core/league';
import bbgmViewReact from '../../util/bbgmViewReact';
import {DownloadDataLink} from '../components';

const categories = [{
    objectStores: "players,releasedPlayers,awards",
    name: "Players",
    desc: "All player info, ratings, and awards - but not stats!",
    checked: true,
}, {
    objectStores: "playerStats",
    name: "Player Stats",
    desc: "All player stats.",
    checked: true,
}, {
    objectStores: "teams,teamSeasons,teamStats",
    name: "Teams",
    desc: "All team info and stats.",
    checked: true,
}, {
    objectStores: "schedule,playoffSeries",
    name: "Schedule",
    desc: "Current regular season schedule and playoff series.",
    checked: true,
}, {
    objectStores: "draftPicks",
    name: "Draft Picks",
    desc: "Traded draft picks.",
    checked: true,
}, {
    objectStores: "trade,negotiations,gameAttributes,draftOrder,messages,events,playerFeats",
    name: "Game State",
    desc: "Interactions with the owner, current contract negotiations, current game phase, etc. Useful for saving or backing up a game, but not for creating custom rosters to share.",
    checked: true,
}, {
    objectStores: "games",
    name: "Box Scores",
    desc: <span className="text-danger">If you've played more than a few seasons, this takes up a ton of space!</span>,
    checked: false,
}];

function genFilename(data) {
    const leagueName = data.meta !== undefined ? data.meta.name : `League ${g.lid}`;

    let filename = `BBGM_${leagueName.replace(/[^a-z0-9]/gi, '_')}_${g.season}_${g.PHASE_TEXT[g.phase].replace(/[^a-z0-9]/gi, '_')}`;

    if (g.phase === g.PHASE.REGULAR_SEASON && data.hasOwnProperty("teams")) {
        const season = data.teams[g.userTid].seasons[data.teams[g.userTid].seasons.length - 1];
        filename += `_${season.won}-${season.lost}`;
    }

    if (g.phase === g.PHASE.PLAYOFFS && data.hasOwnProperty("playoffSeries")) {
        // Most recent series info
        const playoffSeries = data.playoffSeries[data.playoffSeries.length - 1];
        const rnd = playoffSeries.currentRound;
        filename += `_Round_${playoffSeries.currentRound + 1}`;

        // Find the latest playoff series with the user's team in it
        const series = playoffSeries.series;
        for (let i = 0; i < series[rnd].length; i++) {
            if (series[rnd][i].home.tid === g.userTid) {
                filename += `_${series[rnd][i].home.won}-${series[rnd][i].away.won}`;
            } else if (series[rnd][i].away.tid === g.userTid) {
                filename += `_${series[rnd][i].away.won}-${series[rnd][i].home.won}`;
            }
        }
    }

    return `${filename}.json`;
}

class ExportLeague extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            data: null,
            filename: null,
            status: null,
        };
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    async handleSubmit(e) {
        e.preventDefault();

        this.setState({
            data: null,
            filename: null,
            status: 'Generating...',
        });

        // Get array of object stores to export
        const objectStores = [...e.target.getElementsByTagName('input')]
            .filter(input => input.checked)
            .map(input => input.value)
            .join(",")
            .split(",");

        // Can't export player stats without players
        if (objectStores.includes("playerStats") && !objectStores.includes("players")) {
            this.setState({
                data: null,
                filename: null,
                status: <span className="text-danger">You can't export player stats without exporting players!</span>,
            });
            return;
        }

        const data = await league.exportLeague(objectStores);
        const json = JSON.stringify(data, undefined, 2);

        const filename = genFilename(data);

        this.setState({
            data: json,
            filename,
            status: null,
        });
    }

    render() {
        bbgmViewReact.title('Export League');

        return <div>
            <h1>Export League</h1>

            <p>Here you can export your entire league data to a single League File. A League File can serve many purposes. You can use it as a <b>backup</b>, to <b>copy a league from one computer to another</b>, or to use as the base for a <b>custom roster file</b> to share with others. Select as much or as little information as you want to export, since any missing information will be filled in with default values when it is used. <a href="http://basketball-gm.com/manual/customization/">Read the manual for more info.</a></p>

            <form onSubmit={this.handleSubmit}>
                {categories.map(cat => <div key={cat.name} className="checkbox">
                    <label>
                        <input type="checkbox" value={cat.objectStores} defaultChecked={cat.checked} /> {cat.name}
                        <p className="help-block">{cat.desc}</p>
                    </label>
                </div>)}
                <button type="submit" className="btn btn-primary" disabled={this.state.generating}>Export League</button>
            </form>

            <p style={{marginTop: '1em'}}>
                <DownloadDataLink
                    data={this.state.data}
                    downloadText="Download Exported League File"
                    mimeType="application/json"
                    filename={this.state.filename}
                    status={this.state.status}
                />
            </p>
        </div>;
    }
}

export default ExportLeague;
