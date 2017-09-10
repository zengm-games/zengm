// @flow

import PropTypes from 'prop-types';
import * as React from 'react';
import {g, helpers} from '../../common';

// Link to an abbrev either as "ATL" or "ATL (from BOS)" if a pick was traded.
const DraftAbbrev = ({originalTid, tid, season}: {originalTid: number, tid: number, season: number}) => {
    const abbrev = g.teamAbbrevsCache[tid];
    const originalAbbrev = g.teamAbbrevsCache[originalTid];

    if (abbrev === originalAbbrev) {
        return <a href={helpers.leagueUrl(["roster", abbrev, season])}>{abbrev}</a>;
    }

    return <span>
        <a href={helpers.leagueUrl(["roster", abbrev, season])}>{abbrev}</a> (from <a href={helpers.leagueUrl(["roster", originalAbbrev, season])}>{originalAbbrev}</a>)
    </span>;
};
DraftAbbrev.propTypes = {
    originalTid: PropTypes.number.isRequired,
    season: PropTypes.number,
    tid: PropTypes.number.isRequired,
};

export default DraftAbbrev;
