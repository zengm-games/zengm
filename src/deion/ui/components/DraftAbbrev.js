// @flow

import PropTypes from "prop-types";
import React from "react";
import { helpers, subscribeLocal } from "../util";

// Link to an abbrev either as "ATL" or "ATL (from BOS)" if a pick was traded.
const DraftAbbrev = ({
    originalTid,
    tid,
    season,
}: {
    originalTid: number,
    tid: number,
    season?: number,
}) => {
    return subscribeLocal(local => {
        const abbrev = local.state.teamAbbrevsCache[tid];
        const originalAbbrev = local.state.teamAbbrevsCache[originalTid];

        const args1 =
            season === undefined
                ? ["roster", abbrev]
                : ["roster", abbrev, season];

        if (abbrev === originalAbbrev) {
            return <a href={helpers.leagueUrl(args1)}>{abbrev}</a>;
        }

        const args2 =
            season === undefined
                ? ["roster", originalAbbrev]
                : ["roster", originalAbbrev, season];

        return (
            <>
                <a href={helpers.leagueUrl(args1)}>{abbrev}</a> (from{" "}
                <a href={helpers.leagueUrl(args2)}>{originalAbbrev}</a>)
            </>
        );
    });
};
DraftAbbrev.propTypes = {
    originalTid: PropTypes.number.isRequired,
    season: PropTypes.number,
    tid: PropTypes.number.isRequired,
};

export default DraftAbbrev;
