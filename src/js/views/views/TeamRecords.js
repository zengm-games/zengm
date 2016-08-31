const React = require('react');
const bbgmViewReact = require('../../util/bbgmViewReact');
const getCols = require('../../util/getCols');
const helpers = require('../../util/helpers');
const {DataTable, Dropdown, NewWindowLink} = require('../components');

const TeamRecords = ({byType, displayName = 'Team', seasonCount, teamRecords = []}) => {
    bbgmViewReact.title('Team Records');

    const cols = getCols(displayName, 'W', 'L', '%', 'Playoffs', 'Last Playoffs', 'Finals', 'Championships', 'Last Title', 'MVP', 'DPOY', 'SMOY', 'ROY', 'BR', 'BRC', 'ART', 'ALT', 'ADT');

    const rows = teamRecords.map(tr => {
        return {
            key: tr.id,
            data: [
                tr.team,
                tr.won,
                tr.lost,
                tr.winp,
                tr.playoffAppearances,
                tr.lastPlayoffAppearance,
                tr.finals,
                tr.championships,
                tr.lastChampionship,
                tr.mvp,
                tr.dpoy,
                tr.smoy,
                tr.roy,
                tr.bestRecord,
                tr.bestRecordConf,
                tr.allRookie,
                tr.allLeague,
                tr.allDefense,
            ],
        };
    });

    return <div>
        <Dropdown view="team_records" fields={["teamRecordType"]} values={[byType]} />
        <h1>Team Records <NewWindowLink /></h1>

        <p>More: <a href={helpers.leagueUrl(['history_all'])}>League History</a> | <a href={helpers.leagueUrl(['awards_records'])}>Awards Records</a></p>

        <p>Totals over {seasonCount} seasons played.</p>

        <DataTable
            cols={cols}
            defaultSort={[0, 'asc']}
            rows={rows}
        />
    </div>;
};

module.exports = TeamRecords;
