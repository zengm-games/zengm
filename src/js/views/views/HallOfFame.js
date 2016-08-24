const React = require('react');
const g = require('../../globals');
const bbgmViewReact = require('../../util/bbgmViewReact');
const getCols = require('../../util/getCols');
const helpers = require('../../util/helpers');
const {DataTable, NewWindowLink} = require('../components');

const HallOfFame = ({players = []}) => {
    bbgmViewReact.title('Hall of Fame');

    const superCols = [{
        title: '',
        colspan: 6,
    }, {
        title: 'Best Season',
        colspan: 8,
    }, {
        title: 'Career Stats',
        colspan: 7,
    }];

    const cols = getCols('Name', 'Pos', 'Drafted', 'Retired', 'Pick', 'Peak Ovr', 'Year', 'Team', 'GP', 'Min', 'PPG', 'Reb', 'Ast', 'PER', 'GP', 'Min', 'PPG', 'Reb', 'Ast', 'PER', 'EWA');

    const rows = players.map(p => {
        return {
            key: p.pid,
            data: [
                <a href={helpers.leagueUrl(["player", p.pid])}>{p.name}</a>,
                p.ratings[p.ratings.length - 1].pos,
                p.draft.year,
                p.retiredYear,
                p.draft.round > 0 ? `${p.draft.round}-${p.draft.pick}` : '',
                p.peakOvr,
                p.bestStats.season,
                <a href={helpers.leagueUrl(["roster", p.bestStats.abbrev, p.bestStats.season])}>{p.bestStats.abbrev}</a>,
                p.bestStats.gp,
                helpers.round(p.bestStats.min, 1),
                helpers.round(p.bestStats.pts, 1),
                helpers.round(p.bestStats.trb, 1),
                helpers.round(p.bestStats.ast, 1),
                helpers.round(p.bestStats.per, 1),
                p.careerStats.gp,
                helpers.round(p.careerStats.min, 1),
                helpers.round(p.careerStats.pts, 1),
                helpers.round(p.careerStats.trb, 1),
                helpers.round(p.careerStats.ast, 1),
                helpers.round(p.careerStats.per, 1),
                helpers.round(p.careerStats.ewa, 1),
            ],
            classNames: {
                info: p.statsTids.indexOf(g.userTid) >= 0,
            },
        };
    });

    return <div>
        <h1>Hall of Fame <NewWindowLink /></h1>

        <p>Players are eligible to be inducted into the Hall of Fame after they retire. The formula for inclusion is very similar to <a href="http://espn.go.com/nba/story/_/id/8736873/nba-experts-rebuild-springfield-hall-fame-espn-magazine">the method described in this article</a>. Hall of famers who played for your team are <span className="text-info">highlighted in blue</span>.</p>

        <DataTable
            cols={cols}
            defaultSort={[20, 'desc']}
            pagination={true}
            rows={rows}
            superCols={superCols}
        />
    </div>;
};

module.exports = HallOfFame;
