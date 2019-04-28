import PropTypes from "prop-types";
import React from "react";
import { PHASE } from "../../common";
import { getCols, helpers, setTitle, toWorker } from "../util";
import { DataTable, NewWindowLink, PlayerNameLabels } from "../components";

const Offer = props => {
    const {
        abbrev,
        dpids,
        handleClickNegotiate,
        i,
        lost,
        name,
        payroll,
        picks,
        pids,
        players,
        region,
        stats,
        strategy,
        tid,
        tied,
        ties,
        warning,
        won,
    } = props;

    let offerPlayers = null;
    if (players.length > 0) {
        const cols = getCols(
            "Name",
            "Pos",
            "Age",
            "Ovr",
            "Pot",
            "Contract",
            ...stats.map(stat => `stat:${stat}`),
        );

        const rows = players.map(p => {
            return {
                key: p.pid,
                data: [
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
                    <>
                        {helpers.formatCurrency(p.contract.amount, "M")} thru{" "}
                        {p.contract.exp}
                    </>,
                    ...stats.map(stat =>
                        helpers.roundStat(p.stats[stat], stat),
                    ),
                ],
            };
        });

        offerPlayers = (
            <div className="col-md-8">
                <DataTable
                    cols={cols}
                    defaultSort={[5, "desc"]}
                    name="TradingBlockOffer"
                    rows={rows}
                />
            </div>
        );
    }

    let offerPicks = null;
    if (picks.length > 0) {
        offerPicks = (
            <div className="col-md-4">
                <table className="table table-striped table-bordered table-sm">
                    <thead>
                        <tr>
                            <th>Draft Picks</th>
                        </tr>
                    </thead>
                    <tbody>
                        {picks.map(pick => (
                            <tr key={pick.dpid}>
                                <td>{pick.desc}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    return (
        <div className="trading-block-offer">
            <h3>
                Offer {i + 1}:{" "}
                <a href={helpers.leagueUrl(["roster", abbrev])}>
                    {region} {name}
                </a>
            </h3>
            <p>
                {won}-{lost}
                {ties ? <>-{tied}</> : null}, {strategy},{" "}
                {helpers.formatCurrency(payroll / 1000, "M")} payroll
            </p>
            <p className="text-danger">{warning}</p>
            <div className="row" style={{ clear: "both" }}>
                {offerPlayers}
                {offerPicks}
                {picks.length === 0 && players.length === 0 ? (
                    <div className="col-12">Nothing.</div>
                ) : null}
            </div>

            <button
                type="submit"
                className="btn btn-light-bordered"
                onClick={() => handleClickNegotiate(tid, pids, dpids)}
            >
                Negotiate
            </button>
        </div>
    );
};

Offer.propTypes = {
    abbrev: PropTypes.string.isRequired,
    dpids: PropTypes.arrayOf(PropTypes.number).isRequired,
    handleClickNegotiate: PropTypes.func.isRequired,
    i: PropTypes.number.isRequired,
    lost: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    payroll: PropTypes.number.isRequired,
    picks: PropTypes.arrayOf(PropTypes.object).isRequired,
    pids: PropTypes.arrayOf(PropTypes.number).isRequired,
    players: PropTypes.arrayOf(PropTypes.object).isRequired,
    region: PropTypes.string.isRequired,
    stats: PropTypes.arrayOf(PropTypes.string).isRequired,
    strategy: PropTypes.string.isRequired,
    tid: PropTypes.number.isRequired,
    tied: PropTypes.number,
    ties: PropTypes.bool.isRequired,
    warning: PropTypes.string,
    won: PropTypes.number.isRequired,
};

const ProgressBar = ({ progress }) => {
    return (
        <div
            className="progress progress-striped active"
            style={{ width: "300px" }}
        >
            <div className="progress-bar" style={{ width: `${progress}%` }} />
        </div>
    );
};

ProgressBar.propTypes = {
    progress: PropTypes.number.isRequired,
};

class TradingBlock extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            asking: false,
            offers: [],
            pids: [],
            dpids: [],
        };
        this.handleChangeAsset = this.handleChangeAsset.bind(this);
        this.handleClickAsk = this.handleClickAsk.bind(this);
        this.handleClickAskBottom = this.handleClickAskBottom.bind(this);
        this.handleClickNegotiate = this.handleClickNegotiate.bind(this);

        this.beforeOffersRef = React.createRef();
    }

    async handleChangeAsset(type, id) {
        this.setState(prevState => {
            const ids = {
                pids: helpers.deepCopy(prevState.pids),
                dpids: helpers.deepCopy(prevState.dpids),
            };

            if (ids[type].includes(id)) {
                ids[type] = ids[type].filter(currId => currId !== id);
            } else {
                ids[type].push(id);
            }

            return {
                [type]: ids[type],
            };
        });
    }

    async handleClickAsk() {
        this.setState({
            asking: true,
            offers: [],
        });

        const offers = await toWorker(
            "getTradingBlockOffers",
            this.state.pids, // eslint-disable-line react/no-access-state-in-setstate
            this.state.dpids, // eslint-disable-line react/no-access-state-in-setstate
        );

        this.setState({
            asking: false,
            offers,
        });
    }

    async handleClickAskBottom() {
        await this.handleClickAsk();

        if (this.beforeOffersRef && this.beforeOffersRef.current) {
            // This actually scrolls to above the button, because I don't want to worry about the fixed header offset
            this.beforeOffersRef.current.scrollIntoView();
        }
    }

    async handleClickNegotiate(tid, otherPids, otherDpids) {
        await toWorker("actions.tradeFor", {
            otherDpids,
            otherPids,
            tid,
            userDpids: this.state.dpids,
            userPids: this.state.pids,
        });
    }

    render() {
        const {
            gameOver,
            phase,
            stats,
            ties,
            userPicks,
            userRoster,
        } = this.props;

        setTitle("Trading Block");

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
            ...stats.map(stat => `stat:${stat}`),
        );
        cols[0].sortSequence = [];

        const rows = userRoster.map(p => {
            return {
                key: p.pid,
                data: [
                    <input
                        type="checkbox"
                        defaultChecked={this.state.pids.includes(p.pid)}
                        disabled={p.untradable}
                        onChange={() => this.handleChangeAsset("pids", p.pid)}
                        title={p.untradableMsg}
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
                    <>
                        {helpers.formatCurrency(p.contract.amount, "M")} thru{" "}
                        {p.contract.exp}
                    </>,
                    ...stats.map(stat =>
                        helpers.roundStat(p.stats[stat], stat),
                    ),
                ],
            };
        });

        return (
            <>
                <h1>
                    Trading Block <NewWindowLink />
                </h1>

                <p>
                    Select some assets you want to trade away and other teams
                    will make you trade offers.
                </p>

                <div className="row mb-3">
                    <div className="col-md-9">
                        <DataTable
                            cols={cols}
                            defaultSort={[6, "desc"]}
                            name="TradingBlock"
                            rows={rows}
                        />
                    </div>
                    <div className="col-md-3">
                        <table
                            className="table table-striped table-bordered table-sm"
                            id="picks-user"
                        >
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
                                                type="checkbox"
                                                defaultChecked={this.state.dpids.includes(
                                                    pick.dpid,
                                                )}
                                                onChange={() =>
                                                    this.handleChangeAsset(
                                                        "dpids",
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
                </div>

                <div ref={this.beforeOffersRef} />

                <center>
                    <button
                        className="btn btn-lg btn-primary"
                        disabled={this.state.asking}
                        onClick={this.handleClickAsk}
                    >
                        {!this.state.asking
                            ? "Ask For Trade Proposals"
                            : "Asking..."}
                    </button>
                </center>

                {this.state.offers.map((offer, i) => {
                    return (
                        <Offer
                            key={offer.tid}
                            handleClickNegotiate={this.handleClickNegotiate}
                            i={i}
                            stats={stats}
                            ties={ties}
                            {...offer}
                        />
                    );
                })}

                {this.state.offers.length > 0 ? (
                    <div>
                        <center>
                            <p>
                                Don't like those offers? Well maybe you'll get
                                lucky if you...
                            </p>
                            <button
                                className="btn btn-lg btn-primary"
                                disabled={this.state.asking}
                                onClick={this.handleClickAskBottom}
                            >
                                {!this.state.asking
                                    ? "Ask For Trade Proposals Again"
                                    : "Asking..."}
                            </button>
                        </center>
                    </div>
                ) : null}
            </>
        );
    }
}

TradingBlock.propTypes = {
    gameOver: PropTypes.bool.isRequired,
    phase: PropTypes.number.isRequired,
    stats: PropTypes.arrayOf(PropTypes.string).isRequired,
    ties: PropTypes.bool.isRequired,
    userPicks: PropTypes.arrayOf(PropTypes.object).isRequired,
    userRoster: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default TradingBlock;
