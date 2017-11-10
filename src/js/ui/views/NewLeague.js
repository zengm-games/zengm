import PropTypes from "prop-types";
import React from "react";
import { helpers } from "../../common";
import { realtimeUpdate, setTitle, toWorker } from "../util";

const PopText = ({ teams, tid }) => {
    let msg = (
        <span>
            Region population: ?<br />Difficulty: ?
        </span>
    );
    if (tid >= 0) {
        const t = teams.find(t2 => t2.tid === tid);
        if (t) {
            let difficulty;
            if (t.popRank <= 3) {
                difficulty = "very easy";
            } else if (t.popRank <= 8) {
                difficulty = "easy";
            } else if (t.popRank <= 16) {
                difficulty = "normal";
            } else if (t.popRank <= 24) {
                difficulty = "hard";
            } else {
                difficulty = "very hard";
            }

            msg = (
                <span>
                    Region population: {t.pop} million, #{t.popRank} leaguewide<br />Difficulty:{" "}
                    {difficulty}
                </span>
            );
        }
    }

    return <span className="help-block">{msg}</span>;
};

PopText.propTypes = {
    teams: PropTypes.arrayOf(
        PropTypes.shape({
            // pop and popRank not required for Random Team
            pop: PropTypes.number,
            popRank: PropTypes.number,
            tid: PropTypes.number.isRequired,
        }),
    ).isRequired,
    tid: PropTypes.number.isRequired,
};

const defaultTeams = helpers.getTeamsDefault();
defaultTeams.unshift({
    tid: -1,
    region: "Random",
    name: "Team",
});

