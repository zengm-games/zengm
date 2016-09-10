const React = require('react');
const g = require('../../globals');
const ui = require('../../ui');
const league = require('../../core/league');

class MultiTeamMenu extends React.Component {
    constructor(props) {
        super(props);
        this.handleChange = this.handleChange.bind(this);
    }

    shouldComponentUpdate(nextProps) {
        return this.props.userTid !== nextProps.userTid || JSON.stringify(this.props.userTids) !== JSON.stringify(nextProps.userTids);
    }

    async handleChange(e) {
        const userTid = parseInt(e.target.value, 10);

        this.setState({userTid});

        await league.setGameAttributesComplete({
            userTid,
        });
        g.emitter.emit('updateMultiTeam');

        // dbChange is kind of a hack because it was designed for multi-window update only, but it should update everything
        ui.realtimeUpdate(["dbChange"]);
        league.updateLastDbChange();
    }

    render() {
        const {userTid, userTids} = this.props;

        // Hide if not multi team or not loaded yet
        if (userTids.length <= 1) {
            return null;
        }

        return <div className="multi-team-menu">
            <label htmlFor="multi-team-select">Currently controlling:</label><br />
            <select className="form-control" id="multi-team-select" onChange={this.handleChange} value={userTid}>
                {userTids.map((tid, i) => <option key={tid} value={tid}>
                    {g.teamRegionsCache[userTids[i]]} {g.teamNamesCache[userTids[i]]}
                </option>)}
            </select>
        </div>;
    }
}

MultiTeamMenu.propTypes = {
    userTid: React.PropTypes.number.isRequired,
    userTids: React.PropTypes.arrayOf(React.PropTypes.number).isRequired,
};

module.exports = MultiTeamMenu;
