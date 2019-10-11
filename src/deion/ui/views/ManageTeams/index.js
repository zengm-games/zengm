import PropTypes from "prop-types";
import React, { useReducer } from "react";
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

            if (action.field.startsWith("colors")) {
                newTeams[action.i].colors[action.field.replace("colors", "")] =
                    action.value;
            } else {
                newTeams[action.i][action.field] = action.value;
            }
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

    const { saving, teams } = state;

    console.log("render", props.godMode);
    return (
        <>
            <h1>Manage Teams</h1>

            {!props.godMode ? (
                <div className="alert alert-warning">
                    Some features here are disabled because you are not using{" "}
                    <a href={helpers.leagueUrl(["god_mode"])}>God Mode</a>.
                </div>
            ) : null}

            <h2>Add/Remove Teams</h2>

            {props.godMode ? (
                <AddRemove
                    dispatch={dispatch}
                    confs={props.confs}
                    divs={props.divs}
                    phase={props.phase}
                    saving={saving}
                />
            ) : (
                <p>
                    Enable{" "}
                    <a href={helpers.leagueUrl(["god_mode"])}>God Mode</a> to
                    add or remove teams.
                </p>
            )}

            <h2 className="mt-3">Edit Teams</h2>

            <div className="row d-none d-lg-flex font-weight-bold mb-2">
                <div className="col-lg-2">
                    <br />
                    Region
                </div>
                <div className="col-lg-2">
                    <br />
                    Name
                </div>
                <div className="col-lg-1">
                    <br />
                    Abbrev
                </div>
                <div className="col-lg-1">
                    Population
                    <br />
                    (millions)
                </div>
                <div className="col-lg-1">
                    Stadium
                    <br />
                    Capacity
                </div>
                <div className="col-lg-2">
                    <br />
                    Logo URL
                </div>
                <div className="col-lg-3">
                    <br />
                    Colors
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="row">
                    {teams.map((t, i) => (
                        <React.Fragment key={t.tid}>
                            <div className="col-6 col-lg-2">
                                <div className="form-group">
                                    <label className="d-lg-none">Region</label>
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
                            <div className="col-6 col-lg-2">
                                <div className="form-group">
                                    <label className="d-lg-none">Name</label>
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
                            <div className="col-6 col-lg-1">
                                <div className="form-group">
                                    <label className="d-lg-none">Abbrev</label>
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
                            <div className="col-6 col-lg-1">
                                <div className="form-group">
                                    <label className="d-lg-none">
                                        Population (millions)
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        disabled={!props.godMode}
                                        onChange={e =>
                                            handleInputChange(i, "pop", e)
                                        }
                                        value={t.pop}
                                    />
                                </div>
                            </div>
                            <div className="col-6 col-lg-1">
                                <div className="form-group">
                                    <label className="d-lg-none">
                                        Stadium Capacity
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        disabled={!props.godMode}
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
                            <div className="col-6 col-lg-2">
                                <div className="form-group">
                                    <label className="d-lg-none">
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
                            <div className="col-6 col-lg-3">
                                <div className="form-group">
                                    <label className="d-lg-none">Colors</label>
                                    <div className="d-flex">
                                        {[0, 1, 2].map(j => (
                                            <input
                                                key={j}
                                                type="color"
                                                className="form-control"
                                                onChange={e =>
                                                    handleInputChange(
                                                        i,
                                                        `colors${j}`,
                                                        e,
                                                    )
                                                }
                                                value={t.colors[j]}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div
                                className="col-12 d-lg-none"
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
