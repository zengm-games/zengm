const React = require('react');
const g = require('../../globals');
const bbgmViewReact = require('../../util/bbgmViewReact');
const getCols = require('../../util/getCols');
const helpers = require('../../util/helpers');
const {DataTable, NewWindowLink, PlayerNameLabels} = require('../components/index');

const awardName = (award, season) => {
    if (!award) {
        // For old seasons with no Finals MVP
        return 'N/A';
    }

    return <span>
        <PlayerNameLabels pid={award.pid}>{award.name}</PlayerNameLabels> (<a href={helpers.leagueUrl(["roster", g.teamAbbrevsCache[award.tid], season])}>{g.teamAbbrevsCache[award.tid]}</a>)
    </span>;
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

const HistoryAll = ({seasons = []}) => {
    bbgmViewReact.title('League History');

    const cols = getCols('', 'League Champion', 'Runner Up', 'Finals MVP', 'MVP', 'DPOY', 'ROY');

    const rows = seasons.map(s => {
        let countText, seasonLink;
        if (s.champ) {
            seasonLink = <a href={helpers.leagueUrl(["history", s.season])}>{s.season}</a>;
            countText = ` - ${helpers.ordinal(s.champ.count)} title`;
        } else {
            // This happens if there is missing data, such as from Improve Performance
            seasonLink = String(s.season);
            countText = null;
        }

        return {
            key: s.season,
            data: [
                seasonLink,
                <span>{teamName(s.champ, s.season)}{countText}</span>,
                teamName(s.runnerUp, s.season),
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
            pagination={true}
            rows={rows}
        />
    </div>;
};

module.exports = HistoryAll;
