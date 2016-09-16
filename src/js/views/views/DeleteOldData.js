import React from 'react';
import g from '../../globals';
import * as league from '../../core/league';
import bbgmViewReact from '../../util/bbgmViewReact';
import logEvent from '../../util/logEvent';
import {NewWindowLink} from '../components';

class DeleteOldData extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            deleting: false,
            boxScores: true,
            teamStats: true,
            teamHistory: true,
            retiredPlayersUnnotable: true,
            retiredPlayers: true,
            playerStatsUnnotable: true,
            playerStats: true,
        };
        this.handleChanges = {
            boxScores: this.handleChange.bind(this, 'boxScores'),
            playerStats: this.handleChange.bind(this, 'playerStats'),
            playerStatsUnnotable: this.handleChange.bind(this, 'playerStatsUnnotable'),
            retiredPlayers: this.handleChange.bind(this, 'retiredPlayers'),
            retiredPlayersUnnotable: this.handleChange.bind(this, 'retiredPlayersUnnotable'),
            teamHistory: this.handleChange.bind(this, 'teamHistory'),
            teamStats: this.handleChange.bind(this, 'teamStats'),
        };
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChange(name, e) {
        this.setState({
            [name]: e.target.checked,
        });
    }

    async handleSubmit(e) {
        e.preventDefault();
        this.setState({
            deleting: true,
        });

        await g.dbl.tx(["games", "teams", "teamSeasons", "teamStats", "players", "playerStats"], "readwrite", async tx => {
            if (this.state.boxScores) {
                await tx.games.clear();
            }

            if (this.state.teamHistory) {
                await tx.teamSeasons.iterate(teamSeason => {
                    if (teamSeason.season < g.season) {
                        return tx.teamSeasons.delete(teamSeason.rid);
                    }
                });
            }

            if (this.state.teamStats) {
                await tx.teamStats.iterate(teamStats => {
                    if (teamStats.season < g.season) {
                        return tx.teamStats.delete(teamStats.rid);
                    }
                });
            }

            if (this.state.retiredPlayers) {
                const toDelete = [];

                await tx.players.index('tid').iterate(g.PLAYER.RETIRED, p => {
                    toDelete.push(p.pid);
                    return tx.players.delete(p.pid);
                });
                await tx.playerStats.iterate(ps => {
                    if (toDelete.indexOf(ps.pid) >= 0) {
                        return tx.playerStats.delete(ps.psid);
                    }
                });
            } else if (this.state.retiredPlayersUnnotable) {
                const toDelete = [];

                await tx.players.index('tid').iterate(g.PLAYER.RETIRED, p => {
                    if (p.awards.length === 0 && p.statsTids.indexOf(g.userTid) < 0) {
                        toDelete.push(p.pid);
                        return tx.players.delete(p.pid);
                    }
                });
                await tx.playerStats.iterate(ps => {
                    if (toDelete.indexOf(ps.pid) >= 0) {
                        return tx.playerStats.delete(ps.psid);
                    }
                });
            }

            if (this.state.playerStats) {
                await tx.players.iterate(p => {
                    p.ratings = [p.ratings[p.ratings.length - 1]];
                    return p;
                });
                await tx.playerStats.iterate(ps => {
                    if (ps.season < g.season) {
                        return tx.playerStats.delete(ps.psid);
                    }
                });
            } else if (this.state.playerStatsUnnotable) {
                const toDelete = [];

                tx.players.iterate(p => {
                    if (p.awards.length === 0 && p.statsTids.indexOf(g.userTid) < 0) {
                        p.ratings = [p.ratings[p.ratings.length - 1]];
                        toDelete.push(p.pid);
                    }
                    return p;
                });
                await tx.playerStats.iterate(ps => {
                    if (ps.season < g.season && toDelete.indexOf(ps.pid) >= 0) {
                        return tx.playerStats.delete(ps.psid);
                    }
                });
            }
        });

        league.updateLastDbChange();

        logEvent(null, {
            type: 'success',
            text: 'Data successfully deleted.',
            saveToDb: false,
        });
        this.setState({
            deleting: false,
        });
    }

    render() {
        bbgmViewReact.title('Delete Old Data');

        return <div>
            <h1>Delete Old Data <NewWindowLink /></h1>

            <p>As you play multiple seasons in a league, the game tends to slow down as data is accumulated in the database. For instance, if you play 20 seasons, game simulation will be approximately twice as slow as in a new league. If you delete old data using the form below, it will restore performance to roughly that of a new league.</p>

            <form onSubmit={this.handleSubmit} data-no-davis="true">
                <div className="checkbox">
                    <label>
                        <input onChange={this.handleChanges.boxScores} type="checkbox" checked={this.state.boxScores} /> Delete Old Box Scores
                    </label>
                </div>
                <div className="checkbox">
                    <label>
                        <input onChange={this.handleChanges.teamStats} type="checkbox" checked={this.state.teamStats} /> Delete Old Team Stats
                    </label>
                </div>
                <div className="checkbox">
                    <label>
                        <input onChange={this.handleChanges.teamHistory} type="checkbox" checked={this.state.teamHistory} /> Delete Old Team History (stuff like W/L, finances, etc)
                    </label>
                </div>
                <div className="checkbox">
                    <label>
                        <input onChange={this.handleChanges.retiredPlayersUnnotable} type="checkbox" checked={this.state.retiredPlayersUnnotable} /> Delete Unnotable Retired Players<br /><i>Won't delete your past players or players who have won awards</i>
                    </label>
                </div>
                <div className="checkbox">
                    <label>
                        <input onChange={this.handleChanges.retiredPlayers} type="checkbox" checked={this.state.retiredPlayers} /> Delete <b>All</b> Retired Players
                    </label>
                </div>
                <div className="checkbox">
                    <label>
                        <input onChange={this.handleChanges.playerStatsUnnotable} type="checkbox" checked={this.state.playerStatsUnnotable} /> Delete Unnotable Player Stats and Ratings <b>(This is the second biggest factor!)</b><br /><i>Won't delete your past players or players who have won awards</i>
                    </label>
                </div>
                <div className="checkbox">
                    <label>
                        <input onChange={this.handleChanges.playerStats} type="checkbox" checked={this.state.playerStats} /> Delete <b>All</b> Player Stats and Ratings <b>(This is the biggest factor!)</b>
                    </label>
                </div>

                <p className="alert alert-danger"><b>Warning!</b> Once you delete old data, it's completely gone! There's no going back! This can impact your players making the Hall of Fame and the completion of in-progress achievements!</p>

                <button className="btn btn-danger" disabled={this.state.deleting} type="submit">Delete Old Data</button>
            </form>
        </div>;
    }
}

export default DeleteOldData;
