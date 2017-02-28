// @flow

import React from 'react';
import DropdownButton from 'react-bootstrap/lib/DropdownButton';
import MenuItem from 'react-bootstrap/lib/MenuItem';
import {g} from '../../common';
import * as helpers from '../../util/helpers';

const genUrl = (parts, season) => {
    if (season !== undefined) {
        parts.push(season);
    }

    return helpers.leagueUrl(parts);
};

const JumpTo = ({season}: {season: number | 'all'}) => {
    // Sometimes the season will be some nonsense like "all", in which case we can't generally use
    // it (although maybe it would be good to in some cases). And if the season is g.season, there's
    // no need to pollute the URL with that, since it's the default on all pages.
    const s = typeof season === 'number' && season !== g.season ? String(season) : undefined;

    return <div className="pull-right">
        <DropdownButton id="jump-to-dropdown" title="Jump To">
            <MenuItem href={genUrl(['standings'], s)}>Standings</MenuItem>
            <MenuItem href={genUrl(['playoffs'], s)}>Playoffs</MenuItem>
            <MenuItem href={genUrl(['history'], s)}>Season Summary</MenuItem>
            <MenuItem href={genUrl(['league_finances'], s)}>Finances</MenuItem>
            <MenuItem href={genUrl(['transactions', 'all'], s)}>Transactions</MenuItem>
            <MenuItem href={genUrl(['draft_summary'], s)}>Draft</MenuItem>
            <MenuItem href={genUrl(['leaders'], s)}>Leaders</MenuItem>
            <MenuItem href={genUrl(['team_stats'], s)}>Team Stats</MenuItem>
            <MenuItem href={genUrl(['player_stats', 'all'], s)}>Player Stats</MenuItem>
            <MenuItem href={genUrl(['player_ratings', 'all'], s)}>Player Ratings</MenuItem>
        </DropdownButton>
    </div>;
};

JumpTo.propTypes = {
    // Not just a number, because sometimes the season might be something like "all"
    season: React.PropTypes.oneOfType([
        React.PropTypes.number,
        React.PropTypes.string,
    ]),
};

export default JumpTo;
