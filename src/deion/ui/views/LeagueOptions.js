import PropTypes from "prop-types";
import React from "react";
import { DIFFICULTY } from "../../common";
import { HelpPopover } from "../components";
import { helpers, logEvent, setTitle, toWorker } from "../util";
import Options from "./Options";

const difficultyValues = Object.values(DIFFICULTY);

class LeagueOptions extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            dirty: false,
            autoDeleteOldBoxScores: String(props.autoDeleteOldBoxScores),
            difficulty: String(props.difficulty),
            difficultySelect: difficultyValues.includes(props.difficulty)
                ? String(props.difficulty)
                : "custom",
            stopOnInjury: String(props.stopOnInjury),
            stopOnInjuryGames: String(props.stopOnInjuryGames),
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
                autoDeleteOldBoxScores: String(
                    nextProps.autoDeleteOldBoxScores,
                ),
                difficulty: String(nextProps.difficulty),
                difficultySelect:
                    difficultyValues.includes(nextProps.difficulty) &&
                    prevState.difficultySelect !== "custom"
                        ? String(nextProps.difficulty)
                        : "custom",
                stopOnInjury: String(nextProps.stopOnInjury),
                stopOnInjuryGames: String(nextProps.stopOnInjuryGames),
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

        const attrs = {
            autoDeleteOldBoxScores:
                this.state.autoDeleteOldBoxScores === "true",
            difficulty: parseFloat(this.state.difficulty),
            stopOnInjury: this.state.stopOnInjury === "true",
            stopOnInjuryGames: parseInt(this.state.stopOnInjuryGames, 10),
        };

        if (attrs.difficulty <= DIFFICULTY.Easy) {
            attrs.easyDifficultyInPast = true;
        }

        await toWorker("updateGameAttributes", attrs);

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
        setTitle("League Options");

        const disableDifficultyInput =
            this.state.difficultySelect !== "custom" &&
            difficultyValues.includes(parseFloat(this.state.difficulty));

        return (
            <>
                <Options title="Global Options" />

                <h1 className="mt-5">League Options</h1>

                <form onSubmit={this.handleFormSubmit}>
                    <div className="row">
                        <div className="col-sm-3 col-6 form-group">
                            <label>
                                Auto Delete Old Box Scores{" "}
                                <HelpPopover title="Auto Delete Old Box Scores">
                                    This will automatically delete box scores
                                    older than the past three seasons because
                                    box scores use a lot of disk space. See{" "}
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
                        <div className="col-sm-3 col-6 form-group">
                            <label>
                                Stop On Injury Longer Than{" "}
                                <HelpPopover title="Stop On Injury Longer Than">
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
                            <div className="input-group mt-2">
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
                                <div className="input-group-append">
                                    <div className="input-group-text">
                                        Games
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-sm-3 col-6 form-group">
                            <label>
                                Difficulty{" "}
                                <HelpPopover
                                    placement="bottom"
                                    title="Difficulty"
                                >
                                    <p>
                                        Increasing difficulty makes AI teams
                                        more reluctant to trade with you, makes
                                        players less likely to sign with you,
                                        and makes it harder to turn a profit.
                                    </p>
                                    <p>
                                        If you set the difficulty to Easy, you
                                        will not get credit for any{" "}
                                        <a href="/account">Achievements</a>.
                                        This persists even if you switch to a
                                        harder difficulty.
                                    </p>
                                </HelpPopover>
                            </label>
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
                            <div className="input-group mt-2">
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

                    <button className="btn btn-primary">
                        Save League Options
                    </button>
                </form>
            </>
        );
    }
}

LeagueOptions.propTypes = {
    autoDeleteOldBoxScores: PropTypes.bool.isRequired,
    difficulty: PropTypes.number.isRequired,
    stopOnInjury: PropTypes.bool.isRequired,
    stopOnInjuryGames: PropTypes.number.isRequired,
};

export default LeagueOptions;
