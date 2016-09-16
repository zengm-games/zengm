import React from 'react';
import * as helpers from '../../util/helpers';
import SkillsBlock from './SkillsBlock';
import WatchBlock from './WatchBlock';

const PlayerNameLabels = ({children, injury, pid, skills, style, watch}) => {
    let injuryIcon = null;
    if (injury !== undefined) {
        if (injury.gamesRemaining > 0) {
            const title = `${injury.type} (out ${injury.gamesRemaining} more games)`;
            injuryIcon = <span className="label label-danger label-injury" title={title}>{injury.gamesRemaining}</span>;
        } else if (injury.gamesRemaining === -1) {
            // This is used in box scores, where it would be confusing to display "out X more games" in old box scores
            injuryIcon = <span className="label label-danger label-injury" title={injury.type}>&nbsp;</span>;
        }
    }

    return <span style={style}>
        <a href={helpers.leagueUrl(["player", pid])}>
            {children}
        </a>
        {injuryIcon}
        <SkillsBlock skills={skills} />
        {typeof watch === 'boolean' ? <WatchBlock pid={pid} watch={watch} /> : null}
    </span>;
};
PlayerNameLabels.propTypes = {
    children: React.PropTypes.any,
    injury: React.PropTypes.shape({
        gamesRemaining: React.PropTypes.number.isRequired,
        type: React.PropTypes.string.isRequired,
    }),
    pid: React.PropTypes.number.isRequired,
    skills: React.PropTypes.arrayOf(React.PropTypes.string),
    style: React.PropTypes.object,
    watch: React.PropTypes.oneOfType([
        React.PropTypes.bool,
        React.PropTypes.func, // For Firefox's Object.watch
    ]),
};

export default PlayerNameLabels;
