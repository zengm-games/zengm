const React = require('react');
const g = require('../../globals');
const ui = require('../../ui');
const helpers = require('../../util/helpers');

const Select = ({field, handleChange, value}) => {
    let options;
    if (field === "teams") {
        options = [];
        for (let j = 0; j < g.numTeams; j++) {
            options[j] = {};
            options[j].key = g.teamAbbrevsCache[j];
            options[j].val = `${g.teamRegionsCache[j]} ${g.teamNamesCache[j]}`;
        }
    } else if (field === "teamsAndAll") {
        options = [{
            key: "all",
            val: "All Teams",
        }];
        for (let j = 0; j < g.numTeams; j++) {
            options[j + 1] = {};
            options[j + 1].key = g.teamAbbrevsCache[j];
            options[j + 1].val = `${g.teamRegionsCache[j]} ${g.teamNamesCache[j]}`;
        }
    } else if (field === "teamsAndAllWatch") {
        options = [{
            key: "all",
            val: "All Teams",
        }, {
            key: "watch",
            val: "Watch List",
        }];
        for (let j = 0; j < g.numTeams; j++) {
            options[j + 2] = {};
            options[j + 2].key = g.teamAbbrevsCache[j];
            options[j + 2].val = `${g.teamRegionsCache[j]} ${g.teamNamesCache[j]}`;
        }
    } else if (field === "seasons" || field === "seasonsAndCareer" || field === "seasonsAndAll") {
        options = helpers.getSeasons();
        for (let j = 0; j < options.length; j++) {
            options[j].key = options[j].season;
            options[j].val = `${options[j].season} Season`;
        }
        if (field === "seasonsAndCareer") {
            options.unshift({
                key: "career",
                val: "Career Totals",
            });
        }
        if (field === "seasonsAndAll") {
            options.unshift({
                key: "all",
                val: "All Seasons",
            });
        }
    } else if (field === "seasonsUpcoming") {
        options = [];
        // For upcomingFreeAgents, bump up 1 if we're past the season
        const offset = g.phase <= g.PHASE.RESIGN_PLAYERS ? 0 : 1;
        for (let j = 0 + offset; j < 5 + offset; j++) {
            options.push({
                key: g.season + j,
                val: `${g.season + j} season`,
            });
        }
    } else if (field === "playoffs") {
        options = [{
            val: "Regular Season",
            key: "regular_season",
        }, {
            val: "Playoffs",
            key: "playoffs",
        }];
    } else if (field === "shows") {
        options = [{
            val: "Past 10 Seasons",
            key: "10",
        }, {
            val: "All Seasons",
            key: "all",
        }];
    } else if (field === "statTypes") {
        options = [{
            val: "Per Game",
            key: "per_game",
        }, {
            val: "Per 36 Mins",
            key: "per_36",
        }, {
            val: "Totals",
            key: "totals",
        }];
    } else if (field === "awardType") {
        options = [{
            val: "Won Championship",
            key: "champion",
        }, {
            val: "Most Valuable Player",
            key: "mvp",
        }, {
            val: "Finals MVP",
            key: "finals_mvp",
        }, {
            val: "Defensive Player of the Year",
            key: "dpoy",
        }, {
            val: "Sixth Man of the Year",
            key: "smoy",
        }, {
            val: "Rookie of the Year",
            key: "roy",
        }, {
            val: "First Team All-League",
            key: "first_team",
        }, {
            val: "Second Team All-League",
            key: "second_team",
        }, {
            val: "Third Team All-League",
            key: "third_team",
        }, {
            val: "All-League",
            key: "all_league",
        }, {
            val: "First Team All-Defensive",
            key: "first_def",
        }, {
            val: "Second Team All-Defensive",
            key: "second_def",
        }, {
            val: "Third Team All-Defensive",
            key: "third_def",
        }, {
            val: "All-Defensive",
            key: "all_def",
        }, {
            val: "League Scoring Leader",
            key: "ppg_leader",
        }, {
            val: "League Rebounding Leader",
            key: "rpg_leader",
        }, {
            val: "League Assists Leader",
            key: "apg_leader",
        }, {
            val: "League Steals Leader",
            key: "spg_leader",
        }, {
            val: "League Blocks Leader",
            key: "bpg_leader",
        }];
    } else if (field === "eventType") {
        options = [{
            val: "All Types",
            key: "all",
        }, {
            val: "Draft",
            key: "draft",
        }, {
            val: "FA Signed",
            key: "freeAgent",
        }, {
            val: "Resigned",
            key: "reSigned",
        }, {
            val: "Released",
            key: "release",
        }, {
            val: "Trades",
            key: "trade",
        }];
    } else if (field === "teamRecordType") {
        options = [{
            val: "By Team",
            key: "team",
        }, {
            val: "By Conference",
            key: "conf",
        }, {
            val: "By Division",
            key: "div",
        }];
    }

    return <select value={value} className="form-control" onChange={handleChange}>
        {options.map(opt => <option key={opt.key} value={opt.key}>{opt.val}</option>)}
    </select>;
};

class Dropdown extends React.Component {
    handleChange(i, event) {
        const values = this.props.values.slice();
        values[i] = event.target.value;

        const parts = [this.props.view].concat(values);
        if (this.props.extraParam !== undefined) {
            parts.push(this.props.extraParam);
        }

        ui.realtimeUpdate([], helpers.leagueUrl(parts));
    }

    render() {
        return <form className="form-inline pull-right bbgm-dropdown">
            {this.props.fields.map((field, i) => {
                return <div key={field} className="form-group" style={{marginLeft: '4px', marginBottom: '4px'}}>
                    <Select
                        field={field}
                        value={this.props.values[i]}
                        handleChange={event => this.handleChange(i, event)}
                    />
                </div>;
            })}
        </form>;
    }
}
Dropdown.propTypes = {
    extraParam: React.PropTypes.oneOfType([
        React.PropTypes.number,
        React.PropTypes.string,
    ]),
    fields: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
    values: React.PropTypes.array.isRequired,
    view: React.PropTypes.string.isRequired,
};

module.exports = Dropdown;