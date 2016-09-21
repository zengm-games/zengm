import React from 'react';
import bbgmViewReact from '../../util/bbgmViewReact';
import getCols from '../../util/getCols';
import * as helpers from '../../util/helpers';
import {DataTable, Dropdown, NewWindowLink} from '../components';

const TeamRecords = ({byType, displayName, seasonCount, teamRecords}) => {
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
            name="TeamRecords"
            rows={rows}
        />
    </div>;
};

TeamRecords.propTypes = {
    byType: React.PropTypes.oneOf(['conf', 'div', 'team']).isRequired,
    displayName: React.PropTypes.string.isRequired,
    seasonCount: React.PropTypes.number.isRequired,
    teamRecords: React.PropTypes.arrayOf(React.PropTypes.object).isRequired,
};

export default TeamRecords;
