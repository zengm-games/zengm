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
           // not sure what to pass in for dropdown values
        <Dropdown view="award_records" fields={["awardType"]} />
        <JumpTo season={season} />
        <h1>{season} Draft Summary <NewWindowLink /></h1>

        <p>More: <a href={helpers.leagueUrl(['draft_scouting'])}>Future Draft Scouting</a></p>

        <p>Players drafted by your team are <span className="text-info">highlighted in blue</span>. Players in the Hall of Fame are <span className="text-danger">highlighted in red</span>.</p>

        <DataTable
            cols={cols}
            defaultSort={[0, 'asc']}
            rows={rows}
            superCols={superCols}
        />
    </div>;
};



module.exports = AwardsRecords;
