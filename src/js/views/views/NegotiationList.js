import React from 'react';
import g from '../../globals';
import * as freeAgents from '../../core/freeAgents';
import {negotiate} from '../../util/actions';
import bbgmViewReact from '../../util/bbgmViewReact';
import getCols from '../../util/getCols';
import * as helpers from '../../util/helpers';
import {DataTable, NewWindowLink, PlayerNameLabels} from '../components';

const NegotiationList = ({players}) => {
    bbgmViewReact.title('Re-sign Players');

    const cols = getCols('Name', 'Pos', 'Age', 'Ovr', 'Pot', 'Min', 'Pts', 'Reb', 'Ast', 'PER', 'Asking For', 'Mood', 'Negotiate');

    const rows = players.map(p => {
        let negotiateButton;
        if (freeAgents.refuseToNegotiate(p.contract.amount * 1000, p.freeAgentMood[g.userTid])) {
            negotiateButton = "Refuses!";
        } else {
            negotiateButton = <button
                className="btn btn-default btn-xs"
                onClick={() => negotiate(p.pid)}
            >Negotiate</button>;
        }
        return {
            key: p.pid,
            data: [
                <PlayerNameLabels
                    pid={p.pid}
                    injury={p.injury}
                    skills={p.ratings.skills}
                    watch={p.watch}
                >{p.name}</PlayerNameLabels>,
                p.ratings.pos,
                p.age,
                p.ratings.ovr,
                p.ratings.pot,
                helpers.round(p.stats.min, 1),
                helpers.round(p.stats.pts, 1),
                helpers.round(p.stats.trb, 1),
                helpers.round(p.stats.ast, 1),
                helpers.round(p.stats.per, 1),
                <span>{helpers.formatCurrency(p.contract.amount, "M")} thru {p.contract.exp}</span>,
                <div title={p.mood.text} style={{width: '100%', height: '21px', backgroundColor: p.mood.color}}><span style={{display: 'none'}}>
                    {p.freeAgentMood[g.userTid]}
                </span></div>,
                negotiateButton,
            ],
        };
    });

    return <div>
        <h1>Re-sign Players <NewWindowLink /></h1>
        <p>More: <a href={helpers.leagueUrl(['upcoming_free_agents'])}>Upcoming Free Agents</a></p>

        <p>You are allowed to go over the salary cap to re-sign your players before they become free agents. If you do not re-sign them before free agency begins, they will be free to sign with any team, and you won't be able to go over the salary cap to sign them.</p>

        <DataTable
            cols={cols}
            defaultSort={[10, 'desc']}
            name="NegotiationList"
            rows={rows}
        />
    </div>;
};

NegotiationList.propTypes = {
    players: React.PropTypes.arrayOf(React.PropTypes.object).isRequired,
};

export default NegotiationList;
