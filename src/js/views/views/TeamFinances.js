const React = require('react');
const bbgmViewReact = require('../../util/bbgmViewReact');
const getCols = require('../../util/getCols');
const helpers = require('../../util/helpers');
const {DataTable, Dropdown, NewWindowLink, PlayerNameLabels} = require('../components/index');

const TeamFinances = ({abbrev, contractTotals = [], contracts = [], luxuryPayroll, luxuryTax, minPayroll, payroll, salariesSeasons = [], salaryCap, show, team = {budget: {ticketPrice: {rank: null}, scouting: {rank: null}, budget: {rank: null}, coaching: {rank: null}, health: {rank: null}, facilities: {rank: null}}, expenses: {ticketPrice: {rank: null}, scouting: {rank: null}, budget: {rank: null}, coaching: {rank: null}, health: {rank: null}, facilities: {rank: null}}, name: null, region: null}}) => {
    bbgmViewReact.title(`${team.region} ${team.name} Finances`);

    const cols = getCols('Name').concat(salariesSeasons.map(season => {
        return {
            title: season,
            sortSequence: ['desc', 'asc'],
            sortType: 'currency',
        };
    }));

    const rows = contracts.map(p => {
        const data = [
            <PlayerNameLabels
                injury={p.injury}
                pid={p.pid}
                skills={p.skills}
                style={{fontStyle: p.released ? 'italic' : 'normal'}}
                watch={p.watch}
            >{p.firstName} {p.lastName}</PlayerNameLabels>,
        ];
        for (let i = 0; i < 5; i++) {
            if (p.amounts[i]) {
                data.push(helpers.formatCurrency(p.amounts[i], "M"));
            } else {
                data.push(null);
            }
            if (p.released) {
                data[i + 1] = <i>{data[i + 1]}</i>;
            }
        }

        return {
            key: p.pid,
            data,
        };
    });

    const footer = ['Totals'].concat(contractTotals.map(amount => helpers.formatCurrency(amount, 'M')));

    return <div>
        <Dropdown view="team_finances" fields={["teams", "shows"]} values={[abbrev, show]} />
        <h1>{team.region} {team.name} Finances <NewWindowLink /></h1>

        <p>More: <a href={helpers.leagueUrl(['roster', abbrev])}>Roster</a> | <a href={helpers.leagueUrl(['game_log', abbrev])}>Game Log</a> | <a href={helpers.leagueUrl(['team_history', abbrev])}>History</a> | <a href={helpers.leagueUrl(['transactions', abbrev])}>Transactions</a></p>


        <p className="clearfix">The current payroll (<b>{helpers.formatCurrency([team.payroll, 'M'])}</b>) is {payroll
 > minPayroll ? 'above' : 'below'} the minimum payroll limit (<b>{helpers.formatCurrency([minPayroll, 'M'])}</b>), {payroll
 > salaryCap ? 'above' : 'below'} the salary cap (<b>{helpers.formatCurrency([salaryCap, 'M'])}</b>), and {payroll
 > luxuryPayroll ? 'above' : 'below'} the luxury tax limit (<b>{helpers.formatCurrency([luxuryPayroll, 'M'])}</b>). <span className="glyphicon glyphicon-question-sign help-icon" id="help-payroll-limits" data-placement="bottom"></span></p>

        <div className="row">
            <div className="col-md-3 col-sm-2">
                <h4>Wins</h4>
                <div id="bar-graph-won" className="bar-graph-small"></div><br /><br />
                <span className="clickover"><h4>Hype <span className="glyphicon glyphicon-question-sign help-icon" id="help-hype" data-placement="right"></span></h4></span>
                <div id="bar-graph-hype" className="bar-graph-small"></div><br /><br />
                <h4>Region Population</h4>
                <div id="bar-graph-pop" className="bar-graph-small"></div><br /><br />
                <h4>Average Attendance</h4>
                <div id="bar-graph-att" className="bar-graph-small"></div>
            </div>
            <div className="col-md-4 col-sm-4">
                <h4>Revenue</h4>
                <div id="bar-graph-revenue" className="bar-graph-large"></div><br /><br />
                <h4>Expenses</h4>
                <div id="bar-graph-expenses" className="bar-graph-large"></div><br /><br />
                <h4>Cash</h4>
                <div id="bar-graph-cash" className="bar-graph-medium"></div>
            </div>
            <div className="col-md-5 col-sm-6">
                <form method="POST" id="finances-settings" data-bind="attrLeagueUrl: {action: ['team_finances']}">
                    <h4>Revenue Settings <span className="glyphicon glyphicon-question-sign help-icon" id="help-revenue-settings" data-placement="bottom"></span></h4>
                    <p className="text-danger"></p>
                    <div className="row">
                        <div className="pull-left finances-settings-label">Ticket Price</div>
                        <div className="input-group input-group-sm pull-left finances-settings-field">
                            <span className="input-group-addon">$</span><input type="text" name="budget[ticketPrice]" className="form-control" disabled="disabled" data-bind="textInput: team.budget.ticketPrice.amount" />
                        </div>
                        <div className="pull-left finances-settings-text">Leaguewide rank: #{team.budget.ticketPrice.rank}</div>
                    </div>
                    <p></p>
                    <h4>Expense Settings <span className="glyphicon glyphicon-question-sign help-icon" id="help-expense-settings" data-placement="bottom"></span></h4>
                    <p className="text-danger"></p>
                    <div className="row">
                        <div className="pull-left finances-settings-label">Scouting</div>
                        <div className="input-group input-group-sm pull-left finances-settings-field">
                            <span className="input-group-addon">$</span><input type="text" name="budget[scouting]" className="form-control" disabled="disabled" data-bind="textInput: team.budget.scouting.amount" /><span className="input-group-addon">M</span>
                        </div>
                        <div className="pull-left finances-settings-text-small">Current spending rate: #{team.budget.scouting.rank}<br />Spent this season: #{team.expenses.scouting.rank}</div>
                    </div>
                    <div className="row">
                        <div className="pull-left finances-settings-label">Coaching</div>
                        <div className="input-group input-group-sm pull-left finances-settings-field">
                            <span className="input-group-addon">$</span><input type="text" name="budget[coaching]" className="form-control" disabled="disabled" data-bind="textInput: team.budget.coaching.amount" /><span className="input-group-addon">M</span>
                        </div>
                        <div className="pull-left finances-settings-text-small">Current spending rate: #{team.budget.coaching.rank}<br />Spent this season: #{team.expenses.coaching.rank}</div>
                    </div>
                    <div className="row">
                        <div className="pull-left finances-settings-label">Health</div>
                        <div className="input-group input-group-sm pull-left finances-settings-field">
                            <span className="input-group-addon">$</span><input type="text" name="budget[health]" className="form-control" disabled="disabled" data-bind="textInput: team.budget.health.amount" /><span className="input-group-addon">M</span>
                        </div>
                        <div className="pull-left finances-settings-text-small">Current spending rate: #{team.budget.health.rank}<br />Spent this season: #{team.expenses.health.rank}</div>
                    </div>
                    <div className="row">
                        <div className="pull-left finances-settings-label">Facilities</div>
                        <div className="input-group input-group-sm pull-left finances-settings-field">
                            <span className="input-group-addon">$</span><input type="text" name="budget[facilities]" className="form-control" disabled="disabled" data-bind="textInput: team.budget.facilities.amount" /><span className="input-group-addon">M</span>
                        </div>
                        <div className="pull-left finances-settings-text-small">Current spending rate: #{team.budget.facilities.rank}<br />Spent this season: #{team.expenses.facilities.rank}</div>
                    </div>
                    <br />
                    <div className="row">
                        <div className="pull-left finances-settings-label">&nbsp;</div>
                        <div className="input-group input-group-sm pull-left finances-settings-field">
                            <button className="btn btn-large btn-primary" style={{lineHeight: '1.5em'}} />
                        </div>
                    </div>
                </form>
            </div>
        </div>
        <p className="clearfix"></p>

        <h2>Player Salaries</h2>

        <p>You can release players from <a href={helpers.leagueUrl(['roster'])}>your roster</a>. Released players who are still owed money are <i>shown in italics</i>.</p>

        <DataTable
            cols={cols}
            defaultSort={[1, 'desc']}
            footer={footer}
            rows={rows}
        />
    </div>;
};

module.exports = TeamFinances;
