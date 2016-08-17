const React = require('react');
const helpers = require('../../util/helpers');

module.exports = ({abbrev, lost, option, playoffRoundsWon, season, style, won}) => {
    const seasonText = option !== 'noSeason' ? <span><a href={helpers.leagueUrl(["roster", abbrev, season])}>{season}</a>: </span> : null;
    const recordText = <a href={helpers.leagueUrl(["standings", season])}>{won}-{lost}</a>;
    const extraText = playoffRoundsWon >= 0 ? <span>, <a href={helpers.leagueUrl(["playoffs", season])}>{helpers.roundsWonText(playoffRoundsWon).toLowerCase()}</a></span> : null;

    return <span style={style}>
        {seasonText}
        {recordText}
        {extraText}
    </span>;
};
