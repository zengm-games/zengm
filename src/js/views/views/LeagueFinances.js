const React = require('react');
const g = require('../../globals');
const bbgmViewReact = require('../../util/bbgmViewReact');
const getCols = require('../../util/getCols');
const helpers = require('../../util/helpers');
const {DataTable, Dropdown, JumpTo, NewWindowLink} = require('../components/index');

const LeagueFinances = ({minPayroll, luxuryPayroll, luxuryTax, salaryCap, season, teams = []}) => {
    bbgmViewReact.title(`League Finances - ${season}`);

    const cols = getCols('Team', 'Avg Attendance', 'Revenue (YTD)', 'Profit (YTD)', 'Cash', 'Payroll');

    const rows = teams.map(t => {
        const payroll = season === g.season ? t.payroll : t.salaryPaid;  // Display the current actual payroll for this season, or the salary actually paid out for prior seasons

        return {
            key: t.tid,
            data: [
                <a href={helpers.leagueUrl(["team_finances", t.abbrev])}>{t.region} {t.name}</a>,
                helpers.numberWithCommas(helpers.round(t.att)),
                helpers.formatCurrency(t.revenue, "M"),
                helpers.formatCurrency(t.profit, "M"),
                helpers.formatCurrency(t.cash, "M"),
                helpers.formatCurrency(payroll, "M"),
            ],
            classNames: {
                info: t.tid === g.userTid,
            },
        };
    });

    return <div>
        <Dropdown view="league_finances" fields={["seasons"]} values={[season]} />
        <JumpTo season={season} />
        <h1>League Finances <NewWindowLink /></h1>

        <p>
          Salary cap: <b>{helpers.formatCurrency(salaryCap, 'M')}</b> (teams over this amount cannot sign free agents for more than the minimum contract)<br />
          Minimum payroll limit: <b>{helpers.formatCurrency(minPayroll, 'M')}</b> (teams with payrolls below this limit will be assessed a fine equal to the difference at the end of the season)<br />
          Luxury tax limit: <b>{helpers.formatCurrency(luxuryPayroll, 'M')}</b> (teams with payrolls above this limit will be assessed a fine equal to {luxuryTax} times the difference at the end of the season)
        </p>

        <DataTable
            cols={cols}
            defaultSort={[5, 'desc']}
            rows={rows}
        />
    </div>;
};

module.exports = LeagueFinances;