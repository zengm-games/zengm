const Promise = require('bluebird');
const React = require('react');
const _ = require('underscore');
const g = require('../../globals');
const player = require('../../core/player');
const team = require('../../core/team');
const trade = require('../../core/trade');
const bbgmViewReact = require('../../util/bbgmViewReact');
const getCols = require('../../util/getCols');
const helpers = require('../../util/helpers');
const random = require('../../util/random');
const tradeFor = require('../../util/tradeFor');
const clickable = require('../wrappers/clickable');
const {DataTable, NewWindowLink, PlayerNameLabels} = require('../components/index');

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
        <td>{helpers.round(p.stats.min, 1)}</td>
        <td>{helpers.round(p.stats.pts, 1)}</td>
        <td>{helpers.round(p.stats.trb, 1)}</td>
        <td>{helpers.round(p.stats.ast, 1)}</td>
        <td>{helpers.round(p.stats.per, 1)}</td>
    </tr>;
});

const Offer = props => {
    const {dpids, handleClickNegotiate, i, lost, name, picks = [], pids, players = [], region, strategy, tid, warning, won} = props;

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
        <h3>Offer {i + 1}: <a data-bind="attrLeagueUrl: {href: ['roster', abbrev]}">{region} {name}</a></h3>
        <p>{won}-{lost}, {strategy}</p>
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


const getOffers = async (userPids, userDpids, onProgress) => {
    // Pick 10 random teams to try (or all teams, if g.numTeams < 10)
    const tids = _.range(g.numTeams);
    random.shuffle(tids);
    tids.splice(10);

    const estValues = await trade.getPickValues();

    // For width of progress bar
    let numTeams = tids.length;
    if (tids.indexOf(g.userTid) >= 0) {
        numTeams -= 1;
    }
    let done = 0;

    const offers = [];
    for (const tid of tids) {
        let teams = [{
            tid: g.userTid,
            pids: userPids,
            dpids: userDpids,
        }, {
            tid,
            pids: [],
            dpids: [],
        }];

        if (tid !== g.userTid) {
            const [found, teams2] = await trade.makeItWork(teams, true, estValues);
            teams = teams2;

            // Update progress bar
            done += 1;
            onProgress(done, numTeams);

            if (found) {
                const summary = await trade.summary(teams);
                teams[1].warning = summary.warning;
                offers.push(teams[1]);
            }
        }
    }

    return offers;
};

const augmentOffers = offers => {
    if (offers.length === 0) {
        return [];
    }

    return g.dbl.tx(["players", "playerStats", "draftPicks", "teams", "teamSeasons"], async tx => {
        const teams = await team.filter({
            attrs: ["abbrev", "region", "name", "strategy"],
            seasonAttrs: ["won", "lost"],
            season: g.season,
            ot: tx,
        });

        // Take the pids and dpids in each offer and get the info needed to display the offer
        return Promise.map(offers, async (offer, i) => {
            const tid = offers[i].tid;

            let players = await tx.players.index('tid').getAll(tid);
            players = players.filter(p => offers[i].pids.indexOf(p.pid) >= 0);
            players = await player.withStats(tx, players, {
                statsSeasons: [g.season],
                statsTid: tid,
            });
            players = player.filter(players, {
                attrs: ["pid", "name", "age", "contract", "injury", "watch"],
                ratings: ["ovr", "pot", "skills", "pos"],
                stats: ["min", "pts", "trb", "ast", "per"],
                season: g.season,
                tid,
                showNoStats: true,
                showRookies: true,
                fuzz: true,
            });

            let picks = await tx.draftPicks.index('tid').getAll(tid);
            picks = picks.filter(dp => offers[i].dpids.indexOf(dp.dpid) >= 0);
            for (const pick of picks) {
                pick.desc = helpers.pickDesc(pick);
            }

            return {
                tid,
                abbrev: teams[tid].abbrev,
                region: teams[tid].region,
                name: teams[tid].name,
                strategy: teams[tid].strategy,
                won: teams[tid].won,
                lost: teams[tid].lost,
                pids: offers[i].pids,
                dpids: offers[i].dpids,
                warning: offers[i].warning,
                picks,
                players,
            };
        });
    });
};

const ProgressBar = ({progress}) => {
    return <div className="progress progress-striped active" style={{width: '300px'}}>
        <div className="progress-bar" style={{width: `${progress}%`}}></div>
    </div>;
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
            'pids': helpers.deepCopy(this.state.pids),
            'dpids': helpers.deepCopy(this.state.dpids),
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

        const offers = await getOffers(this.state.pids, this.state.dpids, (i, numTeams) => {
            this.setState({
                progress: Math.round(10 + i / numTeams * 100),
            });
        });
        const augmentedOffers = await augmentOffers(offers);

        this.setState({
            asking: false,
            offers: augmentedOffers,
            progress: 0,
        });
    }

    async handleClickNegotiate(tid, otherPids, otherDpids) {
        console.log('handleClickNegotiate');
        console.log('userPids', this.state.pids);
        console.log('userDpids', this.state.dpids);
        console.log('otherPids', otherPids);
        console.log('otherDpids', otherDpids);
        await tradeFor({
            otherDpids,
            otherPids,
            tid,
            userDpids: this.state.dpids,
            userPids: this.state.pids,
        });
    }

    render() {
        const {userPicks = [], userRoster = []} = this.props;

        bbgmViewReact.title('Trading Block');

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
                    helpers.round(p.stats.min, 1),
                    helpers.round(p.stats.pts, 1),
                    helpers.round(p.stats.trb, 1),
                    helpers.round(p.stats.ast, 1),
                    helpers.round(p.stats.per, 1),
                ],
            };
        });

        return <div>
            <h1>Trading Block <NewWindowLink /></h1>

            <p>Select some assets you want to trade away and other teams will make you trade offers.</p>

            <div className="row">
                <div className="col-md-9">
                    <DataTable
                        cols={cols}
                        defaultSort={[6, 'desc']}
                        rows={rows}
                    />
                </div>
                <div className="col-md-3">
                    <table className="table table-striped table-bordered table-condensed" id="picks-user">
                        <thead>
                            <tr><th></th><th width="100%">Draft Picks</th></tr>
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
                {
                    !this.state.asking
                ?
                    <button className="btn btn-lg btn-primary" onClick={this.handleClickAsk}>
                        Ask For Trade Proposals
                    </button>
                :
                    <ProgressBar progress={this.state.progress} />
                }
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

module.exports = TradingBlock;
