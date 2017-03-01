import React from 'react';
import {g, helpers} from '../../common';
import {DataTable, NewWindowLink, PlayerNameLabels} from '../components';
import {getCols, setTitle} from '../util';

const awardName = (award, season) => {
    if (!award) {
        // For old seasons with no Finals MVP
        return 'N/A';
    }

    const ret = <span>
        <PlayerNameLabels pid={award.pid}>{award.name}</PlayerNameLabels> (<a href={helpers.leagueUrl(["roster", g.teamAbbrevsCache[award.tid], season])}>{g.teamAbbrevsCache[award.tid]}</a>)
    </span>;

    // This is our team.
    if (award.tid === g.userTid) {
        return {
            classNames: 'info',
            value: ret,
        };
    }
    return ret;
};


const teamName = (t, season) => {
    if (t) {
        return <span>
            <a href={helpers.leagueUrl(["roster", t.abbrev, season])}>{t.region}</a> ({t.won}-{t.lost})
        </span>;
    }

    // This happens if there is missing data, such as from Improve Performance
    return 'N/A';
};

const HistoryAll = ({seasons}) => {
    setTitle('League History');

    const cols = getCols('', 'League Champion', 'Runner Up', 'Finals MVP', 'MVP', 'DPOY', 'ROY');

    const rows = seasons.map(s => {
        let countText;
        let seasonLink;
        if (s.champ) {
            seasonLink = <a href={helpers.leagueUrl(["history", s.season])}>{s.season}</a>;
            countText = ` - ${helpers.ordinal(s.champ.count)} title`;
        } else {
            // This happens if there is missing data, such as from Improve Performance
            seasonLink = String(s.season);
            countText = null;
        }

        let champEl = <span>{teamName(s.champ, s.season)}{countText}</span>;
        if (s.champ && s.champ.tid === g.userTid) {
            champEl = {
                classNames: 'info',
                value: champEl,
            };
        }

        let runnerUpEl = teamName(s.runnerUp, s.season);
        if (s.runnerUp && s.runnerUp.tid === g.userTid) {
            runnerUpEl = {
                classNames: 'info',
                value: runnerUpEl,
            };
        }

        return {
            key: s.season,
            data: [
                seasonLink,
                champEl,
                runnerUpEl,
                awardName(s.finalsMvp, s.season),
                awardName(s.mvp, s.season),
                awardName(s.dpoy, s.season),
                awardName(s.roy, s.season),
            ],
        };
    });

    return <div>
        <h1>League History <NewWindowLink /></h1>
        <p>More: <a href={helpers.leagueUrl(['team_records'])}>Team Records</a> | <a href={helpers.leagueUrl(['awards_records'])}>Awards Records</a></p>

        <DataTable
            cols={cols}
            defaultSort={[0, 'desc']}
            name="HistoryAll"
            pagination
            rows={rows}
        />
    </div>;
};

HistoryAll.propTypes = {
    seasons: React.PropTypes.arrayOf(React.PropTypes.object).isRequired,
};

export default HistoryAll;
