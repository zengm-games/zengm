import React from 'react';
import {g} from '../../common';
import {getCols, setTitle} from '../util';
import * as helpers from '../../util/helpers';
import {DataTable, Dropdown, JumpTo, NewWindowLink} from '../components';

const LeagueFinances = ({minPayroll, luxuryPayroll, luxuryTax, salaryCap, season, teams}) => {
    setTitle(`League Finances - ${season}`);

    const cols = getCols('Team', 'Avg Attendance', 'Revenue (YTD)', 'Profit (YTD)', 'Cash', 'Payroll');

    const rows = teams.map(t => {
        // Display the current actual payroll for this season, or the salary actually paid out for prior seasons
        const payroll = season === g.season ? t.seasonAttrs.payroll : t.seasonAttrs.salaryPaid;

        return {
            key: t.tid,
            data: [
                <a href={helpers.leagueUrl(["team_finances", t.abbrev])}>{t.region} {t.name}</a>,
                helpers.numberWithCommas(Math.round(t.seasonAttrs.att)),
                helpers.formatCurrency(t.seasonAttrs.revenue, "M"),
                helpers.formatCurrency(t.seasonAttrs.profit, "M"),
                helpers.formatCurrency(t.seasonAttrs.cash, "M"),
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
            name="LeagueFinances"
            rows={rows}
        />
    </div>;
};

LeagueFinances.propTypes = {
    minPayroll: React.PropTypes.number.isRequired,
    luxuryPayroll: React.PropTypes.number.isRequired,
    luxuryTax: React.PropTypes.number.isRequired,
    salaryCap: React.PropTypes.number.isRequired,
    season: React.PropTypes.number.isRequired,
    teams: React.PropTypes.arrayOf(React.PropTypes.shape({
        abbrev: React.PropTypes.string.isRequired,
        name: React.PropTypes.string.isRequired,
        region: React.PropTypes.string.isRequired,
        seasonAttrs: React.PropTypes.shape({
            att: React.PropTypes.number.isRequired,
            cash: React.PropTypes.number.isRequired,
            payroll: React.PropTypes.number, // Not required for past seasons
            profit: React.PropTypes.number.isRequired,
            revenue: React.PropTypes.number.isRequired,
            salaryPaid: React.PropTypes.number.isRequired,
        }).isRequired,
        tid: React.PropTypes.number.isRequired,
    })).isRequired,
};

export default LeagueFinances;
