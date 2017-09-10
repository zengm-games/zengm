// @flow

import PropTypes from 'prop-types';
import * as React from 'react';
import {helpers} from '../../common';

const RecordAndPlayoffs = ({abbrev, lost, option, playoffRoundsWon, season, style, won}: {
    abbrev: string,
    lost: number,
    option?: 'noSeason',
    playoffRoundsWon?: number,
    season: number,
    style: {[key: string]: string},
    won: number,
}) => {
    const seasonText = option !== 'noSeason' ? <span><a href={helpers.leagueUrl(["roster", abbrev, season])}>{season}</a>: </span> : null;
    const recordText = <a href={helpers.leagueUrl(["standings", season])}>{won}-{lost}</a>;
    const extraText = playoffRoundsWon !== undefined && playoffRoundsWon >= 0 ? <span>, <a href={helpers.leagueUrl(["playoffs", season])}>{helpers.roundsWonText(playoffRoundsWon).toLowerCase()}</a></span> : null;

    return <span style={style}>
        {seasonText}
        {recordText}
        {extraText}
    </span>;
};

RecordAndPlayoffs.propTypes = {
    abbrev: PropTypes.string.isRequired,
    lost: PropTypes.number.isRequired,
    option: PropTypes.oneOf(['noSeason']),
    playoffRoundsWon: PropTypes.number,
    season: PropTypes.number.isRequired,
    style: PropTypes.object,
    won: PropTypes.number.isRequired,
};

export default RecordAndPlayoffs;
