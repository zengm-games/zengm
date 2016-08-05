const React = require('react');
const g = require('../../globals');
const bbgmViewReact = require('../../util/bbgmViewReact');
const helpers = require('../../util/helpers');
const {DataTable, NewWindowLink} = require('../components/index');

const PowerRankings = ({teams = []}) => {
    bbgmViewReact.title('Power Rankings');

    const cols = [{
        title: 'O',
        desc: 'Overall',
    }, {
        title: 'P',
        desc: 'Performance',
    }, {
        title: 'T',
        desc: 'Talent',
    }, {
        title: 'Team',
        width: '100%',
    }, {
        title: 'W',
        desc: 'Games Won',
        sortSequence: ['desc', 'asc'],
    }, {
        title: 'L',
        desc: 'Games Lost',
        sortSequence: ['desc', 'asc'],
    }, {
        title: 'L10',
        desc: 'Last Ten Games',
        sortSequence: ['desc', 'asc'],
        sortType: 'lastTen',
    }, {
        title: 'Diff',
        desc: 'Point Differential',
        sortSequence: ['desc', 'asc'],
        sortType: 'number',
    }];

    const rows = teams.map(t => {
        const performanceRank = t.gp > 0 ? t.performanceRank : "-";

        return {
            key: t.tid,
            data: [
                t.overallRank,
                performanceRank,
                t.talentRank,
                <a href={helpers.leagueUrl(["roster", t.abbrev])}>{t.region} {t.name}</a>,
                t.won,
                t.lost,
                t.lastTen,
                <span className={t.diff > 0 ? 'text-success' : 'text-danger'}>{helpers.round(t.diff, 1)}</span>,
            ],
            classNames: {
                info: t.tid === g.userTid,
            },
        };
    });

    return <div>
        <h1>Power Rankings <NewWindowLink /></h1>

        <p>The "Performance" rating is based on point differential and recent team performance. The "Talent" rating is based on player ratings and stats. The "Overall" rating is a combination of the two.</p>

        <DataTable
            cols={cols}
            defaultSort={[0, 'asc']}
            rows={rows}
        />
    </div>;
};

module.exports = PowerRankings;
