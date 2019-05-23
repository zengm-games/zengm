import PropTypes from "prop-types";
import React from "react";
import { PHASE } from "../../../common";
import { NewWindowLink } from "../../components";
import { setTitle, toWorker } from "../../util";
import AssetList from "./AssetList";
import Buttons from "./Buttons";
import Summary from "./Summary";

class Trade extends React.Component {
    handleChangeAsset: Function;

    handleChangeTeam: Function;

    handleClickAsk: Function;

    handleClickClear: Function;

    handleClickForceTrade: Function;

    handleClickPropose: Function;

    constructor(props) {
        super(props);
        this.state = {
            accepted: false,
            asking: false,
            forceTrade: false,
            message: null,
        };
        this.handleChangeAsset = this.handleChangeAsset.bind(this);
        this.handleChangeTeam = this.handleChangeTeam.bind(this);
        this.handleClickAsk = this.handleClickAsk.bind(this);
        this.handleClickClear = this.handleClickClear.bind(this);
        this.handleClickForceTrade = this.handleClickForceTrade.bind(this);
        this.handleClickPropose = this.handleClickPropose.bind(this);
    }

    async handleChangeAsset(
        userOrOther: "other" | "user",
        playerOrPick: "pick" | "player",
        includeOrExclude: "include" | "exclude",
        id,
    ) {
        this.setState({
            message: null,
        });

        const ids = {
            "user-pids": this.props.userPids,
            "user-pids-excluded": this.props.userPidsExcluded,
            "user-dpids": this.props.userDpids,
            "user-dpids-excluded": this.props.userDpidsExcluded,
            "other-pids": this.props.otherPids,
            "other-pids-excluded": this.props.otherPidsExcluded,
            "other-dpids": this.props.otherDpids,
            "other-dpids-excluded": this.props.otherDpidsExcluded,
        };

        const idType = playerOrPick === "player" ? "pids" : "dpids";
        const excluded = includeOrExclude === "exclude" ? "-excluded" : "";
        const key = `${userOrOther}-${idType}${excluded}`;

        if (ids[key].includes(id)) {
            ids[key] = ids[key].filter(currId => currId !== id);
        } else {
            ids[key].push(id);
        }

        const teams = [
            {
                tid: this.props.userTid,
                pids: ids["user-pids"],
                pidsExcluded: ids["user-pids-excluded"],
                dpids: ids["user-dpids"],
                dpidsExcluded: ids["user-dpids-excluded"],
            },
            {
                tid: this.props.otherTid,
                pids: ids["other-pids"],
                pidsExcluded: ids["other-pids-excluded"],
                dpids: ids["other-dpids"],
                dpidsExcluded: ids["other-dpids-excluded"],
            },
        ];

        await toWorker("updateTrade", teams);
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
                pidsExcluded: this.props.userPidsExcluded,
                dpids: this.props.userDpids,
                dpidsExcluded: this.props.userDpidsExcluded,
            },
            {
                tid: otherTid,
                pids: [],
                pidsExcluded: [],
                dpids: [],
                dpidsExcluded: [],
            },
        ];

        await toWorker("createTrade", teams);
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
    }

    async handleClickClear() {
        this.setState({
            message: null,
        });
        await toWorker("clearTrade");
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
    }

    render() {
        const {
            gameOver,
            godMode,
            lost,
            otherPicks,
            otherRoster,
            otherTid,
            phase,
            salaryCap,
            summary,
            showResigningMsg,
            stats,
            strategy,
            teams,
            tied,
            ties,
            userPicks,
            userRoster,
            userTeamName,
            won,
        } = this.props;

        setTitle("Trade");

        const noTradingAllowed =
            (phase >= PHASE.AFTER_TRADE_DEADLINE && phase <= PHASE.PLAYOFFS) ||
            phase === PHASE.FANTASY_DRAFT ||
            gameOver;

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
                    If a player has been signed within the past 14 days, he is
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
                            {won}-{lost}
                            {ties ? <>-{tied}</> : null}, {strategy}
                        </div>
                        <div className="clearfix" />
                        <AssetList
                            handleToggle={this.handleChangeAsset}
                            picks={otherPicks}
                            roster={otherRoster}
                            stats={stats}
                            userOrOther="other"
                        />

                        <h2 className="mt-3">{userTeamName}</h2>
                        <AssetList
                            handleToggle={this.handleChangeAsset}
                            picks={userPicks}
                            roster={userRoster}
                            stats={stats}
                            userOrOther="user"
                        />
                    </div>
                    <div className="col-md-3 trade-summary">
                        <Summary
                            accepted={this.state.accepted}
                            message={this.state.message}
                            salaryCap={salaryCap}
                            summary={summary}
                        />
                        {!noTradingAllowed ? (
                            <center>
                                <Buttons
                                    asking={this.state.asking}
                                    enablePropose={summary.enablePropose}
                                    forceTrade={this.state.forceTrade}
                                    godMode={godMode}
                                    handleClickAsk={this.handleClickAsk}
                                    handleClickClear={this.handleClickClear}
                                    handleClickForceTrade={
                                        this.handleClickForceTrade
                                    }
                                    handleClickPropose={this.handleClickPropose}
                                />
                            </center>
                        ) : (
                            <p className="alert alert-danger">
                                You're not allowed to make trades now.
                            </p>
                        )}
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
    otherDpidsExcluded: PropTypes.arrayOf(PropTypes.number).isRequired,
    otherPicks: PropTypes.array.isRequired,
    otherPids: PropTypes.arrayOf(PropTypes.number).isRequired,
    otherPidsExcluded: PropTypes.arrayOf(PropTypes.number).isRequired,
    otherRoster: PropTypes.array.isRequired,
    otherTid: PropTypes.number.isRequired,
    phase: PropTypes.number.isRequired,
    salaryCap: PropTypes.number.isRequired,
    summary: PropTypes.object.isRequired,
    showResigningMsg: PropTypes.bool.isRequired,
    stats: PropTypes.arrayOf(PropTypes.string).isRequired,
    strategy: PropTypes.string.isRequired,
    teams: PropTypes.arrayOf(
        PropTypes.shape({
            name: PropTypes.string.isRequired,
            region: PropTypes.string.isRequired,
            tid: PropTypes.number.isRequired,
        }),
    ).isRequired,
    tied: PropTypes.number,
    ties: PropTypes.bool.isRequired,
    userDpids: PropTypes.arrayOf(PropTypes.number).isRequired,
    userDpidsExcluded: PropTypes.arrayOf(PropTypes.number).isRequired,
    userPicks: PropTypes.array.isRequired,
    userPids: PropTypes.arrayOf(PropTypes.number).isRequired,
    userPidsExcluded: PropTypes.arrayOf(PropTypes.number).isRequired,
    userRoster: PropTypes.array.isRequired,
    userTid: PropTypes.number.isRequired,
    userTeamName: PropTypes.string.isRequired,
    won: PropTypes.number.isRequired,
};

export default Trade;
