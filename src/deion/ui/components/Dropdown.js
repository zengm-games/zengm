// @flow

import orderBy from "lodash/orderBy";
import PropTypes from "prop-types";
import React from "react";
import { PHASE } from "../../common";
import { helpers, overrides, subscribeLocal, realtimeUpdate } from "../util";

const sortedTeams = local => {
    return orderBy(
        local.state.teamAbbrevsCache.map((abbrev, i) => {
            return {
                key: abbrev,
                val: `${local.state.teamRegionsCache[i]} ${local.state.teamNamesCache[i]}`,
            };
        }),
        "val",
    );
};

const Select = ({ field, handleChange, value }) => {
    return subscribeLocal(local => {
        let options: {
            key: number | string,
            val: number | string,
        }[];
        if (field === "teams") {
            options = sortedTeams(local);
        } else if (field === "teamsAndAll") {
            options = [
                {
                    key: "all",
                    val: "All Teams",
                },
                ...sortedTeams(local),
            ];
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
                ...sortedTeams(local),
            ];
        } else if (
            field === "seasons" ||
            field === "seasonsAndCareer" ||
            field === "seasonsAndAll" ||
            field === "seasonsAndOldDrafts" ||
            field === "seasonsHistory"
        ) {
            options = [];
            for (
                let season = local.state.startingSeason;
                season <= local.state.season;
                season++
            ) {
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
            if (field === "seasonsAndOldDrafts") {
                const NUM_PAST_SEASONS = 20; // Keep synced with league/create.js
                for (
                    let season = local.state.startingSeason - 1;
                    season >= local.state.startingSeason - NUM_PAST_SEASONS;
                    season--
                ) {
                    options.unshift({
                        key: season,
                        val: `${season} Season`,
                    });
                }

                // Remove current season, if draft hasn't happened yet
                if (local.state.phase < PHASE.DRAFT) {
                    options.pop();
                }
            }
            if (field === "seasonsHistory") {
                // Remove current season until playoffs end
                if (local.state.phase <= PHASE.PLAYOFFS) {
                    options.pop();
                }
            }
        } else if (field === "seasonsUpcoming") {
            options = [];
            // For upcomingFreeAgents, bump up 1 if we're past the season
            const offset = local.state.phase <= PHASE.RESIGN_PLAYERS ? 0 : 1;
            for (let j = 0 + offset; j < 5 + offset; j++) {
                options.push({
                    key: local.state.season + j,
                    val: `${local.state.season + j} season`,
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
        } else if (field === "statTypes" || field === "statTypesAdv") {
            if (process.env.SPORT === "basketball") {
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

                if (field === "statTypesAdv") {
                    options.push({
                        val: "Advanced",
                        key: "advanced",
                    });
                }
            } else {
                options = [
                    {
                        val: "Passing",
                        key: "passing",
                    },
                    {
                        val: "Rushing/Receiving",
                        key: "rushing",
                    },
                    {
                        val: "Defense",
                        key: "defense",
                    },
                    {
                        val: "Kicking",
                        key: "kicking",
                    },
                    {
                        val: "Returns",
                        key: "returns",
                    },
                ];
            }
        } else if (field === "awardType") {
            options =
                process.env.SPORT === "basketball"
                    ? [
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
                      ]
                    : [
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
                              val: "Offensive Rookie of the Year",
                              key: "oroy",
                          },
                          {
                              val: "Defensive Rookie of the Year",
                              key: "droy",
                          },
                          {
                              val: "All-League",
                              key: "all_league",
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
                    val: "Re-signed",
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
            ];
        } else if (field === "teamOpponentAdvanced") {
            options = Object.keys(
                overrides.common.constants.TEAM_STATS_TABLES,
            ).map(key => {
                return {
                    val: helpers.upperCaseFirstLetter(key),
                    key,
                };
            });
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
            <select
                value={value}
                className="form-control"
                onChange={handleChange}
            >
                {options.map(opt => (
                    <option key={opt.key} value={opt.key}>
                        {opt.val}
                    </option>
                ))}
            </select>
        );
    });
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

type State = {
    values: (number | string)[],
};

class Dropdown extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        // Keep in state so it can update instantly on click, rather than waiting for round trip
        this.state = {
            values: props.values,
        };
    }

    // Keep state synced with authoritative value from props
    static getDerivedStateFromProps(nextProps: Props, prevState: State) {
        if (
            JSON.stringify(nextProps.values) !==
            JSON.stringify(prevState.values)
        ) {
            return {
                values: nextProps.values,
            };
        }

        return null;
    }

    handleChange(i: number, event: SyntheticInputEvent<HTMLSelectElement>) {
        const values = this.props.values.slice();
        values[i] = event.currentTarget.value;
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
            <form className="form-inline float-right my-1">
                {this.props.fields.map((field, i) => {
                    return (
                        <div key={field} className="form-group ml-1">
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
