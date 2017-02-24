import React from 'react';
import g from '../../globals';
import {getCols, setTitle} from '../util';
import * as helpers from '../../util/helpers';
import {DataTable, DraftAbbrev, Dropdown, JumpTo, NewWindowLink, SkillsBlock} from '../components';

const DraftSummary = ({players, season}) => {
    setTitle(`${season} Draft Summary`);

    const superCols = [{
        title: '',
        colspan: 3,
    }, {
        title: 'At Draft',
        colspan: 5,
    }, {
        title: 'Current',
        colspan: 5,
    }, {
        title: 'Career Stats',
        colspan: 7,
    }];

    const cols = getCols('Pick', 'Name', 'Pos', 'Team', 'Age', 'Ovr', 'Pot', 'Skills', 'Team', 'Age', 'Ovr', 'Pot', 'Skills', 'GP', 'Min', 'PPG', 'Reb', 'Ast', 'PER', 'EWA');

    const rows = players.map(p => {
        return {
            key: p.pid,
            data: [
                `${p.draft.round}-${p.draft.pick}`,
                <a href={helpers.leagueUrl(["player", p.pid])}>{p.name}</a>,
                p.pos,
                <DraftAbbrev originalTid={p.draft.originalTid} season={season} tid={p.draft.tid}>{p.draft.tid} {p.draft.originalTid}</DraftAbbrev>,
                p.draft.age,
                p.draft.ovr,
                p.draft.pot,
                <span className="skills-alone"><SkillsBlock skills={p.draft.skills} /></span>,
                <a href={helpers.leagueUrl(["roster", p.currentAbbrev])}>{p.currentAbbrev}</a>,
                p.currentAge,
                p.currentOvr,
                p.currentPot,
                <span className="skills-alone"><SkillsBlock skills={p.currentSkills} /></span>,
                helpers.round(p.careerStats.gp),
                helpers.round(p.careerStats.min, 1),
                helpers.round(p.careerStats.pts, 1),
                helpers.round(p.careerStats.trb, 1),
                helpers.round(p.careerStats.ast, 1),
                helpers.round(p.careerStats.per, 1),
                helpers.round(p.careerStats.ewa, 1),
            ],
            classNames: {
                danger: p.hof,
                info: p.draft.tid === g.userTid,
            },
        };
    });

    return <div>
        <Dropdown view="draft_summary" fields={["seasons"]} values={[season]} />
        <JumpTo season={season} />
        <h1>{season} Draft Summary <NewWindowLink /></h1>

        <p>More: <a href={helpers.leagueUrl(['draft_scouting'])}>Future Draft Scouting</a></p>

        <p>Players drafted by your team are <span className="text-info">highlighted in blue</span>. Players in the Hall of Fame are <span className="text-danger">highlighted in red</span>.</p>

        <DataTable
            cols={cols}
            defaultSort={[0, 'asc']}
            name="DraftSummary"
            rows={rows}
            superCols={superCols}
        />
    </div>;
};

DraftSummary.propTypes = {
    players: React.PropTypes.arrayOf(React.PropTypes.object).isRequired,
    season: React.PropTypes.number.isRequired,
};

export default DraftSummary;
