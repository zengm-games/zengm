import React from 'react';
import {PHASE, helpers} from '../../common';
import {getCols, setTitle, toWorker} from '../util';
import clickable from '../wrappers/clickable';
import {DataTable, NewWindowLink, PlayerNameLabels} from '../components';

const OfferPlayerRow = clickable(({clicked, p, toggleClicked}) => {
    return <tr className={clicked ? 'warning' : null} onClick={toggleClicked}>
        <td>
            <PlayerNameLabels
                injury={p.injury}
                pid={p.pid}
                skills={p.ratings.skills}
                watch={p.watch}
            >{p.name}</PlayerNameLabels>
        </td>
        <td>{p.ratings.pos}</td>
        <td>{p.age}</td>
        <td>{p.ratings.ovr}</td>
        <td>{p.ratings.pot}</td>
        <td>{helpers.formatCurrency(p.contract.amount, 'M')} thru {p.contract.exp}</td>
        <td>{p.stats.min.toFixed(1)}</td>
        <td>{p.stats.pts.toFixed(1)}</td>
        <td>{p.stats.trb.toFixed(1)}</td>
        <td>{p.stats.ast.toFixed(1)}</td>
        <td>{p.stats.per.toFixed(1)}</td>
    </tr>;
});

OfferPlayerRow.propTypes = {
    p: React.PropTypes.object.isRequired,
};

const Offer = props => {
    const {abbrev, dpids, handleClickNegotiate, i, lost, name, payroll, picks, pids, players, region, strategy, tid, warning, won} = props;

    let offerPlayers = null;
    if (players.length > 0) {
        offerPlayers = <div className="col-md-8">
            <div className="table-responsive">
                <table className="table table-striped table-bordered table-condensed table-hover">
                    <thead>
                        <tr><th>Name</th><th title="Position">Pos</th><th>Age</th><th title="Overall Rating">Ovr</th><th title="Potential Rating">Pot</th><th>Contract</th><th title="Minutes Per Game">Min</th><th title="Points Per Game">Pts</th><th title="Rebounds Per Game">Reb</th><th title="Assists Per Game">Ast</th><th title="Player Efficiency Rating">PER</th></tr>
                    </thead>
                    <tbody>
                        {players.map(p => <OfferPlayerRow key={p.pid} p={p} />)}
                    </tbody>
                </table>
            </div>
        </div>;
    }

    let offerPicks = null;
    if (picks.length > 0) {
        offerPicks = <div className="col-md-4">
            <table className="table table-striped table-bordered table-condensed">
                <thead>
                    <tr><th>Draft Picks</th></tr>
                </thead>
                <tbody>
                    {picks.map(pick => <tr key={pick.dpid}><td>{pick.desc}</td></tr>)}
                </tbody>
            </table>
        </div>;
    }

    return <div className="trading-block-offer">
        <h3>Offer {i + 1}: <a href={helpers.leagueUrl(['roster', abbrev])}>{region} {name}</a></h3>
        <p>{won}-{lost}, {strategy}, {helpers.formatCurrency(payroll / 1000, 'M')} payroll</p>
        <p className="text-danger">{warning}</p>
        <div className="row" style={{clear: 'both'}}>
            {offerPlayers}
            {offerPicks}
            {picks.length === 0 && players.length === 0 ? <div className="col-xs-12">Nothing.</div> : null}
        </div>

        <button
            type="submit"
            className="btn btn-default"
            onClick={() => handleClickNegotiate(tid, pids, dpids)}
        >Negotiate</button>
    </div>;
};

Offer.propTypes = {
    abbrev: React.PropTypes.string.isRequired,
    dpids: React.PropTypes.arrayOf(React.PropTypes.number).isRequired,
    handleClickNegotiate: React.PropTypes.func.isRequired,
    i: React.PropTypes.number.isRequired,
    lost: React.PropTypes.number.isRequired,
    name: React.PropTypes.string.isRequired,
    payroll: React.PropTypes.number.isRequired,
    picks: React.PropTypes.arrayOf(React.PropTypes.object).isRequired,
    pids: React.PropTypes.arrayOf(React.PropTypes.number).isRequired,
    players: React.PropTypes.arrayOf(React.PropTypes.object).isRequired,
    region: React.PropTypes.string.isRequired,
    strategy: React.PropTypes.string.isRequired,
    tid: React.PropTypes.number.isRequired,
    warning: React.PropTypes.string,
    won: React.PropTypes.number.isRequired,
};

const ProgressBar = ({progress}) => {
    return <div className="progress progress-striped active" style={{width: '300px'}}>
        <div className="progress-bar" style={{width: `${progress}%`}} />
    </div>;
};

ProgressBar.propTypes = {
    progress: React.PropTypes.number.isRequired,
};

