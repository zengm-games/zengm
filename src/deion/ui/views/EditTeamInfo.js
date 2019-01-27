import PropTypes from "prop-types";
import React from "react";
import { LeagueFileUpload } from "../components";
import { helpers, logEvent, setTitle, toWorker } from "../util";

class EditTeamInfo extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            saving: false,
            teams: this.props.teams,
        };
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleInputChange(i, name, e) {
        const value = e.target.value;

        this.setState(prevState => {
            prevState.teams[i][name] = value;
            return {
                teams: prevState.teams,
            };
        });
    }

    async handleSubmit(e) {
        e.preventDefault();
        this.setState({
            saving: true,
        });

        await toWorker("updateTeamInfo", this.state.teams);

        logEvent({
            type: "success",
            text: "Saved team info.",
            saveToDb: false,
        });

        this.setState({
            saving: false,
        });
    }

    render() {
        setTitle("Edit Team Info");

        if (!this.props.godMode) {
            return (
                <div>
                    <h1>Error</h1>
                    <p>
                        You can't edit teams unless you enable{" "}
                        <a href={helpers.leagueUrl(["god_mode"])}>God Mode</a>
                    </p>
                </div>
            );
        }

        const { saving, teams } = this.state;

        return (
            <>
                <h1>Edit Team Info</h1>

                <p>
                    You can manually edit the teams below or you can upload a
                    teams file to specify all of the team info at once.
                </p>

                <h2>Upload Teams File</h2>

                <p>
                    The JSON file format is described in{" "}
                    <a href="http://basketball-gm.com/manual/customization/teams/">
                        the manual
                    </a>
                    . As an example, you can download{" "}
                    <a
                        href="http://basketball-gm.com/files/old_teams.json"
                        download
                    >
                        a teams file containing the old (pre-2014) default teams
                    </a>{" "}
                    or{" "}
                    <a
                        href="http://basketball-gm.com/files/new_teams.json"
                        download
                    >
                        one containing the current default teams
                    </a>
                    .
                </p>

                <p className="text-danger">
                    Warning: selecting a valid team file will instantly apply
                    the new team info to your league.
                </p>

                <LeagueFileUpload
                    onDone={async (err, leagueFile) => {
                        if (err) {
                            return;
                        }

                        const newTeams = leagueFile.teams;

                        // Validate teams
                        if (newTeams.length < this.props.numTeams) {
                            throw new Error("Wrong number of teams");
                        }
                        for (let i = 0; i < newTeams.length; i++) {
                            if (i !== newTeams[i].tid) {
                                throw new Error(`Wrong tid, team ${i}`);
                            }
                            if (
                                newTeams[i].cid < 0 ||
                                newTeams[i].cid >= this.props.numConfs
                            ) {
                                throw new Error(`Invalid cid, team ${i}`);
                            }
                            if (
                                newTeams[i].did < 0 ||
                                newTeams[i].did >= this.props.numDivs
                            ) {
                                throw new Error(`Invalid did, team ${i}`);
                            }
                            if (typeof newTeams[i].region !== "string") {
                                throw new Error(`Invalid region, team ${i}`);
                            }
                            if (typeof newTeams[i].name !== "string") {
                                throw new Error(`Invalid name, team ${i}`);
                            }
                            if (typeof newTeams[i].abbrev !== "string") {
                                throw new Error(`Invalid abbrev, team ${i}`);
                            }

                            // Check for pop/stadiumCapacity in either the root or the most recent season
                            for (const field of ["pop", "stadiumCapacity"]) {
                                if (
                                    !newTeams[i].hasOwnProperty(field) &&
                                    newTeams[i].hasOwnProperty("seasons")
                                ) {
                                    newTeams[i][field] =
                                        newTeams[i].seasons[
                                            newTeams[i].seasons.length - 1
                                        ][field];
                                }

                                if (typeof newTeams[i][field] !== "number") {
                                    if (field === "pop") {
                                        throw new Error(
                                            `Invalid ${field}, team ${i}`,
                                        );
                                    } else if (field === "stadiumCapacity") {
                                        newTeams[i][field] = 25000;
                                    }
                                }
                            }
                        }

                        await toWorker("updateTeamInfo", newTeams);

                        this.setState({
                            teams: newTeams,
                        });

                        logEvent({
                            type: "success",
                            text: "New team info successfully loaded.",
                            saveToDb: false,
                        });
                    }}
                />
                <p />

                <h2>Manual Editing</h2>

                <div className="row d-none d-md-flex font-weight-bold mb-2">
                    <div className="col-md-2">
                        <br />
                        Region
                    </div>
                    <div className="col-md-2">
                        <br />
                        Name
                    </div>
                    <div className="col-md-2 col-lg-1">
                        <br />
                        Abbrev
                    </div>
                    <div className="col-md-2">
                        Population
                        <br />
                        (millions)
                    </div>
                    <div className="col-md-2">
                        Stadium
                        <br />
                        Capacity
                    </div>
                    <div className="col-md-2 col-lg-3">
                        <br />
                        Logo URL
                    </div>
                </div>

                <form onSubmit={this.handleSubmit}>
                    <div className="row">
                        {teams.map((t, i) => (
                            <React.Fragment key={t.tid}>
                                <div className="col-6 col-md-2">
                                    <div className="form-group">
                                        <label className="d-md-none">
                                            Region
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            onChange={e =>
                                                this.handleInputChange(
                                                    i,
                                                    "region",
                                                    e,
                                                )
                                            }
                                            value={t.region}
                                        />
                                    </div>
                                </div>
                                <div className="col-6 col-md-2">
                                    <div className="form-group">
                                        <label className="d-md-none">
                                            Name
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            onChange={e =>
                                                this.handleInputChange(
                                                    i,
                                                    "name",
                                                    e,
                                                )
                                            }
                                            value={t.name}
                                        />
                                    </div>
                                </div>
                                <div className="col-6 col-md-2 col-lg-1">
                                    <div className="form-group">
                                        <label className="d-md-none">
                                            Abbrev
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            onChange={e =>
                                                this.handleInputChange(
                                                    i,
                                                    "abbrev",
                                                    e,
                                                )
                                            }
                                            value={t.abbrev}
                                        />
                                    </div>
                                </div>
                                <div className="col-6 col-md-2">
                                    <div className="form-group">
                                        <label className="d-md-none">
                                            Population (millions)
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            onChange={e =>
                                                this.handleInputChange(
                                                    i,
                                                    "pop",
                                                    e,
                                                )
                                            }
                                            value={t.pop}
                                        />
                                    </div>
                                </div>
                                <div className="col-6 col-md-2">
                                    <div className="form-group">
                                        <label className="d-md-none">
                                            Stadium Capacity
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            onChange={e =>
                                                this.handleInputChange(
                                                    i,
                                                    "stadiumCapacity",
                                                    e,
                                                )
                                            }
                                            value={t.stadiumCapacity}
                                        />
                                    </div>
                                </div>
                                <div className="col-6 col-md-2 col-lg-3">
                                    <div className="form-group">
                                        <label className="d-md-none">
                                            Logo URL
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            onChange={e =>
                                                this.handleInputChange(
                                                    i,
                                                    "imgURL",
                                                    e,
                                                )
                                            }
                                            value={t.imgURL}
                                        />
                                    </div>
                                </div>
                                <div
                                    className="col-12 d-md-none"
                                    style={{ marginTop: -12 }}
                                >
                                    <hr />
                                </div>
                            </React.Fragment>
                        ))}
                    </div>
                    <center>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={saving}
                        >
                            Update Team Info
                        </button>
                    </center>
                </form>
            </>
        );
    }
}

EditTeamInfo.propTypes = {
    godMode: PropTypes.bool.isRequired,
    numConfs: PropTypes.number.isRequired,
    numDivs: PropTypes.number.isRequired,
    numTeams: PropTypes.number.isRequired,
    teams: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default EditTeamInfo;
