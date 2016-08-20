const classNames = require('classnames');
const React = require('react');
const g = require('../../globals');
const ui = require('../../ui');
const contractNegotiation = require('../../core/contractNegotiation');
const bbgmViewReact = require('../../util/bbgmViewReact');
const helpers = require('../../util/helpers');
const {NewWindowLink} = require('../components/index');

// Show the negotiations list if there are more ongoing negotiations
async function redirectNegotiationOrRoster(cancelled) {
    const negotiations = await g.dbl.negotiations.getAll();
    if (negotiations.length > 0) {
        ui.realtimeUpdate([], helpers.leagueUrl(["negotiation"]));
    } else if (cancelled) {
        ui.realtimeUpdate([], helpers.leagueUrl(["free_agents"]));
    } else {
        ui.realtimeUpdate([], helpers.leagueUrl(["roster"]));
    }
}

const cancel = async pid => {
    await contractNegotiation.cancel(pid);
    redirectNegotiationOrRoster(true);
};

const sign = async (pid, amount, exp) => {
    const error = await contractNegotiation.accept(pid, helpers.round(amount * 1000), exp);
    if (error !== undefined && error) {
        helpers.errorNotify(error);
    }
    redirectNegotiationOrRoster(false);
};

const Negotiation = ({contractOptions = [], payroll, player = {ratings: {}}, resigning, salaryCap}) => {
    bbgmViewReact.title(`Contract Negotiation - ${player.name}`);

    return <div>
        <h1>Contract Negotiation <NewWindowLink /></h1>

        {
            resigning
        ?
            <p>You are allowed to go over the salary cap to make this deal because you are re-signing <a href={helpers.leagueUrl(['player', player.pid])}>{player.name}</a> to a contract extension. <b>If you do not come to an agreement here, <a href={helpers.leagueUrl(['player', player.pid])}>{player.name}</a> will become a free agent.</b> He will then be able to sign with any team, and you won't be able to go over the salary cap to sign him.</p>
        :
            <p>You are not allowed to go over the salary cap to make this deal because <a href={helpers.leagueUrl(['player', player.pid])}>{player.name}</a> is a free agent.</p>
        }

        <p>
            Current Payroll: {helpers.formatCurrency(payroll, 'M')}<br />
            Salary Cap: {helpers.formatCurrency(salaryCap, 'M')}
        </p>

        <h2> <a href={helpers.leagueUrl(['player', player.pid])}>{player.name}</a> <NewWindowLink parts={['player', player.pid]} /></h2>
        <p>
            Mood: {player.mood}<br />
            {player.age} years old; Overall: {player.ratings.ovr}; Potential: {player.ratings.pot}
        </p>

        <h3>Contract Options</h3>

        <div className="row">
            <div className="col-sm-8 col-md-6">
                <div className="list-group">
                    {contractOptions.map((contract, i) => {
                        return <div key={i} className="list-group-item" className={classNames('list-group-item', {'list-group-item-success': contract.smallestAmount})} style={{height: '54px'}}>
                            <div className="pull-left" style={{paddingTop: '8px'}}>
                                ${helpers.round(contract.amount, 2)}M per year<span className="hidden-xs">, through {contract.exp}</span> ({contract.years} {contract.years === 1 ? 'season' : 'seasons'})
                            </div>

                            <button
                                className="btn btn-success pull-right"
                                onClick={() => sign(player.pid, contract.amount, contract.exp)}
                            >
                                Sign<span className="hidden-xs"> Contract</span>
                            </button>
                        </div>;
                    })}
                </div>
            </div>
        </div>

        <button className="btn btn-danger" onClick={() => cancel(player.pid)}>
            Can't reach a deal? End negotiation
        </button>
    </div>;
};

module.exports = Negotiation;
