import React from 'react';
import * as ui from '../ui';
import * as api from '../api';
import bbgmViewReact from '../../util/bbgmViewReact';
import * as helpers from '../../util/helpers';

class DeleteLeague extends React.Component {
    constructor(props) {
        super(props);
        this.state = {deleting: false};
    }

    async handleDeleteLeague(lid) {
        this.setState({deleting: true});
        await api.removeLeague(lid);
        ui.realtimeUpdate([], "/");
    }

    render() {
        const {lid, name, numGames, numPlayers, numSeasons} = this.props;

        bbgmViewReact.title(`Delete League ${lid}?`);

        let message;
        if (name !== undefined) {
            message = <p>Are you <i>absolutely</i> sure you want to delete {name} (League {lid})? You will <i>permanently</i> lose any record of all {helpers.numberWithCommas(numSeasons)} seasons, {helpers.numberWithCommas(numPlayers)} players, and {helpers.numberWithCommas(numGames)} games from this league (well... unless you have a backup somewhere).</p>;
        } else {
            message = <p>Are you <i>absolutely</i> sure you want to delete League {lid}? You will <i>permanently</i> lose any record of all seasons, players, and games from this league (well... unless you have a backup somewhere).</p>;
        }

        return <div>
            <h1>Delete League {lid}?</h1>

            {message}

            <button
                className="btn btn-danger"
                disabled={this.state.deleting}
                onClick={() => this.handleDeleteLeague(lid)}
                style={{float: 'left', marginRight: '1em'}}
            >
                Yes, I am sure. Delete it!
            </button>
            <a disabled={this.state.deleting} className="btn btn-default" href="/">
                Cancel
            </a>
        </div>;
    }
}

DeleteLeague.propTypes = {
    lid: React.PropTypes.number.isRequired,
    name: React.PropTypes.string,
    numGames: React.PropTypes.number,
    numPlayers: React.PropTypes.number,
    numSeasons: React.PropTypes.number,
};

export default DeleteLeague;
