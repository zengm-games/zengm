const React = require('react');
const ui = require('../../ui');
const league = require('../../core/league');
const bbgmViewReact = require('../../util/bbgmViewReact');
const helpers = require('../../util/helpers');

class DeleteLeague extends React.Component {
    constructor(props) {
        super(props);
        this.state = {deleting: false};
    }

    async handleDeleteLeague(lid) {
        this.setState({deleting: true});

        await league.remove(lid);
        ui.realtimeUpdate([], "/");
    }

    render() {
        const {lid, name, numGames, numPlayers, numSeasons} = this.props;

        bbgmViewReact.title(`Delete League ${lid}?`);

        return <div>
            <h1>Delete League {lid}?</h1>

            {
                name
            ?
                <p>Are you <i>absolutely</i> sure you want to delete {name} (League {lid})? You will <i>permanently</i> lose any record of all {helpers.numberWithCommas(numSeasons)} seasons, {helpers.numberWithCommas(numPlayers)} players, and {helpers.numberWithCommas(numGames)} games from this league (well... unless you have a backup somewhere).</p>
            :
                <p>Are you <i>absolutely</i> sure you want to delete League {lid}? You will <i>permanently</i> lose any record of all seasons, players, and games from this league (well... unless you have a backup somewhere).</p>
            }

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

module.exports = DeleteLeague;
