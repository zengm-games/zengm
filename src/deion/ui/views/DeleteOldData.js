import React from "react";
import { NewWindowLink } from "../components";
import { helpers, logEvent, setTitle, toWorker } from "../util";

class DeleteOldData extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            deleting: false,
            boxScores: true,
            teamStats: true,
            teamHistory: true,
            retiredPlayersUnnotable: true,
            retiredPlayers: true,
            playerStatsUnnotable: true,
            playerStats: true,
        };
        this.handleChanges = {
            boxScores: this.handleChange.bind(this, "boxScores"),
            playerStats: this.handleChange.bind(this, "playerStats"),
            playerStatsUnnotable: this.handleChange.bind(
                this,
                "playerStatsUnnotable",
            ),
            retiredPlayers: this.handleChange.bind(this, "retiredPlayers"),
            retiredPlayersUnnotable: this.handleChange.bind(
                this,
                "retiredPlayersUnnotable",
            ),
            teamHistory: this.handleChange.bind(this, "teamHistory"),
            teamStats: this.handleChange.bind(this, "teamStats"),
        };
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChange(name, e) {
        this.setState({
            [name]: e.target.checked,
        });
    }

    async handleSubmit(e) {
        e.preventDefault();
        this.setState({
            deleting: true,
        });

        await toWorker("deleteOldData", this.state);

        logEvent({
            type: "success",
            text: "Data successfully deleted.",
            saveToDb: false,
        });
        this.setState({
            deleting: false,
        });
    }

    render() {
        setTitle("Delete Old Data");

        return (
            <>
                <h1>
                    Delete Old Data <NewWindowLink />
                </h1>

                <p>
                    As you play multiple seasons in a league, the database can
                    grow quite large. This used to slow down performance, but
                    doesn't much anymore. However it does still use up hard
                    drive space, which you can reclaim here by deleting old data
                    from this league.
                </p>

                <form onSubmit={this.handleSubmit}>
                    <div className="form-check">
                        <label className="form-check-label">
                            <input
                                className="form-check-input"
                                onChange={this.handleChanges.boxScores}
                                type="checkbox"
                                checked={this.state.boxScores}
                            />
                            Delete Old Box Scores{" "}
                            <a href={helpers.leagueUrl(["options"])}>
                                (done automatically by default)
                            </a>
                        </label>
                    </div>
                    <div className="form-check">
                        <label className="form-check-label">
                            <input
                                className="form-check-input"
                                onChange={this.handleChanges.teamStats}
                                type="checkbox"
                                checked={this.state.teamStats}
                            />
                            Delete Old Team Stats
                        </label>
                    </div>
                    <div className="form-check">
                        <label className="form-check-label">
                            <input
                                className="form-check-input"
                                onChange={this.handleChanges.teamHistory}
                                type="checkbox"
                                checked={this.state.teamHistory}
                            />
                            Delete Old Team History (stuff like W/L, finances,
                            etc)
                        </label>
                    </div>
                    <div className="form-check">
                        <label className="form-check-label">
                            <input
                                className="form-check-input"
                                onChange={
                                    this.handleChanges.retiredPlayersUnnotable
                                }
                                type="checkbox"
                                checked={this.state.retiredPlayersUnnotable}
                            />
                            Delete Unnotable Retired Players
                            <br />
                            <i>
                                Won't delete your past players or players who
                                have won awards
                            </i>
                        </label>
                    </div>
                    <div className="form-check">
                        <label className="form-check-label">
                            <input
                                className="form-check-input"
                                onChange={this.handleChanges.retiredPlayers}
                                type="checkbox"
                                checked={this.state.retiredPlayers}
                            />
                            Delete <b>All</b> Retired Players
                        </label>
                    </div>
                    <div className="form-check">
                        <label className="form-check-label">
                            <input
                                className="form-check-input"
                                onChange={
                                    this.handleChanges.playerStatsUnnotable
                                }
                                type="checkbox"
                                checked={this.state.playerStatsUnnotable}
                            />
                            Delete Unnotable Player Stats and Ratings
                            <br />
                            <i>
                                Won't delete your past players or players who
                                have won awards
                            </i>
                        </label>
                    </div>
                    <div className="form-check">
                        <label className="form-check-label">
                            <input
                                className="form-check-input"
                                onChange={this.handleChanges.playerStats}
                                type="checkbox"
                                checked={this.state.playerStats}
                            />
                            Delete <b>All</b> Player Stats and Ratings
                        </label>
                    </div>

                    <p className="alert alert-danger mt-3">
                        <b>Warning!</b> Once you delete old data, it's
                        completely gone! There's no going back! This can impact
                        your players making the Hall of Fame and the completion
                        of in-progress achievements!
                    </p>

                    <button
                        className="btn btn-danger"
                        disabled={this.state.deleting}
                        type="submit"
                    >
                        Delete Old Data
                    </button>
                </form>
            </>
        );
    }
}

export default DeleteOldData;
