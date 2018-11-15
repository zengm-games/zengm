import classNames from "classnames";
import PropTypes from "prop-types";
import React from "react";
import {
    BoxScore,
    Dropdown,
    NewWindowLink,
    PlayerNameLabels,
} from "../components";
import { helpers, setTitle } from "../util";
import clickable from "../wrappers/clickable";

const StatsRow = clickable(({ clicked, i, p, toggleClicked }) => {
    const classes = classNames({
        separator: i === 4,
        "table-warning": clicked,
    });
    return (
        <tr className={classes} onClick={toggleClicked}>
            <td>
                <PlayerNameLabels
                    injury={p.injury}
                    pid={p.pid}
                    skills={p.skills}
                >
                    {p.name}
                </PlayerNameLabels>
            </td>
            <td>{p.pos}</td>
            <td>{p.min.toFixed(1)}</td>
            <td>
                {p.fg}-{p.fga}
            </td>
            <td>
                {p.tp}-{p.tpa}
            </td>
            <td>
                {p.ft}-{p.fta}
            </td>
            <td>{p.orb}</td>
            <td>{p.drb + p.orb}</td>
            <td>{p.ast}</td>
            <td>{p.tov}</td>
            <td>{p.stl}</td>
            <td>{p.blk}</td>
            <td>{p.ba}</td>
            <td>{p.pf}</td>
            <td>{p.pts}</td>
            <td>{helpers.plusMinus(p.pm, 0)}</td>
            <td>{helpers.gameScore(p).toFixed(1)}</td>
        </tr>
    );
});

StatsRow.propTypes = {
    i: PropTypes.number.isRequired,
    p: PropTypes.object.isRequired,
};

const findPrevNextGids = (games = [], currentGid) => {
    let prevGid;
    let nextGid;

    for (let i = 0; i < games.length; i++) {
        if (games[i].gid === currentGid) {
            if (i > 0) {
                nextGid = games[i - 1].gid;
            }
            if (i < games.length - 1) {
                prevGid = games[i + 1].gid;
            }
            break;
        }
    }

    return { prevGid, nextGid };
};

const GamesList = ({ abbrev, currentSeason, gid, gamesList, season }) => {
    if (season < currentSeason && gamesList.games.length === 0) {
        return (
            <p className="alert alert-info">
                No games found for this season. By default, box scores from old
                seasons are automatically deleted after 3 years.{" "}
                <a href={helpers.leagueUrl(["options"])}>
                    You can change this behavior on the Options page.
                </a>
            </p>
        );
    }

    return (
        <table className="table table-striped table-bordered table-sm game-log-list">
            <thead>
                <tr>
                    <th>Opp</th>
                    <th>W/L</th>
                    <th>Score</th>
                </tr>
            </thead>
            <tbody>
                {gamesList.abbrev !== abbrev ? (
                    <tr>
                        <td colSpan="3">Loading...</td>
                    </tr>
                ) : (
                    gamesList.games.map(gm => {
                        return (
                            <tr
                                key={gm.gid}
                                className={gm.gid === gid ? "table-info" : null}
                            >
                                <td className="game-log-cell">
                                    <a
                                        href={helpers.leagueUrl([
                                            "game_log",
                                            abbrev,
                                            season,
                                            gm.gid,
                                        ])}
                                    >
                                        {gm.home ? "" : "@"}
                                        {gm.oppAbbrev}
                                    </a>
                                </td>
                                <td className="game-log-cell">
                                    <a
                                        href={helpers.leagueUrl([
                                            "game_log",
                                            abbrev,
                                            season,
                                            gm.gid,
                                        ])}
                                    >
                                        {gm.won ? "W" : "L"}
                                    </a>
                                </td>
                                <td className="game-log-cell">
                                    <a
                                        href={helpers.leagueUrl([
                                            "game_log",
                                            abbrev,
                                            season,
                                            gm.gid,
                                        ])}
                                    >
                                        {gm.pts}-{gm.oppPts}
                                        {gm.overtime}
                                    </a>
                                </td>
                            </tr>
                        );
                    })
                )}
            </tbody>
        </table>
    );
};

GamesList.propTypes = {
    abbrev: PropTypes.string.isRequired,
    currentSeason: PropTypes.number.isRequired,
    gid: PropTypes.number,
    gamesList: PropTypes.object.isRequired,
    season: PropTypes.number.isRequired,
};

const GameLog = ({
    abbrev,
    boxScore,
    currentSeason,
    gamesList = { games: [] },
    season,
}) => {
    setTitle(`Game Log - ${season}`);

    const { nextGid, prevGid } = findPrevNextGids(
        gamesList.games,
        boxScore.gid,
    );

    return (
        <>
            <Dropdown
                view="game_log"
                extraParam={boxScore.gid}
                fields={["teams", "seasons"]}
                values={[abbrev, season]}
            />
            <h1>
                Game Log <NewWindowLink />
            </h1>

            <p>
                More:{" "}
                <a href={helpers.leagueUrl(["roster", abbrev, season])}>
                    Roster
                </a>{" "}
                |{" "}
                <a href={helpers.leagueUrl(["team_finances", abbrev])}>
                    Finances
                </a>{" "}
                |{" "}
                <a href={helpers.leagueUrl(["team_history", abbrev])}>
                    History
                </a>{" "}
                |{" "}
                <a href={helpers.leagueUrl(["transactions", abbrev])}>
                    Transactions
                </a>
            </p>

            <p />
            <div className="row">
                <div className="col-md-10">
                    {boxScore.gid >= 0 ? (
                        <BoxScore
                            abbrev={abbrev}
                            boxScore={boxScore}
                            nextGid={nextGid}
                            prevGid={prevGid}
                            showNextPrev
                            Row={StatsRow}
                        />
                    ) : (
                        <p>Select a game from the menu to view a box score.</p>
                    )}
                </div>

                <div className="col-md-2">
                    <GamesList
                        abbrev={abbrev}
                        currentSeason={currentSeason}
                        gamesList={gamesList}
                        gid={boxScore.gid}
                        season={season}
                    />
                </div>
            </div>
        </>
    );
};

GameLog.propTypes = {
    abbrev: PropTypes.string.isRequired,
    boxScore: PropTypes.object.isRequired,
    currentSeason: PropTypes.number.isRequired,
    gamesList: PropTypes.object.isRequired,
    season: PropTypes.number.isRequired,
};

export default GameLog;
