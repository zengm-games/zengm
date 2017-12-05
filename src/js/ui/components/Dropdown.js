// @flow

import PropTypes from "prop-types";
import * as React from "react";
import { PHASE, g, helpers } from "../../common";
import { realtimeUpdate } from "../util";

const Select = ({ field, handleChange, value }) => {
    let options: {
        key: number | string,
        val: number | string,
    }[];
    if (field === "teams") {
        options = [];
        for (let j = 0; j < g.numTeams; j++) {
            options[j] = {
                key: g.teamAbbrevsCache[j],
                val: `${g.teamRegionsCache[j]} ${g.teamNamesCache[j]}`,
            };
        }
    } else if (field === "teamsAndAll") {
        options = [
            {
                key: "all",
                val: "All Teams",
            },
        ];
        for (let j = 0; j < g.numTeams; j++) {
            options[j + 1] = {
                key: g.teamAbbrevsCache[j],
                val: `${g.teamRegionsCache[j]} ${g.teamNamesCache[j]}`,
            };
        }
    } else if (field === "teamsAndAllWatch") {
        options = [
            {
                key: "all",
                val: "All Teams",
            },
            {
                key: "watch",
                val: "Watch List",
            },
        ];
        for (let j = 0; j < g.numTeams; j++) {
            options[j + 2] = {
                key: g.teamAbbrevsCache[j],
                val: `${g.teamRegionsCache[j]} ${g.teamNamesCache[j]}`,
            };
        }
    } else if (
        field === "seasons" ||
        field === "seasonsAndCareer" ||
        field === "seasonsAndAll"
    ) {
        options = [];
        for (let season = g.startingSeason; season <= g.season; season++) {
            options.push({
                key: season,
                val: `${season} Season`,
            });
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
        const offset = g.phase <= PHASE.RESIGN_PLAYERS ? 0 : 1;
        for (let j = 0 + offset; j < 5 + offset; j++) {
            options.push({
                key: g.season + j,
                val: `${g.season + j} season`,
            });
        }
    } else if (field === "playoffs") {
        options = [
            {
                val: "Regular Season",
                key: "regularSeason",
            },
            {
                val: "Playoffs",
                key: "playoffs",
            },
        ];
    } else if (field === "shows") {
        options = [
            {
                val: "Past 10 Seasons",
                key: "10",
            },
            {
                val: "All Seasons",
                key: "all",
            },
        ];
    } else if (field === "statTypes") {
        options = [
            {
                val: "Per Game",
                key: "perGame",
            },
            {
                val: "Per 36 Mins",
                key: "per36",
            },
            {
                val: "Totals",
                key: "totals",
            },
        ];
    } else if (field === "statTypesAdv") {
        options = [
            {
                val: "Per Game",
                key: "perGame",
            },
            {
                val: "Per 36 Mins",
                key: "per36",
            },
            {
                val: "Totals",
                key: "totals",
            },
            {
                val: "Advanced",
                key: "advanced",
            },
        ];
    } else if (field === "awardType") {
        options = [
            {
                val: "Won Championship",
                key: "champion",
            },
            {
                val: "Most Valuable Player",
                key: "mvp",
            },
            {
                val: "Finals MVP",
                key: "finals_mvp",
            },
            {
                val: "Defensive Player of the Year",
                key: "dpoy",
            },
            {
                val: "Sixth Man of the Year",
                key: "smoy",
            },
            {
                val: "Most Improved Player",
                key: "mip",
            },
            {
                val: "Rookie of the Year",
                key: "roy",
            },
            {
                val: "First Team All-League",
                key: "first_team",
            },
            {
                val: "Second Team All-League",
                key: "second_team",
            },
            {
                val: "Third Team All-League",
                key: "third_team",
            },
            {
                val: "All-League",
                key: "all_league",
            },
            {
                val: "First Team All-Defensive",
                key: "first_def",
            },
            {
                val: "Second Team All-Defensive",
                key: "second_def",
            },
            {
                val: "Third Team All-Defensive",
                key: "third_def",
            },
            {
                val: "All-Defensive",
                key: "all_def",
            },
            {
                val: "League Scoring Leader",
                key: "ppg_leader",
            },
            {
                val: "League Rebounding Leader",
                key: "rpg_leader",
            },
            {
                val: "League Assists Leader",
                key: "apg_leader",
            },
            {
                val: "League Steals Leader",
                key: "spg_leader",
            },
            {
                val: "League Blocks Leader",
                key: "bpg_leader",
            },
        ];
    } else if (field === "eventType") {
        options = [
            {
                val: "All Types",
                key: "all",
            },
            {
                val: "Draft",
                key: "draft",
            },
            {
                val: "FA Signed",
                key: "freeAgent",
            },
            {
                val: "Resigned",
                key: "reSigned",
            },
            {
                val: "Released",
                key: "release",
            },
            {
                val: "Trades",
                key: "trade",
            },
        ];
    } else if (field === "teamOpponent") {
        options = [
            {
                val: "Team",
                key: "team",
            },
            {
                val: "Opponent",
                key: "opponent",
            },
            {
                val: "Advanced",
                key: "advanced",
            },
        ];
    } else if (field === "teamRecordType") {
        options = [
            {
                val: "By Team",
                key: "team",
            },
            {
                val: "By Conference",
                key: "conf",
            },
            {
                val: "By Division",
                key: "div",
            },
        ];
    } else {
        throw new Error(`Unknown Dropdown field: ${field}`);
    }

    return (
        <select value={value} className="form-control" onChange={handleChange}>
            {options.map(opt => (
                <option key={opt.key} value={opt.key}>
                    {opt.val}
                </option>
            ))}
        </select>
    );
};

Select.propTypes = {
    field: PropTypes.string.isRequired,
    handleChange: PropTypes.func.isRequired,
    value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
};

type Props = {
    extraParam?: number | string,
    fields: string[],
    values: (number | string)[],
    view: string,
};

class Dropdown extends React.Component<
    Props,
    {
        values: (number | string)[],
    },
> {
    constructor(props: Props) {
        super(props);

        // Keep in state so it can update instantly on click, rather than waiting for round trip
        this.state = {
            values: props.values,
        };
    }

    componentWillReceiveProps(nextProps: Props) {
        if (nextProps.values !== this.state.values) {
            this.setState({
                values: nextProps.values,
            });
        }
    }

    handleChange(i: number, event: SyntheticInputEvent<>) {
        const values = this.props.values.slice();
        values[i] = event.target.value;
        this.setState({
            values,
        });

        const parts = [this.props.view].concat(values);
        if (this.props.extraParam !== undefined) {
            parts.push(this.props.extraParam);
        }

        realtimeUpdate([], helpers.leagueUrl(parts));
    }

    render() {
        return (
            <form className="form-inline pull-right">
                {this.props.fields.map((field, i) => {
                    return (
                        <div
                            key={field}
                            className="form-group"
                            style={{ marginLeft: "4px", marginBottom: "4px" }}
                        >
                            <Select
                                field={field}
                                value={this.state.values[i]}
                                handleChange={event =>
                                    this.handleChange(i, event)
                                }
                            />
                        </div>
                    );
                })}
            </form>
        );
    }
}

Dropdown.propTypes = {
    extraParam: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    fields: PropTypes.arrayOf(PropTypes.string).isRequired,
    values: PropTypes.array.isRequired,
    view: PropTypes.string.isRequired,
};

export default Dropdown;
