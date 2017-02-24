import React from 'react';
import * as api from '../api';
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

        await api.deleteOldData(this.state);

        logEvent({
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

            <form onSubmit={this.handleSubmit}>
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
