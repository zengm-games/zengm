import PropTypes from "prop-types";
import React from "react";
import { PHASE } from "../../../common";
import { NewWindowLink } from "../../components";
import { realtimeUpdate, setTitle, toWorker } from "../../util";
import AssetList from "./AssetList";
import Summary from "./Summary";

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
        this.setState(prevState => ({ forceTrade: !prevState.forceTrade }));
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

        return (
            <>
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
                        <select
                            className="float-left form-control select-team mb-2 mr-2"
                            value={otherTid}
                            onChange={this.handleChangeTeam}
                        >
                            {teams.map(t => (
                                <option key={t.tid} value={t.tid}>
                                    {t.region} {t.name}
                                </option>
                            ))}
                        </select>
                        <div style={{ paddingTop: 7 }}>
                            {won}-{lost}, {strategy}
                        </div>
                        <div className="clearfix" />
                        <AssetList
                            dpidsSelected={otherDpids}
                            handlePickToggle={dpid => () =>
                                this.handleChangeAsset("other-dpids", dpid)}
                            handlePlayerToggle={pid => () =>
                                this.handleChangeAsset("other-pids", pid)}
                            name="Trade:Other"
                            picks={otherPicks}
                            roster={otherRoster}
                        />

                        <h2 className="mt-3">{userTeamName}</h2>
                        <AssetList
                            dpidsSelected={userDpids}
                            handlePickToggle={dpid => () =>
                                this.handleChangeAsset("user-dpids", dpid)}
                            handlePlayerToggle={pid => () =>
                                this.handleChangeAsset("user-pids", pid)}
                            name="Trade:User"
                            picks={userPicks}
                            roster={userRoster}
                        />
                    </div>
                    <div className="col-md-3 trade-summary">
                        <Summary
                            accepted={this.state.accepted}
                            message={this.state.message}
                            salaryCap={salaryCap}
                            summary={summary}
                        />

                        <center>
                            {godMode ? (
                                <label className="god-mode god-mode-text">
                                    <input
                                        type="checkbox"
                                        onClick={this.handleClickForceTrade}
                                        value={this.state.forceTrade}
                                    />
                                    Force Trade
                                </label>
                            ) : null}
                            <button
                                type="submit"
                                className="btn btn-primary mt-2"
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
                                className="btn btn-secondary mt-1"
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
                                className="btn btn-secondary mt-1"
                                onClick={this.handleClickClear}
                                style={{ margin: "5px 5px 5px 0" }}
                            >
                                Clear Trade
                            </button>
                        </center>
                    </div>
                </div>
            </>
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
