import PropTypes from "prop-types";
import React from "react";
import { helpers } from "../../common";
import { NewWindowLink } from "../components";
import { realtimeUpdate, setTitle, toWorker } from "../util";

class NewTeam extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            tid:
                props.teams && props.teams.length > 0
                    ? props.teams[0].tid
                    : undefined,
        };
        this.handleTidChange = this.handleTidChange.bind(this);
        this.handleNewTeam = this.handleNewTeam.bind(this);
    }

    componentWillReceiveProps(nextProps) {
        if (
            this.state.tid === undefined &&
            nextProps.teams &&
            nextProps.teams.length > 0
        ) {
            this.setState({
                tid: nextProps.teams[0].tid,
            });
        }
    }

    handleTidChange(event) {
        this.setState({
            tid: parseInt(event.currentTarget.value, 10),
        });
    }

    async handleNewTeam() {
        await toWorker("switchTeam", this.state.tid);
        realtimeUpdate([], helpers.leagueUrl([]));
    }

    render() {
        const { gameOver, godMode, teams } = this.props;

        setTitle("New Team");

        if (!gameOver && !godMode) {
            return (
                <div>
                    <h1>Error</h1>
                    <p>
                        You may only switch to another team after you're fired
                        or when you're in{" "}
                        <a href={helpers.leagueUrl(["god_mode"])}>God Mode</a>
                    </p>
                </div>
            );
        }

        let message;
        if (godMode) {
            message = (
                <p>
                    Because you're in{" "}
                    <a href={helpers.leagueUrl(["god_mode"])}>God Mode</a>, you
                    can become the GM of any team.
                </p>
            );
        } else {
            message = (
                <p>
                    After you were fired, your agent tried to get you job offers
                    from other teams. Unfortunately, he was only able to secure
                    offers from some of the worst teams in the league. Are you
                    interested in running any of these teams?
                </p>
            );
        }

        return (
            <div>
                <h1>
                    Pick a New Team <NewWindowLink />
                </h1>

                {message}

                <div className="form-group">
                    <select
                        className="form-control select-team"
                        onChange={this.handleTidChange}
                        value={this.state.tid}
                    >
                        {teams.map(t => {
                            return (
                                <option key={t.tid} value={t.tid}>
                                    {t.region} {t.name}
                                </option>
                            );
                        })}
                    </select>
                </div>

                <button
                    className="btn btn-primary"
                    disabled={this.state.tid === undefined}
                    onClick={this.handleNewTeam}
                >
                    {godMode ? "Switch Team" : "Accept New Job"}
                </button>
            </div>
        );
    }
}

NewTeam.propTypes = {
    gameOver: PropTypes.bool.isRequired,
    godMode: PropTypes.bool.isRequired,
    teams: PropTypes.arrayOf(
        PropTypes.shape({
            name: PropTypes.string.isRequired,
            region: PropTypes.string.isRequired,
            tid: PropTypes.number.isRequired,
        }),
    ).isRequired,
};

export default NewTeam;
