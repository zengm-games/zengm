const React = require('react');
const g = require('../../globals');
const bbgmViewReact = require('../../util/bbgmViewReact');
const helpers = require('../../util/helpers');
const {DataTable, DraftAbbrev, Dropdown, JumpTo, NewWindowLink, SkillsBlock} = require('../components/index');

const DraftSummary = ({players = [], season}) => {
    bbgmViewReact.title(`${season} Draft Summary`);

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

    const cols = [{
        title: 'Pick',
        sortType: 'draftPick',
    }, {
        title: 'Name',
        sortType: 'name',
    }, {
        title: 'Pos',
        desc: 'Position',
    }, {
        title: 'Team',
    }, {
        title: 'Age',
    }, {
        title: 'Ovr',
        desc: 'Overall rating',
        sortSequence: ['desc', 'asc'],
    }, {
        title: 'Pot',
        desc: 'Potential rating',
        sortSequence: ['desc', 'asc'],
    }, {
        title: 'Skills',
    }, {
        title: 'Team',
    }, {
        title: 'Age',
    }, {
        title: 'Ovr',
        desc: 'Overall rating',
        sortSequence: ['desc', 'asc'],
        sortType: 'number',
    }, {
        title: 'Pot',
        desc: 'Potential rating',
        sortSequence: ['desc', 'asc'],
        sortType: 'number',
    }, {
        title: 'Skills',
    }, {
        title: 'GP',
        desc: 'Games Played',
        sortSequence: ['desc', 'asc'],
        sortType: 'number',
    }, {
        title: 'Min',
        desc: 'Minutes Per Game',
        sortSequence: ['desc', 'asc'],
        sortType: 'number',
    }, {
        title: 'PPG',
        desc: 'Points Per Game',
        sortSequence: ['desc', 'asc'],
        sortType: 'number',
    }, {
        title: 'Reb',
        desc: 'Rebounds Per Game',
        sortSequence: ['desc', 'asc'],
        sortType: 'number',
    }, {
        title: 'Ast',
        desc: 'Assists Per Game',
        sortSequence: ['desc', 'asc'],
        sortType: 'number',
    }, {
        title: 'PER',
        desc: 'Player Efficiency Rating',
        sortSequence: ['desc', 'asc'],
        sortType: 'number',
    }, {
        title: 'EWA',
        desc: 'Estimated Wins Added',
        sortSequence: ['desc', 'asc'],
        sortType: 'number',
    }];

    const rows = players.map(p => {
        return {
            key: p.pid,
            data: [`${p.draft.round}-${p.draft.pick}`,
                <a href={helpers.leagueUrl(["player", p.pid])}>{p.name}</a>,
                p.pos,
                <DraftAbbrev originalTid={p.draft.originalTid} season={season} tid={p.draft.tid} />,
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

        <p>More: <a data-bind="attrLeagueUrl: {href: ['draft_scouting']}">Future Draft Scouting</a></p>

        <p>Players drafted by your team are <span className="text-info">highlighted in blue</span>. Players in the Hall of Fame are <span className="text-danger">highlighted in red</span>.</p>

        <DataTable
            cols={cols}
            defaultSort={[0, 'asc']}
            rows={rows}
            superCols={superCols}
        />
    </div>;
};

module.exports = DraftSummary;
