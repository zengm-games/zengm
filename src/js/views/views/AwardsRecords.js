const React = require('react');
const getCols = require('../../util/getCols');
const helpers = require('../../util/helpers');
const bbgmViewReact = require('../../util/bbgmViewReact');

const {DataTable, Dropdown, NewWindowLink} = require('../components/index');

const AwardsRecords = ({awardsRecords, playerCount, awardTypeVal}) => {
    bbgmViewReact.title('Awards Records');
    const cols = getCols('Name', 'Count', 'Year', 'Last', 'Retired', 'HOF');

    const rows = awardsRecords ? awardsRecords.map(a => {
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
        };
    }) : [];

    return <div>

        <Dropdown view="awards_records" fields={["awardType"]} values={[awardTypeVal]} />
        <h1>Awards<NewWindowLink /></h1>

        <p>More: <a href={helpers.leagueUrl(['history_all'])}>League History</a> |&nbsp;
        <a href={helpers.leagueUrl(['team_records'])}>Team Records</a></p>

        <h4>{playerCount} players - {awardTypeVal} </h4>

        <DataTable
            cols={cols}
            defaultSort={[0, 'asc']}
            rows={rows}
            pagination={true}
        />
    </div>;
};


module.exports = AwardsRecords;
