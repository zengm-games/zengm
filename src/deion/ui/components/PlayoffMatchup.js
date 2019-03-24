// @flow

import PropTypes from "prop-types";
import * as React from "react";
import { helpers } from "../util";

type SeriesTeam = {
    abbrev: string,
    cid: number,
    pts?: number,
    region: string,
    seed: number,
    tid: number,
    winp: number,
    won?: number,
};

const Team = ({
    team,
    season,
    showPts,
    showWon,
    userTid,
    won,
}: {
    team?: SeriesTeam,
    season: number,
    showPts: boolean,
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
            {showWon && team.hasOwnProperty("won") ? <> {team.won}</> : null}
            {!showWon && showPts && team.hasOwnProperty("pts") ? (
                <> {team.pts}</>
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

    const showPts =
        !!series.away &&
        series.away.pts !== undefined &&
        series.home.pts !== undefined &&
        numGamesToWinSeries === 1;
    const showWon = !!series.away && numGamesToWinSeries > 1;

    return (
        <>
            <Team
                team={series.home}
                season={season}
                showPts={showPts}
                showWon={showWon}
                userTid={userTid}
                won={homeWon}
            />
            {series.away ? <br /> : null}
            <Team
                team={series.away}
                season={season}
                showPts={showPts}
                showWon={showWon}
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
