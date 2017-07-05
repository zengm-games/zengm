import PropTypes from 'prop-types';
import React from 'react';
import {g, helpers} from '../../common';
import {getCols, setTitle} from '../util';
import {DataTable, NewWindowLink} from '../components';

const Pyramid = ({players}) => {
    setTitle('Pyramid');

    const superCols = [{
        title: '',
        colspan: 6,
    }, {
        title: 'Best Season',
        colspan: 8,
    }, {
        title: 'Career Stats',
        colspan: 7,
    }, {
      title: 'Pyramid',
      colspan: 2
    }];

    const cols = getCols('Name', 'Pos', 'Drafted', 'Retired', 'Pick', 'Peak Ovr', 'Year', 'Team', 'GP', 'Min', 'PPG', 'Reb', 'Ast', 'PER', 'GP', 'Min', 'PPG', 'Reb', 'Ast', 'PER', 'EWA', 'Score', 'Rank');

    const rows = players.map(p => {
        return {
            key: p.pid,
            data: [
                <a href={helpers.leagueUrl(["player", p.pid])}>{p.name}</a>,
                p.ratings[p.ratings.length - 1].pos,
                p.draft.year,
                p.retiredYear !== Infinity ? p.retiredYear : '',
                p.draft.round > 0 ? `${p.draft.round}-${p.draft.pick}` : '',
                p.peakOvr,
                p.bestStats.season,
                <a href={helpers.leagueUrl(["roster", p.bestStats.abbrev, p.bestStats.season])}>{p.bestStats.abbrev}</a>,
                p.bestStats.gp,
                p.bestStats.min.toFixed(1),
                p.bestStats.pts.toFixed(1),
                p.bestStats.trb.toFixed(1),
                p.bestStats.ast.toFixed(1),
                p.bestStats.per.toFixed(1),
                p.careerStats.gp,
                p.careerStats.min.toFixed(1),
                p.careerStats.pts.toFixed(1),
                p.careerStats.trb.toFixed(1),
                p.careerStats.ast.toFixed(1),
                p.careerStats.per.toFixed(1),
                p.careerStats.ewa.toFixed(1),
                p.hofScore.toFixed(2),
                players.indexOf(p)+1
            ],
            classNames: {
                danger: p.legacyTid === g.userTid,
                info: p.statsTids.slice(0, p.statsTids.length - 1).includes(g.userTid) && p.legacyTid !== g.userTid,
                success: p.statsTids[p.statsTids.length - 1] === g.userTid && p.legacyTid !== g.userTid,
            },
        };
    });

    return <div>
        <h1>Pyramid <NewWindowLink /></h1>

        <p>This is ranking of the league's Top 100 players ever. Only active players and players in the Hall of Fame are included.</p>
        <p>The formula for ranking is very similar to <a href="http://espn.go.com/nba/story/_/id/8736873/nba-experts-rebuild-springfield-hall-fame-espn-magazine">the method described in this article</a>.</p>
        <p>Players who have played for your team are <span className="text-info">highlighted in blue</span>. Players who retired or are active with your team are <span className="text-success">highlighted in green</span>. Players who played most of their career with your team are <span className="text-danger">highlighted in red</span>.</p>

        <DataTable
            cols={cols}
            defaultSort={[20, 'desc']}
            name="HallOfFame"
            pagination
            rows={rows}
            superCols={superCols}
        />
    </div>;
};

Pyramid.propTypes = {
    players: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default Pyramid;
