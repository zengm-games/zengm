const React = require('react');
const getCols = require('../../util/getCols');
const helpers = require('../../util/helpers');
const bbgmViewReact = require('../../util/bbgmViewReact');
const _ = require('underscore');

const {DataTable, Dropdown, NewWindowLink} = require('../components');

const AwardsRecords = ({awardType, awardTypeVal, awardsRecords, playerCount}) => {
    bbgmViewReact.title('Awards Records');
    const cols = getCols('Name', 'Count', 'Year', 'Last', 'Retired', 'HOF');

    const formatYear = year => {
        return Object.keys(year).map((k, i) => {
            const years = helpers.yearRanges(year[k].map(y => y.season)).join(', ');
            return <span key={i}>{i > 0 ? ', ' : null}{k} <small>({years})</small></span>;
        });
    };

    function checkmarkOrCross(condition) {
        if (condition) {
            return <span className="glyphicon glyphicon-ok text-success"></span>;
        }

        return <span className="glyphicon glyphicon-remove text-danger"></span>;
    }

    const rows = awardsRecords.map(a => {
        return {
            key: a.pid,
            data: [
                <a href={helpers.leagueUrl(["player", a.pid])}>{a.name}</a>,
                a.count,
                formatYear(_.groupBy(a.years, 'team')),
                a.lastYear,
                checkmarkOrCross(a.retired),
                checkmarkOrCross(a.hof),
            ],
        };
    });

    return <div>
        <Dropdown view="awards_records" fields={["awardType"]} values={[awardType]} />
        <h1>Awards<NewWindowLink /></h1>

        <p>More: <a href={helpers.leagueUrl(['history_all'])}>League History</a> | <a href={helpers.leagueUrl(['team_records'])}>Team Records</a></p>

        <h4>{playerCount} players - {awardTypeVal} </h4>

        <DataTable
            cols={cols}
            defaultSort={[1, 'desc']}
            rows={rows}
            pagination={true}
        />
    </div>;
};


module.exports = AwardsRecords;
