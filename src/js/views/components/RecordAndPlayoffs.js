import React from 'react';
import helpers from '../../util/helpers';

const RecordAndPlayoffs = ({abbrev, lost, option, playoffRoundsWon, season, style, won}) => {
    const seasonText = option !== 'noSeason' ? <span><a href={helpers.leagueUrl(["roster", abbrev, season])}>{season}</a>: </span> : null;
    const recordText = <a href={helpers.leagueUrl(["standings", season])}>{won}-{lost}</a>;
    const extraText = playoffRoundsWon >= 0 ? <span>, <a href={helpers.leagueUrl(["playoffs", season])}>{helpers.roundsWonText(playoffRoundsWon).toLowerCase()}</a></span> : null;

    return <span style={style}>
        {seasonText}
        {recordText}
        {extraText}
    </span>;
};

RecordAndPlayoffs.propTypes = {
    abbrev: React.PropTypes.string.isRequired,
    lost: React.PropTypes.number.isRequired,
    option: React.PropTypes.oneOf(['noSeason']),
    playoffRoundsWon: React.PropTypes.number,
    season: React.PropTypes.number.isRequired,
    style: React.PropTypes.object,
    won: React.PropTypes.number.isRequired,
};

export default RecordAndPlayoffs;