class TradingBlock extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            asking: false,
            offers: [],
            progress: 0,
            pids: [],
            dpids: [],
        };
        this.handleChangeAsset = this.handleChangeAsset.bind(this);
        this.handleClickAsk = this.handleClickAsk.bind(this);
        this.handleClickNegotiate = this.handleClickNegotiate.bind(this);
    }

    async handleChangeAsset(type, id) {
        const ids = {
            pids: helpers.deepCopy(this.state.pids),
            dpids: helpers.deepCopy(this.state.dpids),
        };

        if (ids[type].includes(id)) {
            ids[type] = ids[type].filter(currId => currId !== id);
        } else {
            ids[type].push(id);
        }

        this.setState({
            [type]: ids[type],
        });
    }

    async handleClickAsk() {
        this.setState({
            asking: true,
            offers: [],
            progress: 10, // Start with something on the progress bar, so user knows shit is happening
        });

        const offers = await toWorker('getTradingBlockOffers', this.state.pids, this.state.dpids, (i, numTeams) => {
            this.setState({
                progress: Math.round(10 + i / numTeams * 100),
            });
        });

        this.setState({
            asking: false,
            offers,
            progress: 0,
        });
    }

    async handleClickNegotiate(tid, otherPids, otherDpids) {
        await toWorker('actions.tradeFor', {
            otherDpids,
            otherPids,
            tid,
            userDpids: this.state.dpids,
            userPids: this.state.pids,
        });
    }

    render() {
        const {gameOver, phase, userPicks, userRoster} = this.props;

        setTitle('Trading Block');

        if ((phase >= PHASE.AFTER_TRADE_DEADLINE && phase <= PHASE.PLAYOFFS) || phase === PHASE.FANTASY_DRAFT || gameOver) {
            return <div>
                <h1>Error</h1>
                <p>You're not allowed to make trades now.</p>
            </div>;
        }

        const cols = getCols('', 'Name', 'Pos', 'Age', 'Ovr', 'Pot', 'Contract', 'Min', 'Pts', 'Reb', 'Ast', 'PER');
        cols[0].sortSequence = [];

        const rows = userRoster.map(p => {
            return {
                key: p.pid,
                data: [
                    <input
                        type="checkbox"
                        defaultChecked={this.state.pids.includes(p.pid)}
                        disabled={p.untradable}
                        onChange={() => this.handleChangeAsset('pids', p.pid)}
                        title={p.untradableMsg}
                    />,
                    <PlayerNameLabels
                        injury={p.injury}
                        pid={p.pid}
                        skills={p.ratings.skills}
                        watch={p.watch}
                    >{p.name}</PlayerNameLabels>,
                    p.ratings.pos,
                    p.age,
                    p.ratings.ovr,
                    p.ratings.pot,
                    <span>{helpers.formatCurrency(p.contract.amount, 'M')} thru {p.contract.exp}</span>,
                    p.stats.min.toFixed(1),
                    p.stats.pts.toFixed(1),
                    p.stats.trb.toFixed(1),
                    p.stats.ast.toFixed(1),
                    p.stats.per.toFixed(1),
                ],
            };
        });

        let askButtonOrProgress;
        if (!this.state.asking) {
            askButtonOrProgress = <button className="btn btn-lg btn-primary" onClick={this.handleClickAsk}>
                Ask For Trade Proposals
            </button>;
        } else {
            askButtonOrProgress = <ProgressBar progress={this.state.progress} />;
        }

        return <div>
            <h1>Trading Block <NewWindowLink /></h1>

            <p>Select some assets you want to trade away and other teams will make you trade offers.</p>

            <div className="row">
                <div className="col-md-9">
                    <DataTable
                        cols={cols}
                        defaultSort={[6, 'desc']}
                        name="TradingBlock"
                        rows={rows}
                    />
                </div>
                <div className="col-md-3">
                    <table className="table table-striped table-bordered table-condensed" id="picks-user">
                        <thead>
                            <tr><th /><th width="100%">Draft Picks</th></tr>
                        </thead>
                        <tbody>
                            {userPicks.map(pick => <tr key={pick.dpid}>
                                <td>
                                    <input
                                        type="checkbox"
                                        defaultChecked={this.state.dpids.includes(pick.dpid)}
                                        onChange={() => this.handleChangeAsset('dpids', pick.dpid)}
                                    />
                                </td>
                                <td>{pick.desc}</td>
                            </tr>)}
                        </tbody>
                    </table>
                </div>
            </div>

            <p />
            <center>
                {askButtonOrProgress}
            </center>

            {this.state.offers.map((offer, i) => {
                return <Offer
                    key={offer.tid}
                    handleClickNegotiate={this.handleClickNegotiate}
                    i={i}
                    {...offer}
                />;
            })}
        </div>;
    }
}

TradingBlock.propTypes = {
    gameOver: React.PropTypes.bool.isRequired,
    phase: React.PropTypes.number.isRequired,
    userPicks: React.PropTypes.arrayOf(React.PropTypes.object).isRequired,
    userRoster: React.PropTypes.arrayOf(React.PropTypes.object).isRequired,
};

export default TradingBlock;
