const React = require('react');
const g = require('../../globals');
const bbgmViewReact = require('../../util/bbgmViewReact');
const getCols = require('../../util/getCols');
const helpers = require('../../util/helpers');
const {DataTable, NewWindowLink, PlayerNameLabels} = require('../components/index');

const genRows = players => {
    return players.map(p => {
        return {
            key: p.pid,
            data: [
                <input type="checkbox" value={p.pid} title={p.untradableMsg} checked={p.selected} disabled={p.untradable} />,
                <PlayerNameLabels injury={p.injury} pid={p.pid} skills={p.ratings.skills} watch={p.watch}>{p.name}</PlayerNameLabels>,
                p.ratings.pos,
                p.age,
                p.ratings.ovr,
                p.ratings.pot,
                <span>{helpers.formatCurrency(p.contract.amount, "M")} thru {p.contract.exp}</span>,
                helpers.round(p.stats.min, 1),
                helpers.round(p.stats.pts, 1),
                helpers.round(p.stats.trb, 1),
                helpers.round(p.stats.ast, 1),
                helpers.round(p.stats.per, 1),
            ],
        };
    });
};

class Trade extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            forceTrade: false,
        };
    }

    render() {
        const {godMode, lost, message, otherDpids = [], otherPicks = [], otherPids = [], otherRoster = [], otherTid, salaryCap, summary = {enablePropose: false, teams: []}, showResigningMsg, strategy, teams = [], userDpids = [], userPicks = [], userPids = [], userRoster = [], userTeamName, won} = this.props;

        bbgmViewReact.title('Trade');

        const cols = getCols('', 'Name', 'Pos', 'Age', 'Ovr', 'Pot', 'Contract', 'Min', 'Pts', 'Reb', 'Ast', 'PER');
        cols[0].sortSequence = [];
        const otherRows = genRows(otherRoster);
        const userRows = genRows(userRoster);

        return <div>
            <h1>Trade <NewWindowLink /></h1>

            {showResigningMsg ? <p>You can't trade players whose contracts expired this season, but their old contracts still count against team salary caps until they are either re-signed or become free agents.</p> : null}

            <p>If a player has been signed within the past 15 games, he is not allowed to be traded.</p>

            <div className="row">
                <div className="col-md-9">
                    <form id="rosters" className="form-inline">
                        <select className="form-control select-team" style={{marginBottom: '6px'}} value={g.teamAbbrevsCache[otherTid]}>
                            {teams.map(t => <option key={t.abbrev} value={t.abbrev}>
                                {t.region} {t.name}
                            </option>)}
                        </select>
                        <p>{won}-{lost}, {strategy}</p>
                        <DataTable
                            cols={cols}
                            defaultSort={[5, 'desc']}
                            rows={otherRows}
                        />
                        <div className="table-responsive">
                            <table className="table table-striped table-bordered table-condensed">
                                <thead>
                                    <tr><th></th><th width="100%">Draft Picks</th></tr>
                                </thead>
                                <tbody>
                                    {otherPicks.map(pick => <tr key={pick.dpid}>
                                        <td>
                                            <input name="other-dpids" type="checkbox" value={pick.dpid} checked={otherDpids.includes(pick.dpid)} />
                                        </td>
                                        <td>{pick.desc}</td>
                                    </tr>)}
                                </tbody>
                            </table>
                        </div>

                        <h2>{userTeamName}</h2>
                        <DataTable
                            cols={cols}
                            defaultSort={[5, 'desc']}
                            rows={userRows}
                        />
                        <div className="table-responsive">
                            <table className="table table-striped table-bordered table-condensed">
                                <thead>
                                    <tr><th></th><th width="100%">Draft Picks</th></tr>
                                </thead>
                                <tbody>
                                    {userPicks.map(pick => <tr key={pick.dpid}>
                                        <td>
                                            <input name="user-dpids" type="checkbox" value={pick.dpid} checked={userDpids.includes(pick.dpid)} />
                                        </td>
                                        <td>{pick.desc}</td>
                                    </tr>)}
                                </tbody>
                            </table>
                        </div>
                    </form>
                </div>
                <div className="col-md-3" id="trade-summary">
                    <h3>Trade Summary</h3>
                    <div className="row">
                        {summary.teams.map((t, i) => <div key={i} className="col-md-12 col-xs-6">
                            <h4>{t.name}</h4>
                            <h5>Trade Away:</h5>
                            <ul className="list-unstyled">
                                {t.trade.map(p => <li key={p.pid}>
                                    <a href={helpers.leagueUrl(['player', p.pid])}>{p.name}</a> ({helpers.formatCurrency(p.contract.amount, 'M')})
                                </li>)}
                                {t.picks.map(pick => <li key={pick.dpid}>{pick.desc}</li>)}
                                <li>{helpers.formatCurrency(t.total, 'M')} Total</li>
                            </ul>
                            <h5>Receive:</h5>
                            <ul className="list-unstyled">
                                {summary.teams[t.other].trade.map(p => <li key={p.pid}>
                                    <a href={helpers.leagueUrl(['player', p.pid])}>{p.name}</a> ({helpers.formatCurrency(p.contract.amount, 'M')})
                                </li>)}
                                {summary.teams[t.other].picks.map(pick => <li key={pick.dpid}>{pick.desc}</li>)}
                                <li>{helpers.formatCurrency(summary.teams[t.other].total, 'M')} Total</li>
                            </ul>
                            <h5>Payroll after trade: {helpers.formatCurrency(t.payrollAfterTrade, 'M')}</h5>
                            <h5>Salary cap: {helpers.formatCurrency(salaryCap, 'M')}</h5>
                        </div>)}
                    </div>

                    <br />
                    {summary.warning ? <p className="alert alert-danger"><strong>Warning!</strong> {summary.warning}</p> : null}
                    {message ? <p className="alert alert-info">{message}</p> : null}

                    <center>
                        <form method="POST" id="propose-trade" data-bind="attrLeagueUrl: {action: ['trade']}">
                            <input type="hidden" name="propose" value="1" />
                            {godMode ? <label className="god-mode god-mode-text"><input type="checkbox" value={this.state.forceTrade} />Force Trade</label> : null}<br />
                            <button type="submit" className="btn btn-large btn-primary" disabled={!summary.enablePropose && !this.state.forceTrade}>Propose Trade</button>
                        </form>

                        <form method="POST" id="propose-trade" data-bind="attrLeagueUrl: {action: ['trade']}">
                            <input type="hidden" name="ask" value="1" />
                            <button type="submit" className="btn" id="ask-button">What would make this deal work?</button>
                        </form>

                        <form method="POST" id="clear-trade" data-bind="attrLeagueUrl: {action: ['trade']}">
                            <input type="hidden" name="clear" value="1" />
                            <button type="submit" className="btn">Clear Trade</button>
                        </form>
                    </center>
                </div>
            </div>
        </div>;
    }
}

module.exports = Trade;
