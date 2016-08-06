const React = require('react');
const getCols = require('../../util/getCols');
const helpers = require('../../util/helpers');
const bbgmViewReact = require('../util/bbgmViewReact');

const {DataTable, Dropdown} = require('../components/index');

const AwardsRecords = ({awardsRecords}) => {
    bbgmViewReact.title('Awards Records');

    const cols = getCols('Name', 'Count', 'Year', 'Last', 'Retired', 'HOF');

    const rows = awardsRecords.map(a => {
        return {
            key: a.pid,
            data: [
                <a href={helpers.leagueUrl(["player", a.pid])}>{a.name}</a>,
                a.count,
                a.years,
                a.lastYear,
                a.retired,
                a.hof,
            ],
            classNames: {
                danger: a.hof,
            },
        };
    });

    return <div>

        <Dropdown view="award_records" fields={["awardType"]} values={["awardType"]} />

        <h1>Awards (react)</h1>

        <p>More: <a href={helpers.leagueUrl(['history_all'])}>League Historyzzz</a>
        <a href={helpers.leagueUrl(['team_records'])}>Team Records</a></p>

        <p>Players in the Hall of Fame are <span className="text-danger">highlighted in red</span>.</p>

        <DataTable
            cols={cols}
            defaultSort={[0, 'asc']}
            rows={rows}
        />
    </div>;
};



module.exports = AwardsRecords;
