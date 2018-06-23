import PropTypes from "prop-types";
import React from "react";
import { DIFFICULTY } from "../../common";
import { HelpPopover, NewWindowLink } from "../components";
import { helpers, logEvent, setTitle, toWorker } from "../util";

const difficultyValues = Object.values(DIFFICULTY);

class GodMode extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            dirty: false,
            autoDeleteOldBoxScores: props.autoDeleteOldBoxScores,
            difficulty: props.difficulty,
            difficultySelect: difficultyValues.includes(props.difficulty)
                ? props.difficulty
                : "custom",
            stopOnInjury: props.stopOnInjury,
            stopOnInjuryGames: props.stopOnInjuryGames,
        };
        this.handleChanges = {
            autoDeleteOldBoxScores: this.handleChange.bind(
                this,
                "autoDeleteOldBoxScores",
            ),
            difficulty: this.handleChange.bind(this, "difficulty"),
            difficultySelect: e => {
                this.handleChange("difficultySelect", e);
                if (e.target.value !== "custom") {
                    this.handleChange("difficulty", e);
                }
            },
            stopOnInjury: this.handleChange.bind(this, "stopOnInjury"),
            stopOnInjuryGames: this.handleChange.bind(
                this,
                "stopOnInjuryGames",
            ),
        };
        this.handleFormSubmit = this.handleFormSubmit.bind(this);
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        if (!prevState.dirty) {
            return {
                autoDeleteOldBoxScores: nextProps.autoDeleteOldBoxScores,
                difficulty: nextProps.difficulty,
                difficultySelect:
                    difficultyValues.includes(nextProps.difficulty) &&
                    prevState.difficultySelect !== "custom"
                        ? nextProps.difficulty
                        : "custom",
                stopOnInjury: nextProps.stopOnInjury,
                stopOnInjuryGames: nextProps.stopOnInjuryGames,
            };
        }

        return null;
    }

    handleChange(name, e) {
        this.setState({
            dirty: true,
            [name]: e.target.value,
        });
    }

    async handleFormSubmit(e) {
        e.preventDefault();

        await toWorker("updateGameAttributes", {
            autoDeleteOldBoxScores:
                this.state.autoDeleteOldBoxScores === "true",
            difficulty: parseFloat(this.state.difficulty),
            stopOnInjury: this.state.stopOnInjury === "true",
            stopOnInjuryGames: parseInt(this.state.stopOnInjuryGames, 10),
        });

        this.setState({
            dirty: false,
        });

        logEvent({
            type: "success",
            text: "Options successfully updated.",
            saveToDb: false,
        });
    }

    render() {
        setTitle("Options");

        const disableDifficultyInput =
            this.state.difficultySelect !== "custom" &&
            difficultyValues.includes(parseFloat(this.state.difficulty));

        return (
            <div>
                <h1>
                    Options <NewWindowLink />
                </h1>

                <form onSubmit={this.handleFormSubmit}>
                    <div className="row">
                        <div className="col-sm-3 col-xs-6 form-group">
                            <label>
                                Auto Delete Old Box Scores{" "}
                                <HelpPopover
                                    placement="right"
                                    title="Auto Delete Old Box Scores"
                                >
                                    This will automatically delete box scores
                                    from previous seasons because box scores use
                                    a lot of disk space. See{" "}
                                    <a
                                        href={helpers.leagueUrl([
                                            "delete_old_data",
                                        ])}
                                    >
                                        Delete Old Data
                                    </a>{" "}
                                    for more.
                                </HelpPopover>
                            </label>
                            <select
                                className="form-control"
                                onChange={
                                    this.handleChanges.autoDeleteOldBoxScores
                                }
                                value={this.state.autoDeleteOldBoxScores}
                            >
                                <option value="true">Enabled</option>
                                <option value="false">Disabled</option>
                            </select>
                        </div>
                        <div className="col-sm-3 col-xs-6 form-group">
                            <label>
                                Stop On Injury Longer Than{" "}
                                <HelpPopover
                                    placement="right"
                                    title="Stop On Injury Longer Than"
                                >
                                    This will stop game simulation if one of
                                    your players is injured for more than N
                                    games. In auto play mode (Tools > Auto Play
                                    Seasons), this has no effect.
                                </HelpPopover>
                            </label>
                            <select
                                className="form-control"
                                onChange={this.handleChanges.stopOnInjury}
                                value={this.state.stopOnInjury}
                            >
                                <option value="true">Enabled</option>
                                <option value="false">Disabled</option>
                            </select>
                            <div
                                className="input-group"
                                style={{ marginTop: "0.5em" }}
                            >
                                <input
                                    type="text"
                                    className="form-control"
                                    disabled={
                                        this.state.stopOnInjury === false ||
                                        this.state.stopOnInjury === "false"
                                    }
                                    onChange={
                                        this.handleChanges.stopOnInjuryGames
                                    }
                                    value={this.state.stopOnInjuryGames}
                                />
                                <span className="input-group-addon">Games</span>
                            </div>
                        </div>
                        <div className="col-sm-3 col-xs-6 form-group">
                            <label>Difficulty</label>
                            <select
                                className="form-control"
                                onChange={this.handleChanges.difficultySelect}
                                value={this.state.difficultySelect}
                            >
                                {Object.entries(DIFFICULTY).map(
                                    ([text, numeric]) => (
                                        <option key={numeric} value={numeric}>
                                            {text}
                                        </option>
                                    ),
                                )}
                                <option value="custom">Custom</option>
                            </select>
                            <div
                                className="input-group"
                                style={{ marginTop: "0.5em" }}
                            >
                                <input
                                    type="text"
                                    className="form-control"
                                    disabled={disableDifficultyInput}
                                    onChange={this.handleChanges.difficulty}
                                    value={this.state.difficulty}
                                />
                            </div>
                        </div>
                    </div>

                    <button className="btn btn-primary">Save Options</button>
                </form>
            </div>
        );
    }
}

GodMode.propTypes = {
    autoDeleteOldBoxScores: PropTypes.bool.isRequired,
    difficulty: PropTypes.number.isRequired,
    stopOnInjury: PropTypes.bool.isRequired,
    stopOnInjuryGames: PropTypes.number.isRequired,
};

export default GodMode;
