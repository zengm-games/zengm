const React = require('react');
const g = require('../../globals');
const ui = require('../../ui');
const league = require('../../core/league');
const bbgmViewReact = require('../../util/bbgmViewReact');
const helpers = require('../../util/helpers');
const {NewWindowLink} = require('../components');

class NewTeam extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            tid: props.teams && props.teams.length > 0 ? props.teams[0].tid : undefined,
        };
        this.handleTidChange = this.handleTidChange.bind(this);
        this.handleNewTeam = this.handleNewTeam.bind(this);
    }

    componentWillReceiveProps(nextProps) {
        if (this.state.tid === undefined && nextProps.teams && nextProps.teams.length > 0) {
            this.setState({
                tid: nextProps.teams[0].tid,
            });
        }
    }

    handleTidChange(event) {
        this.setState({
            tid: parseInt(event.target.value, 10),
        });
    }

    async handleNewTeam() {
        ui.updateStatus("Idle");
        ui.updatePlayMenu(null);

        await league.setGameAttributesComplete({
            gameOver: false,
            userTid: this.state.tid,
            userTids: [this.state.tid],
            ownerMood: {
                wins: 0,
                playoffs: 0,
                money: 0,
            },
            gracePeriodEnd: g.season + 3, // +3 is the same as +2 when staring a new league, since this happens at the end of a season
        });

        league.updateLastDbChange();
        league.updateMetaNameRegion(g.teamNamesCache[g.userTid], g.teamRegionsCache[g.userTid]);
        ui.realtimeUpdate([], helpers.leagueUrl([]));
    }

    render() {
        const {gameOver, godMode, teams} = this.props;

        bbgmViewReact.title('New Team');

        if (!gameOver && !godMode) {
            return <div>
                <h1>Error</h1>
                <p>You may only switch to another team after you're fired or when you're in <a href={helpers.leagueUrl(["god_mode"])}>God Mode</a></p>
            </div>;
        }

        let message;
        if (godMode) {
            message = <p>Because you're in <a href={helpers.leagueUrl(['god_mode'])}>God Mode</a>, you can become the GM of any team.</p>;
        } else {
            message = <p>After you were fired, your agent tried to get you job offers from other teams. Unfortunately, he was only able to secure offers from some of the worst teams in the league. Are you interested in running any of these teams?</p>;
        }

        return <div>
            <h1>Pick a New Team <NewWindowLink /></h1>

            {message}

            <div className="form-group">
                <select className="form-control select-team" onChange={this.handleTidChange} value={this.state.tid}>
                    {teams.map(t => {
                        return <option key={t.tid} value={t.tid}>{t.region} {t.name}</option>;
                    })}
                </select>
            </div>

            <button className="btn btn-primary" disabled={this.state.tid === undefined} onClick={this.handleNewTeam}>
                {godMode ? 'Switch Team' : 'Accept New Job'}
            </button>
        </div>;
    }
}

NewTeam.propTypes = {
    gameOver: React.PropTypes.bool.isRequired,
    godMode: React.PropTypes.bool.isRequired,
    teams: React.PropTypes.arrayOf(React.PropTypes.shape({
        name: React.PropTypes.string.isRequired,
        region: React.PropTypes.string.isRequired,
        tid: React.PropTypes.number.isRequired,
    })).isRequired,
};

module.exports = NewTeam;
