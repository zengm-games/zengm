import PropTypes from "prop-types";
import React, { useReducer } from "react";
import { LeagueFileUpload } from "../../components";
import { helpers, logEvent, setTitle, toWorker } from "../../util";
import AddRemove from "./AddRemove";

const reducer = (state, action) => {
    switch (action.type) {
        case "startSaving":
            return {
                ...state,
                saving: true,
            };
        case "doneSaving":
            return {
                ...state,
                saving: false,
            };
        case "updateTeam": {
            const newTeams = state.teams.slice();
            newTeams[action.i][action.field] = action.value;
            return {
                ...state,
                teams: newTeams,
            };
        }
        case "addTeam":
            return {
                ...state,
                teams: [...state.teams, action.team],
            };
        case "removeLastTeam":
            return {
                ...state,
                teams: state.teams.slice(0, state.teams.length - 1),
            };
        case "updateTeams":
            return {
                ...state,
                teams: action.teams,
            };
        default:
            throw new Error(`Unknown action type "${action.type}"`);
    }
};

const ManageTeams = props => {
    const [state, dispatch] = useReducer(reducer, {
        saving: false,
        teams: props.teams,
    });

    const handleInputChange = (i, field, e) => {
        const value = e.target.value;

        dispatch({ type: "updateTeam", i, field, value });
    };

    const handleSubmit = async e => {
        e.preventDefault();
        dispatch({ type: "startSaving" });

        await toWorker("updateTeamInfo", state.teams);

        logEvent({
            type: "success",
            text: "Saved team info.",
            saveToDb: false,
        });

        dispatch({ type: "doneSaving" });
    };

    setTitle("Manage Teams");

    if (!props.godMode) {
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

    const { saving, teams } = state;

    return (
        <>
            <h1>Manage Teams</h1>

            <h2>Add/Remove Teams</h2>

            <AddRemove
                dispatch={dispatch}
                confs={props.confs}
                divs={props.divs}
                phase={props.phase}
                saving={saving}
            />

            <h2>Upload Teams File</h2>

            <p>
                You can manually edit the teams below or you can upload a teams
                file to specify all of the team info at once.
            </p>

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
                Warning: selecting a valid team file will instantly apply the
                new team info to your league.
            </p>

            <LeagueFileUpload
                onDone={async (err, leagueFile) => {
                    if (err) {
                        return;
                    }

                    const newTeams = leagueFile.teams;

                    // Validate teams
                    if (newTeams.length < props.numTeams) {
                        throw new Error("Wrong number of teams");
                    }
                    for (let i = 0; i < newTeams.length; i++) {
                        if (i !== newTeams[i].tid) {
                            throw new Error(`Wrong tid, team ${i}`);
                        }
                        if (
                            newTeams[i].cid < 0 ||
                            newTeams[i].cid >= props.confs.length
                        ) {
                            throw new Error(`Invalid cid, team ${i}`);
                        }
                        if (
                            newTeams[i].did < 0 ||
                            newTeams[i].did >= props.divs.length
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
                                    newTeams[i][field] =
                                        props.defaultStadiumCapacity;
                                }
                            }
                        }
                    }

                    await toWorker("updateTeamInfo", newTeams);

                    dispatch({ type: "updateTeams", teams: newTeams });

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

            <form onSubmit={handleSubmit}>
                <div className="row">
                    {teams.map((t, i) => (
                        <React.Fragment key={t.tid}>
                            <div className="col-6 col-md-2">
                                <div className="form-group">
                                    <label className="d-md-none">Region</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        onChange={e =>
                                            handleInputChange(i, "region", e)
                                        }
                                        value={t.region}
                                    />
                                </div>
                            </div>
                            <div className="col-6 col-md-2">
                                <div className="form-group">
                                    <label className="d-md-none">Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        onChange={e =>
                                            handleInputChange(i, "name", e)
                                        }
                                        value={t.name}
                                    />
                                </div>
                            </div>
                            <div className="col-6 col-md-2 col-lg-1">
                                <div className="form-group">
                                    <label className="d-md-none">Abbrev</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        onChange={e =>
                                            handleInputChange(i, "abbrev", e)
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
                                            handleInputChange(i, "pop", e)
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
                                            handleInputChange(
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
                                            handleInputChange(i, "imgURL", e)
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
};

ManageTeams.propTypes = {
    defaultStadiumCapacity: PropTypes.number.isRequired,
    confs: PropTypes.arrayOf(PropTypes.object).isRequired,
    divs: PropTypes.arrayOf(PropTypes.object).isRequired,
    godMode: PropTypes.bool.isRequired,
    numTeams: PropTypes.number.isRequired,
    phase: PropTypes.number.isRequired,
    teams: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default ManageTeams;
