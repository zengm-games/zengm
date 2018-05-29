import classNames from "classnames";
import PropTypes from "prop-types";
import React from "react";
import { PHASE, helpers } from "../../common";
import { getCols, realtimeUpdate, setTitle, toWorker } from "../util";
import { DataTable, NewWindowLink, PlayerNameLabels } from "../components";

const genRows = (players, handleChangeAsset) => {
    return players.map(p => {
        return {
            key: p.pid,
            data: [
                <input
                    type="checkbox"
                    value={p.pid}
                    title={p.untradableMsg}
                    checked={p.selected}
                    disabled={p.untradable}
                    onChange={() => handleChangeAsset(p.pid)}
                />,
                <PlayerNameLabels
                    injury={p.injury}
                    pid={p.pid}
                    skills={p.ratings.skills}
                    watch={p.watch}
                >
                    {p.name}
                </PlayerNameLabels>,
                p.ratings.pos,
                p.age,
                p.ratings.ovr,
                p.ratings.pot,
                <span>
                    {helpers.formatCurrency(p.contract.amount, "M")} thru{" "}
                    {p.contract.exp}
                </span>,
                p.stats.min.toFixed(1),
                p.stats.pts.toFixed(1),
                p.stats.trb.toFixed(1),
                p.stats.ast.toFixed(1),
                p.stats.per.toFixed(1),
            ],
        };
    });
};