class NewLeague extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            creating: false,
            customize: "random",
            invalidLeagueFile: false,
            leagueFile: null,
            name: props.name,
            parsing: false,
            randomizeRosters: false,
            teams: defaultTeams,
            tid: props.lastSelectedTid,
        };

        this.handleChanges = {
            name: this.handleChange.bind(this, "name"),
            randomizeRosters: this.handleChange.bind(this, "randomizeRosters"),
            tid: this.handleChange.bind(this, "tid"),
        };
        this.handleCustomizeChange = this.handleCustomizeChange.bind(this);
        this.handleFile = this.handleFile.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChange(name, e) {
        let val = e.target.value;
        if (name === "tid") {
            val = parseInt(e.target.value, 10);
        } else if (name === "randomizeRosters") {
            val = e.target.checked;
        }
        this.setState({
            [name]: val,
        });
    }

    handleCustomizeChange(e) {
        const updatedState = {
            customize: e.target.value,
            invalidLeagueFile: false,
        };
        if (updatedState.customize === "random") {
            updatedState.teams = defaultTeams;
        }

        this.setState(updatedState);
    }

    handleFile(e) {
        this.setState({
            invalidLeagueFile: false,
            leagueFile: null,
            parsing: true,
        });
        const file = e.target.files[0];

        if (!file) {
            return;
        }

        const reader = new window.FileReader();
        reader.readAsText(file);
        reader.onload = event => {
            let leagueFile;
            try {
                leagueFile = JSON.parse(event.target.result);
            } catch (err) {
                console.log(err);
                this.setState({
                    invalidLeagueFile: true,
                    parsing: false,
                });
                return;
            }

            const updatedState = {
                invalidLeagueFile: false,
                leagueFile,
                parsing: false,
            };

            let newTeams = helpers.deepCopy(leagueFile.teams);
            if (newTeams) {
                for (const t of newTeams) {
                    // Is pop hidden in season, like in editTeamInfo import?
                    if (
                        !t.hasOwnProperty("pop") &&
                        t.hasOwnProperty("seasons")
                    ) {
                        t.pop = t.seasons[t.seasons.length - 1].pop;
                    }

                    // God, I hate being permissive...
                    if (typeof t.pop !== "number") {
                        t.pop = parseFloat(t.pop);
                    }
                    if (Number.isNaN(t.pop)) {
                        t.pop = 1;
                    }

                    t.pop = parseFloat(t.pop.toFixed(2));
                }

                newTeams = helpers.addPopRank(newTeams);

                // Add random team
                newTeams.unshift({
                    tid: -1,
                    region: "Random",
                    name: "Team",
                });

                updatedState.teams = newTeams;
            }

            // Is a userTid specified?
            if (leagueFile.hasOwnProperty("gameAttributes")) {
                leagueFile.gameAttributes.some(attribute => {
                    if (attribute.key === "userTid") {
                        // Set it to select the userTid entry
                        updatedState.tid = attribute.value;
                    }
                });
            }

            this.setState(updatedState);
        };
    }

    async handleSubmit(e) {
        e.preventDefault();
        this.setState({ creating: true });

        let startingSeason = 2017;

        let leagueFile;
        let randomizeRosters = false;
        if (this.state.customize === "custom-rosters") {
            leagueFile = this.state.leagueFile;
            randomizeRosters = this.state.randomizeRosters;
            startingSeason =
                leagueFile.startingSeason !== undefined
                    ? leagueFile.startingSeason
                    : startingSeason;
        }

        const lid = await toWorker(
            "createLeague",
            this.state.name,
            this.state.tid,
            leagueFile,
            startingSeason,
            randomizeRosters,
        );
        realtimeUpdate([], `/l/${lid}`);
    }

    render() {
        const {
            creating,
            customize,
            invalidLeagueFile,
            leagueFile,
            name,
            parsing,
            randomizeRosters,
            teams,
            tid,
        } = this.state;

        setTitle("Create New League");

        return (
            <div>
                <h1>Create New League</h1>

                <form onSubmit={this.handleSubmit}>
                    <div className="row">
                        <div className="form-group col-md-4 col-sm-5">
                            <label>League name</label>
                            <input
                                className="form-control"
                                type="text"
                                value={name}
                                onChange={this.handleChanges.name}
                            />
                        </div>

                        <div className="clearfix visible-xs" />

                        <div className="form-group col-md-4 col-sm-5">
                            <label>Which team do you want to manage?</label>
                            <select
                                className="form-control"
                                value={tid}
                                onChange={this.handleChanges.tid}
                            >
                                {teams.map(t => {
                                    return (
                                        <option key={t.tid} value={t.tid}>
                                            {t.region} {t.name}
                                        </option>
                                    );
                                })}
                            </select>
                            <PopText tid={tid} teams={teams} />
                        </div>

                        <div className="clearfix visible-sm" />

                        <div className="col-md-4 col-sm-5">
                            <div className="form-group">
                                <label>Customize</label>
                                <select
                                    className="form-control"
                                    onChange={this.handleCustomizeChange}
                                    value={customize}
                                >
                                    <option value="random">
                                        Random Players
                                    </option>
                                    <option value="custom-rosters">
                                        Upload League File
                                    </option>
                                </select>
                                <span className="help-block">
                                    Teams in your new league can either be
                                    filled by randomly-generated players or by
                                    players from a{" "}
                                    <a href="https://basketball-gm.com/manual/customization/">
                                        custom League File
                                    </a>{" "}
                                    you upload.
                                </span>
                            </div>
                            {customize === "custom-rosters" ? (
                                <div>
                                    <div>
                                        <input
                                            type="file"
                                            onChange={this.handleFile}
                                        />
                                        {invalidLeagueFile ? (
                                            <p
                                                className="text-danger"
                                                style={{ marginTop: "1em" }}
                                            >
                                                Error: Invalid League File
                                            </p>
                                        ) : null}
                                        {parsing ? (
                                            <p
                                                className="text-info"
                                                style={{ marginTop: "1em" }}
                                            >
                                                Parsing league file...
                                            </p>
                                        ) : null}
                                    </div>
                                    <div className="checkbox">
                                        <label>
                                            <input
                                                onChange={
                                                    this.handleChanges
                                                        .randomizeRosters
                                                }
                                                type="checkbox"
                                                value={randomizeRosters}
                                            />{" "}
                                            Shuffle Rosters
                                        </label>
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        <div className="clearfix visible-xs" />

                        <div className="col-md-12 col-sm-5 text-center">
                            <div className="visible-sm invisible-xs">
                                <br />
                                <br />
                            </div>
                            <button
                                type="submit"
                                className="btn btn-lg btn-primary"
                                disabled={
                                    creating ||
                                    parsing ||
                                    (customize === "custom-rosters" &&
                                        (invalidLeagueFile ||
                                            leagueFile === null))
                                }
                            >
                                Create New League
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        );
    }
}

NewLeague.propTypes = {
    name: PropTypes.string.isRequired,
    lastSelectedTid: PropTypes.number.isRequired,
};

export default NewLeague;
