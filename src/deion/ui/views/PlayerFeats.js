import PropTypes from "prop-types";
import React from "react";
import {
    DataTable,
    Dropdown,
    NewWindowLink,
    PlayerNameLabels,
} from "../components";
import { getCols, helpers, setTitle } from "../util";

const PlayerFeats = ({ abbrev, feats, playoffs, season, stats, userTid }) => {
    setTitle("Statistical Feats");

    const cols = getCols(
        "Name",
        "Pos",
        "Team",
        ...stats.map(stat => `stat:${stat}`),
        "Opp",
        "Result",
        "Season",
    );

    const rows = feats.map(p => {
        return {
            key: p.fid,
            data: [
                <PlayerNameLabels injury={p.injury} pid={p.pid} watch={p.watch}>
                    {p.name}
                </PlayerNameLabels>,
                p.pos,
                <a href={helpers.leagueUrl(["roster", p.abbrev, p.season])}>
                    {p.abbrev}
                </a>,
                ...stats.map(stat =>
                    helpers.roundStat(p.stats[stat], stat, true),
                ),
                <a href={helpers.leagueUrl(["roster", p.oppAbbrev, p.season])}>
                    {p.oppAbbrev}
                </a>,
                <a
                    href={helpers.leagueUrl([
                        "game_log",
                        p.abbrev,
                        p.season,
                        p.gid,
                    ])}
                >
                    {p.won ? "W" : "L"} {p.score}
                </a>,
                p.season,
            ],
            classNames: {
                "table-info": p.tid === userTid,
            },
        };
    });

    return (
        <>
            <Dropdown
                view="player_feats"
                fields={["teamsAndAll", "seasonsAndAll", "playoffs"]}
                values={[abbrev, season, playoffs]}
            />
            <h1>
                Statistical Feats <NewWindowLink />
            </h1>

            {process.env.SPORT === "basketball" ? (
                <p>
                    All games where a player got a triple double, a 5x5, 50
                    points, 25 rebounds, 20 assists, 10 steals, 10 blocks, or 10
                    threes are listed here (if you change game length in God
                    Mode, the cuttoffs are scaled). Statistical feats from your
                    players are{" "}
                    <span className="text-info">highlighted in blue</span>.
                </p>
            ) : (
                <p>
                    Statistical feats are not yet implemented for football,
                    sorry!
                </p>
            )}

            <DataTable
                cols={cols}
                defaultSort={[23, "desc"]}
                name="PlayerFeats"
                rows={rows}
                pagination
            />
        </>
    );
};

PlayerFeats.propTypes = {
    abbrev: PropTypes.string.isRequired,
    feats: PropTypes.arrayOf(PropTypes.object).isRequired,
    playoffs: PropTypes.oneOf(["playoffs", "regularSeason"]).isRequired,
    season: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
        .isRequired,
    stats: PropTypes.arrayOf(PropTypes.string).isRequired,
    userTid: PropTypes.number.isRequired,
};

export default PlayerFeats;
