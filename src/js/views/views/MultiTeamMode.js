const React = require('react');
const g = require('../../globals');
const ui = require('../../ui');
const league = require('../../core/league');
const bbgmViewReact = require('../../util/bbgmViewReact');
const {NewWindowLink} = require('../components');

class MultiTeamMode extends React.Component {
    constructor(props) {
        super(props);
        this.handleChange = this.handleChange.bind(this);
    }

    async handleChange(e) {
        const newUserTids = [...e.target.options]
            .filter(o => o.selected)
            .map(o => parseInt(o.value, 10))
            .filter(n => !isNaN(n));

        if (newUserTids.length < 1) {
            return;
        }

        if (JSON.stringify(newUserTids) !== JSON.stringify(this.props.userTids)) {
            const gameAttributes = {userTids: newUserTids};
            if (newUserTids.indexOf(g.userTid) < 0) {
                gameAttributes.userTid = newUserTids[0];
            }
            await league.setGameAttributesComplete(gameAttributes);

            if (newUserTids.length === 1) {
                league.updateMetaNameRegion(g.teamNamesCache[newUserTids[0]], g.teamRegionsCache[newUserTids[0]]);
            } else {
                league.updateMetaNameRegion("Multi Team Mode", "");
            }

            ui.realtimeUpdate(['g.userTids']);
            league.updateLastDbChange();
        }
    }

    render() {
        const {teams, userTids} = this.props;

        bbgmViewReact.title('Multi Team Mode');

        let statusText;
        if (userTids.length === 1) {
            statusText = <span><b className="text-danger">Multi team mode disabled!</b> To enable it, select all the teams you want to control below.</span>;
        } else if (userTids.length > 1) {
            statusText = <span><b className="text-success">Multi team mode enabled!</b> To disable it, unselect all but one team.</span>;
        } else {
            statusText = <span><b className="text-danger">Error!</b> Select at least one team!</span>;
        }

        return <div>
            <h1>Multi Team Mode <NewWindowLink /></h1>

            <p>Here you can switch from controlling one team to controlling multiple teams. Why would you want to do this? A few reasons I can think of:</p>

            <ul>
                <li>Live in-person multiplayer - two people sharing one computer can play in the same league together</li>
                <li>Extreme control - if you want to control how other teams behave, for some reason</li>
                <li>Online multiplayer - if you want to run a league where you are the commissioner and other people email you roster moves to make manually, you don't want AI fucking things up</li>
            </ul>

            <p>For more details, <a href="https://basketball-gm.com/blog/2015/03/new-feature-multi-team-mode/">read this blog post</a>. But basically, <a href="https://www.youtube.com/watch?v=4kly-bxCBZg">multi til the motherfucking sun die</a>.</p>

            <p>{statusText} (Use ctrl or shift to select multiple teams.)</p>

            <div className="row">
                <div className="col-sm-6">
                    <select
                        className="form-control"
                        multiple="true"
                        onChange={this.handleChange}
                        size={teams.length}
                        value={userTids.map(String)}
                    >
                        {teams.map(t => <option key={t.tid} value={t.tid}>{t.name}</option>)}
                    </select>
                </div>
            </div>
        </div>;
    }
}

MultiTeamMode.propTypes = {
    teams: React.PropTypes.arrayOf(React.PropTypes.shape({
        name: React.PropTypes.string.isRequired,
        tid: React.PropTypes.number.isRequired,
    })).isRequired,
    userTids: React.PropTypes.arrayOf(React.PropTypes.number).isRequired,
};

module.exports = MultiTeamMode;
