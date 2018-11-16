import PropTypes from "prop-types";
import React from "react";
import { PHASE } from "../../common";
import {
    DataTable,
    NewWindowLink,
    PlayerNameLabels,
    RosterSalarySummary,
} from "../components";
import { getCols, helpers, setTitle, toWorker } from "../../../deion/ui/util";

const cols = getCols(
    "Name",
    "Pos",
    "Age",
    "Ovr",
    "Pot",
    "Min",
    "Pts",
    "Reb",
    "Ast",
    "PER",
    "Asking For",
    "Mood",
    "Negotiate",
);

class FreeAgents extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            addFilters: undefined,
        };

        this.showAfforablePlayers = this.showAfforablePlayers.bind(this);
    }

    showAfforablePlayers() {
        const addFilters = new Array(cols.length);
        if (this.props.capSpace * 1000 > this.props.minContract) {
            addFilters[10] = `<${this.props.capSpace}`;
        } else {
            addFilters[10] = `<${this.props.minContract / 1000}`;
        }

        this.setState(
            {
                addFilters,
            },
            () => {
                // This is a hack to make the addFilters passed to DataTable only happen once, otherwise it will keep getting
                // applied every refresh (like when playing games) even if the user had disabled or edited the filter. Really, it'd
                // be better if sent as some kind of signal or event rather than as a prop, because it is transient.
                this.setState({
                    addFilters: undefined,
                });
            },
        );
    }

    render() {
        const {
            capSpace,
            gamesInProgress,
            hardCap,
            minContract,
            numRosterSpots,
            phase,
            players,
            userTid,
        } = this.props;
        setTitle("Free Agents");

        if (
            phase >= PHASE.AFTER_TRADE_DEADLINE &&
            phase <= PHASE.RESIGN_PLAYERS
        ) {
            return (
                <div>
                    <h1>
                        Free Agents <NewWindowLink />
                    </h1>
                    <p>
                        More:{" "}
                        <a href={helpers.leagueUrl(["upcoming_free_agents"])}>
                            Upcoming Free Agents
                        </a>
                    </p>
                    <p>You're not allowed to sign free agents now.</p>
                    <p>
                        Free agents can only be signed before the playoffs or
                        after players are re-signed.
                    </p>
                </div>
            );
        }

        const rows = players.map(p => {
            let negotiateButton;
            if (
                helpers.refuseToNegotiate(
                    p.contract.amount * 1000,
                    p.freeAgentMood[userTid],
                )
            ) {
                negotiateButton = "Refuses!";
            } else {
                negotiateButton = (
                    <button
                        className="btn btn-light-bordered btn-xs"
                        disabled={gamesInProgress}
                        onClick={() => toWorker("actions.negotiate", p.pid)}
                    >
                        Negotiate
                    </button>
                );
            }
            return {
                key: p.pid,
                data: [
                    <PlayerNameLabels
                        pid={p.pid}
                        injury={p.injury}
                        skills={p.ratings.skills}
                        watch={p.watch}
                    >
                        {p.name}
                    </PlayerNameLabels>,
                    p.ratings.pos,
                    p.age,
                    p.ratings.ovr,
                    p.ratings.pot,
                    p.stats.min.toFixed(1),
                    p.stats.pts.toFixed(1),
                    p.stats.trb.toFixed(1),
                    p.stats.ast.toFixed(1),
                    p.stats.per.toFixed(1),
                    <span>
                        {helpers.formatCurrency(p.contract.amount, "M")} thru{" "}
                        {p.contract.exp}
                    </span>,
                    <div
                        title={p.mood.text}
                        style={{
                            width: "100%",
                            height: "21px",
                            backgroundColor: p.mood.color,
                        }}
                    >
                        <span style={{ display: "none" }}>
                            {p.freeAgentMood[userTid]}
                        </span>
                    </div>,
                    negotiateButton,
                ],
            };
        });

        return (
            <>
                <h1>
                    Free Agents <NewWindowLink />
                </h1>
                <p>
                    More:{" "}
                    <a href={helpers.leagueUrl(["upcoming_free_agents"])}>
                        Upcoming Free Agents
                    </a>
                </p>

                <RosterSalarySummary
                    capSpace={capSpace}
                    hardCap={hardCap}
                    minContract={minContract}
                    numRosterSpots={numRosterSpots}
                />

                <p>
                    <button
                        className="btn btn-light-bordered"
                        onClick={this.showAfforablePlayers}
                    >
                        Show players you can afford now
                    </button>
                </p>

                {gamesInProgress ? (
                    <p className="text-danger">
                        Stop game simulation to sign free agents.
                    </p>
                ) : null}

                <DataTable
                    cols={cols}
                    defaultSort={[10, "desc"]}
                    name="FreeAgents"
                    pagination
                    rows={rows}
                    addFilters={this.state.addFilters}
                />
            </>
        );
    }
}

FreeAgents.propTypes = {
    capSpace: PropTypes.number.isRequired,
    gamesInProgress: PropTypes.bool.isRequired,
    hardCap: PropTypes.bool.isRequired,
    minContract: PropTypes.number.isRequired,
    numRosterSpots: PropTypes.number.isRequired,
    phase: PropTypes.number.isRequired,
    players: PropTypes.arrayOf(PropTypes.object).isRequired,
    userTid: PropTypes.number.isRequired,
};

export default FreeAgents;
