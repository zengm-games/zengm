import PropTypes from "prop-types";
import React from "react";
import { DIFFICULTY } from "../../common";
import { LeagueFileUpload } from "../components";
import { helpers, logEvent, realtimeUpdate, setTitle, toWorker } from "../util";

const PopText = ({ teams, tid }) => {
    let msg = (
        <span>
            Region population: ?<br />
            Difficulty: ?
        </span>
    );
    if (tid >= 0) {
        const t = teams.find(t2 => t2.tid === tid);
        if (t) {
            let size;
            if (t.popRank <= 3) {
                size = "very large";
            } else if (t.popRank <= 8) {
                size = "large";
            } else if (t.popRank <= 16) {
                size = "normal";
            } else if (t.popRank <= 24) {
                size = "small";
            } else {
                size = "very small";
            }

            msg = (
                <span>
                    Region population: {t.pop} million (#
                    {t.popRank})<br />
                    Size: {size}
                </span>
            );
        }
    }

    return <span className="text-muted">{msg}</span>;
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
            difficulty: DIFFICULTY.Normal,
            leagueFile: null,
            name: props.name,
            randomizeRosters: false,
            teams: defaultTeams,
            tid: props.lastSelectedTid,
        };

        this.handleChanges = {
            difficulty: this.handleChange.bind(this, "difficulty"),
            name: this.handleChange.bind(this, "name"),
            randomizeRosters: this.handleChange.bind(this, "randomizeRosters"),
            tid: this.handleChange.bind(this, "tid"),
        };
        this.handleCustomizeChange = this.handleCustomizeChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.onNewLeagueFile = this.onNewLeagueFile.bind(this);
    }

    handleChange(name, e) {
        let val = e.target.value;
        if (name === "tid") {
            val = parseInt(e.target.value, 10);
        } else if (name === "randomizeRosters") {
            val = e.target.checked;
        } else if (name === "difficulty") {
            val = parseFloat(e.target.value);
        }
        this.setState({
            [name]: val,
        });
    }

    handleCustomizeChange(e) {
        const updatedState = {
            customize: e.target.value,
        };
        if (updatedState.customize !== this.state.customize) {
            updatedState.teams = defaultTeams;
            updatedState.leagueFile = null;
        }

        this.setState(updatedState);
    }

    async handleSubmit(e) {
        e.preventDefault();
        this.setState({ creating: true });

        let startingSeason = 2019;

        let leagueFile;
        let randomizeRosters = false;
        if (
            this.state.customize === "custom-rosters" ||
            this.state.customize === "custom-url"
        ) {
            leagueFile = this.state.leagueFile;
            randomizeRosters = this.state.randomizeRosters;
            startingSeason =
                leagueFile.startingSeason !== undefined
                    ? leagueFile.startingSeason
                    : startingSeason;
        }

        const difficulty = Object.values(DIFFICULTY).includes(
            this.state.difficulty,
        )
            ? this.state.difficulty
            : DIFFICULTY.Normal;

        try {
            const lid = await toWorker(
                "createLeague",
                this.state.name,
                this.state.tid,
                leagueFile,
                startingSeason,
                randomizeRosters,
                difficulty,
            );
            realtimeUpdate([], `/l/${lid}`);
        } catch (err) {
            this.setState({ creating: false });
            console.log(err);
            logEvent({
                type: "error",
                text: err.message,
                persistent: true,
                saveToDb: false,
            });
        }
    }

    onNewLeagueFile(err, leagueFile) {
        if (err) {
            this.setState({
                leagueFile: null,
            });
            return;
        }

        const updatedState = {
            leagueFile,
        };

        let newTeams = helpers.deepCopy(leagueFile.teams);
        if (newTeams) {
            for (const t of newTeams) {
                // Is pop hidden in season, like in manageTeams import?
                if (!t.hasOwnProperty("pop") && t.hasOwnProperty("seasons")) {
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

            // Might get overwritten from gameAttributes of uploaded file, but that's ok
            if (this.state.tid >= newTeams.length) {
                updatedState.tid = -1;
            }

            // Add random team
            newTeams.unshift({
                tid: -1,
                region: "Random",
                name: "Team",
            });

            updatedState.teams = newTeams;
        }

        // Need to update team and difficulty dropdowns?
        if (leagueFile.hasOwnProperty("gameAttributes")) {
            for (const ga of leagueFile.gameAttributes) {
                if (
                    ga.key === "userTid" &&
                    typeof ga.value === "number" &&
                    !Number.isNaN(ga.value)
                ) {
                    updatedState.tid = ga.value;
                } else if (
                    ga.key === "difficulty" &&
                    typeof ga.value === "number" &&
                    !Number.isNaN(ga.value)
                ) {
                    updatedState.difficulty = ga.value;
                }
            }
        }

        this.setState(updatedState);
    }

    render() {
        const {
            creating,
            customize,
            difficulty,
            leagueFile,
            name,
            randomizeRosters,
            teams,
            tid,
        } = this.state;

        setTitle("Create New League");

        return (
            <>
                <h1>Create New League</h1>

                <form onSubmit={this.handleSubmit}>
                    <div className="row">
                        <div className="form-group col-md-3 col-sm-6">
                            <label>League name</label>
                            <input
                                className="form-control"
                                type="text"
                                value={name}
                                onChange={this.handleChanges.name}
                            />
                        </div>

                        <div className="form-group col-md-3 col-sm-6">
                            <label>Pick your team</label>
                            <select
                                className="form-control mb-1"
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

                        <div className="form-group col-md-3 col-sm-6">
                            <label>Difficulty</label>
                            <select
                                className="form-control mb-1"
                                onChange={this.handleChanges.difficulty}
                                value={difficulty}
                            >
                                {Object.entries(DIFFICULTY).map(
                                    ([text, numeric]) => (
                                        <option key={numeric} value={numeric}>
                                            {text}
                                        </option>
                                    ),
                                )}
                                {!Object.values(DIFFICULTY).includes(
                                    difficulty,
                                ) ? (
                                    <option value={difficulty}>
                                        Custom (from league file)
                                    </option>
                                ) : null}
                            </select>
                            <span className="text-muted">
                                Increasing difficulty makes AI teams more
                                reluctant to trade with you, makes players less
                                likely to sign with you, and makes it harder to
                                turn a profit.
                            </span>
                        </div>

                        <div className="col-md-3 col-sm-6">
                            <div className="form-group">
                                <label>Customize</label>
                                <select
                                    className="form-control mb-1"
                                    onChange={this.handleCustomizeChange}
                                    value={customize}
                                >
                                    <option value="random">
                                        Random Players
                                    </option>
                                    <option value="custom-rosters">
                                        Upload League File
                                    </option>
                                    <option value="custom-url">
                                        Enter League File URL
                                    </option>
                                </select>
                                <span className="text-muted">
                                    Teams in your new league can either be
                                    filled by randomly-generated players or by
                                    players from a{" "}
                                    <a
                                        href={`https://${process.env.SPORT}-gm.com/manual/customization/`}
                                    >
                                        custom League File
                                    </a>{" "}
                                    you upload.
                                </span>
                            </div>
                            {customize === "custom-rosters" ||
                            customize === "custom-url" ? (
                                <>
                                    <LeagueFileUpload
                                        onLoading={() => {
                                            this.setState({
                                                leagueFile: null,
                                            });
                                        }}
                                        onDone={this.onNewLeagueFile}
                                        enterURL={customize === "custom-url"}
                                    />
                                    <div className="form-check mt-3">
                                        <label className="form-check-label">
                                            <input
                                                className="form-check-input"
                                                onChange={
                                                    this.handleChanges
                                                        .randomizeRosters
                                                }
                                                type="checkbox"
                                                value={randomizeRosters}
                                            />
                                            Shuffle Rosters
                                        </label>
                                    </div>
                                </>
                            ) : null}
                        </div>
                    </div>

                    <div className="text-center">
                        <button
                            type="submit"
                            className="btn btn-lg btn-primary mt-3"
                            disabled={
                                creating ||
                                ((customize === "custom-rosters" ||
                                    customize === "custom-url") &&
                                    leagueFile === null)
                            }
                        >
                            Create New League
                        </button>
                    </div>
                </form>
            </>
        );
    }
}

NewLeague.propTypes = {
    name: PropTypes.string.isRequired,
    lastSelectedTid: PropTypes.number.isRequired,
};

export default NewLeague;
