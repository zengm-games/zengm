// @flow

import PropTypes from "prop-types";
import * as React from "react";
import { helpers } from "../../../deion/ui/util";

type SeriesTeam = {
    abbrev: string,
    cid: number,
    region: string,
    seed: number,
    tid: number,
    winp: number,
    won?: number,
};

const Team = ({
    team,
    season,
    showWon,
    userTid,
    won,
}: {
    team?: SeriesTeam,
    season: number,
    showWon: boolean,
    userTid: number,
    won: boolean,
}) => {
    if (!team) {
        return <br />;
    }

    return (
        <span
            className={team.tid === userTid ? "table-info" : ""}
            style={{ fontWeight: won ? "bold" : "normal" }}
        >
            {team.seed}.{" "}
            <a href={helpers.leagueUrl(["roster", team.abbrev, season])}>
                {team.region}
            </a>
            {showWon && team.hasOwnProperty("won") ? (
                <span> {team.won}</span>
            ) : null}
        </span>
    );
};

const PlayoffMatchup = ({
    numGamesToWinSeries = 7,
    season,
    series,
    userTid,
}: {
    numGamesToWinSeries?: number,
    season: number,
    series?: {
        away?: SeriesTeam,
        home: SeriesTeam,
    },
    userTid: number,
}) => {
    if (
        series === undefined ||
        series.home === undefined ||
        series.home.tid === undefined
    ) {
        return null;
    }

    const homeWon =
        !series.away ||
        (series.home.hasOwnProperty("won") &&
            series.home.won === numGamesToWinSeries);
    const awayWon =
        !!series.away &&
        series.away.hasOwnProperty("won") &&
        series.away.won === numGamesToWinSeries;

    return (
        <>
            <Team
                team={series.home}
                season={season}
                showWon={!!series.away}
                userTid={userTid}
                won={homeWon}
            />
            {series.away ? <br /> : null}
            <Team
                team={series.away}
                season={season}
                showWon={!!series.away}
                userTid={userTid}
                won={awayWon}
            />
        </>
    );
};

PlayoffMatchup.propTypes = {
    numGamesToWinSeries: PropTypes.number,
    season: PropTypes.number.isRequired,
    series: PropTypes.shape({
        away: PropTypes.shape({
            abbrev: PropTypes.string.isRequired,
            region: PropTypes.string.isRequired,
            seed: PropTypes.number.isRequired,
            tid: PropTypes.number.isRequired,
            won: PropTypes.number,
        }),
        home: PropTypes.shape({
            abbrev: PropTypes.string.isRequired,
            region: PropTypes.string.isRequired,
            seed: PropTypes.number.isRequired,
            tid: PropTypes.number.isRequired,
            won: PropTypes.number,
        }),
    }),
    userTid: PropTypes.number.isRequired,
};

export default PlayoffMatchup;