class Trade extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            accepted: false,
            asking: false,
            forceTrade: false,
            message: null,
        };
        this.handleChangeTeam = this.handleChangeTeam.bind(this);
        this.handleClickAsk = this.handleClickAsk.bind(this);
        this.handleClickClear = this.handleClickClear.bind(this);
        this.handleClickForceTrade = this.handleClickForceTrade.bind(this);
        this.handleClickPropose = this.handleClickPropose.bind(this);
    }

    async handleChangeAsset(type, id) {
        this.setState({
            message: null,
        });

        const ids = {
            "user-pids": this.props.userPids,
            "user-dpids": this.props.userDpids,
            "other-pids": this.props.otherPids,
            "other-dpids": this.props.otherDpids,
        };

        if (ids[type].includes(id)) {
            ids[type] = ids[type].filter(currId => currId !== id);
        } else {
            ids[type].push(id);
        }

        const teams = [
            {
                tid: this.props.userTid,
                pids: ids["user-pids"],
                dpids: ids["user-dpids"],
            },
            {
                tid: this.props.otherTid,
                pids: ids["other-pids"],
                dpids: ids["other-dpids"],
            },
        ];

        await toWorker("updateTrade", teams);

        realtimeUpdate();
    }

    async handleChangeTeam(event) {
        this.setState({
            message: null,
        });

        const otherTid = parseInt(event.currentTarget.value, 10);

        const teams = [
            {
                tid: this.props.userTid,
                pids: this.props.userPids,
                dpids: this.props.userDpids,
            },
            {
                tid: otherTid,
                pids: [],
                dpids: [],
            },
        ];

        await toWorker("createTrade", teams);

        realtimeUpdate();
    }

    async handleClickAsk() {
        this.setState({
            asking: true,
            message: null,
        });

        const message = await toWorker("tradeCounterOffer");

        this.setState({
            asking: false,
            message,
        });

        realtimeUpdate();
    }

    async handleClickClear() {
        this.setState({
            message: null,
        });
        await toWorker("clearTrade");

        realtimeUpdate();
    }

    handleClickForceTrade() {
        this.setState({
            forceTrade: !this.state.forceTrade,
        });
    }

    async handleClickPropose() {
        const [accepted, message] = await toWorker(
            "proposeTrade",
            this.state.forceTrade,
        );

        this.setState({
            accepted,
            message,
        });

        realtimeUpdate();
    }

    render() {
        const {
            gameOver,
            godMode,
            lost,
            otherDpids,
            otherPicks,
            otherRoster,
            otherTid,
            phase,
            salaryCap,
            summary,
            showResigningMsg,
            strategy,
            teams,
            userDpids,
            userPicks,
            userRoster,
            userTeamName,
            won,
        } = this.props;

        setTitle("Trade");

        if (
            (phase >= PHASE.AFTER_TRADE_DEADLINE && phase <= PHASE.PLAYOFFS) ||
            phase === PHASE.FANTASY_DRAFT ||
            gameOver
        ) {
            return (
                <div>
                    <h1>Error</h1>
                    <p>You're not allowed to make trades now.</p>
                </div>
            );
        }

        const cols = getCols(
            "",
            "Name",
            "Pos",
            "Age",
            "Ovr",
            "Pot",
            "Contract",
            "Min",
            "Pts",
            "Reb",
            "Ast",
            "PER",
        );
        cols[0].sortSequence = [];
        const otherRows = genRows(otherRoster, pid =>
            this.handleChangeAsset("other-pids", pid),
        );
        const userRows = genRows(userRoster, pid =>
            this.handleChangeAsset("user-pids", pid),
        );

        return (
            <div>
                <h1>
                    Trade <NewWindowLink />
                </h1>

                {showResigningMsg ? (
                    <p>
                        You can't trade players whose contracts expired this
                        season, but their old contracts still count against team
                        salary caps until they are either re-signed or become
                        free agents.
                    </p>
                ) : null}

                <p>
                    If a player has been signed within the past 15 games, he is
                    not allowed to be traded.
                </p>

                <div className="row">
                    <div className="col-md-9">
                        <form id="rosters" className="form-inline">
                            <select
                                className="form-control select-team"
                                style={{ marginBottom: "6px" }}
                                value={otherTid}
                                onChange={this.handleChangeTeam}
                            >
                                {teams.map(t => (
                                    <option key={t.tid} value={t.tid}>
                                        {t.region} {t.name}
                                    </option>
                                ))}
                            </select>
                            <p>
                                {won}-{lost}, {strategy}
                            </p>
                            <DataTable
                                cols={cols}
                                defaultSort={[5, "desc"]}
                                name="Trade:Other"
                                rows={otherRows}
                            />
                            <div className="table-responsive">
                                <table className="table table-striped table-bordered table-condensed">
                                    <thead>
                                        <tr>
                                            <th />
                                            <th width="100%">Draft Picks</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {otherPicks.map(pick => (
                                            <tr key={pick.dpid}>
                                                <td>
                                                    <input
                                                        name="other-dpids"
                                                        type="checkbox"
                                                        value={pick.dpid}
                                                        checked={otherDpids.includes(
                                                            pick.dpid,
                                                        )}
                                                        onChange={() =>
                                                            this.handleChangeAsset(
                                                                "other-dpids",
                                                                pick.dpid,
                                                            )
                                                        }
                                                    />
                                                </td>
                                                <td>{pick.desc}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <h2>{userTeamName}</h2>
                            <DataTable
                                cols={cols}
                                defaultSort={[5, "desc"]}
                                name="Trade:User"
                                rows={userRows}
                            />
                            <div className="table-responsive">
                                <table className="table table-striped table-bordered table-condensed">
                                    <thead>
                                        <tr>
                                            <th />
                                            <th width="100%">Draft Picks</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {userPicks.map(pick => (
                                            <tr key={pick.dpid}>
                                                <td>
                                                    <input
                                                        name="user-dpids"
                                                        type="checkbox"
                                                        value={pick.dpid}
                                                        checked={userDpids.includes(
                                                            pick.dpid,
                                                        )}
                                                        onChange={() =>
                                                            this.handleChangeAsset(
                                                                "user-dpids",
                                                                pick.dpid,
                                                            )
                                                        }
                                                    />
                                                </td>
                                                <td>{pick.desc}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </form>
                    </div>
                    <div className="col-md-3 trade-summary">
                        <h3>Trade Summary</h3>
                        <div className="row">
                            {summary.teams.map((t, i) => (
                                <div key={i} className="col-md-12 col-xs-6">
                                    <h4>{t.name}</h4>
                                    <h5>Trade Away:</h5>
                                    <ul className="list-unstyled">
                                        {t.trade.map(p => (
                                            <li key={`p${p.pid}`}>
                                                <a
                                                    href={helpers.leagueUrl([
                                                        "player",
                                                        p.pid,
                                                    ])}
                                                >
                                                    {p.name}
                                                </a>{" "}
                                                ({helpers.formatCurrency(
                                                    p.contract.amount,
                                                    "M",
                                                )})
                                            </li>
                                        ))}
                                        {t.picks.map(pick => (
                                            <li key={pick.dpid}>{pick.desc}</li>
                                        ))}
                                        <li>
                                            {helpers.formatCurrency(
                                                t.total,
                                                "M",
                                            )}{" "}
                                            Total
                                        </li>
                                    </ul>
                                    <h5>Receive:</h5>
                                    <ul className="list-unstyled">
                                        {summary.teams[t.other].trade.map(p => (
                                            <li key={`p${p.pid}`}>
                                                <a
                                                    href={helpers.leagueUrl([
                                                        "player",
                                                        p.pid,
                                                    ])}
                                                >
                                                    {p.name}
                                                </a>{" "}
                                                ({helpers.formatCurrency(
                                                    p.contract.amount,
                                                    "M",
                                                )})
                                            </li>
                                        ))}
                                        {summary.teams[t.other].picks.map(
                                            pick => (
                                                <li key={pick.dpid}>
                                                    {pick.desc}
                                                </li>
                                            ),
                                        )}
                                        <li>
                                            {helpers.formatCurrency(
                                                summary.teams[t.other].total,
                                                "M",
                                            )}{" "}
                                            Total
                                        </li>
                                    </ul>
                                    <h5>
                                        Payroll after trade:{" "}
                                        {helpers.formatCurrency(
                                            t.payrollAfterTrade,
                                            "M",
                                        )}
                                    </h5>
                                    <h5>
                                        Salary cap:{" "}
                                        {helpers.formatCurrency(salaryCap, "M")}
                                    </h5>
                                </div>
                            ))}
                        </div>

                        <br />

                        {summary.warning ? (
                            <p className="alert alert-danger">
                                <strong>Warning!</strong> {summary.warning}
                            </p>
                        ) : null}
                        {this.state.message ? (
                            <p
                                className={classNames(
                                    "alert",
                                    this.state.accepted
                                        ? "alert-success"
                                        : "alert-info",
                                )}
                            >
                                {this.state.message}
                            </p>
                        ) : null}

                        <center>
                            {godMode ? (
                                <label className="god-mode god-mode-text">
                                    <input
                                        type="checkbox"
                                        onClick={this.handleClickForceTrade}
                                        value={this.state.forceTrade}
                                    />Force Trade
                                </label>
                            ) : null}
                            <br />
                            <button
                                type="submit"
                                className="btn btn-large btn-primary"
                                disabled={
                                    !summary.enablePropose &&
                                    !this.state.forceTrade
                                }
                                onClick={this.handleClickPropose}
                                style={{ margin: "5px 5px 5px 0" }}
                            >
                                Propose Trade
                            </button>
                            <button
                                type="submit"
                                className="btn"
                                disabled={this.state.asking}
                                onClick={this.handleClickAsk}
                                style={{ margin: "5px 5px 5px 0" }}
                            >
                                {this.state.asking
                                    ? "Waiting for answer..."
                                    : "What would make this deal work?"}
                            </button>
                            <button
                                type="submit"
                                className="btn"
                                onClick={this.handleClickClear}
                                style={{ margin: "5px 5px 5px 0" }}
                            >
                                Clear Trade
                            </button>
                        </center>
                    </div>
                </div>
            </div>
        );
    }
}

Trade.propTypes = {
    gameOver: PropTypes.bool.isRequired,
    godMode: PropTypes.bool.isRequired,
    lost: PropTypes.number.isRequired,
    otherDpids: PropTypes.arrayOf(PropTypes.number).isRequired,
    otherPicks: PropTypes.array.isRequired,
    otherPids: PropTypes.arrayOf(PropTypes.number).isRequired,
    otherRoster: PropTypes.array.isRequired,
    otherTid: PropTypes.number.isRequired,
    phase: PropTypes.number.isRequired,
    salaryCap: PropTypes.number.isRequired,
    summary: PropTypes.object.isRequired,
    showResigningMsg: PropTypes.bool.isRequired,
    strategy: PropTypes.string.isRequired,
    teams: PropTypes.arrayOf(
        PropTypes.shape({
            name: PropTypes.string.isRequired,
            region: PropTypes.string.isRequired,
            tid: PropTypes.number.isRequired,
        }),
    ).isRequired,
    userDpids: PropTypes.arrayOf(PropTypes.number).isRequired,
    userPicks: PropTypes.array.isRequired,
    userPids: PropTypes.arrayOf(PropTypes.number).isRequired,
    userRoster: PropTypes.array.isRequired,
    userTid: PropTypes.number.isRequired,
    userTeamName: PropTypes.string.isRequired,
    won: PropTypes.number.isRequired,
};

export default Trade;
