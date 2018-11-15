import PropTypes from "prop-types";
import React from "react";
import { getCols, helpers, setTitle } from "../util";
import {
    DataTable,
    Dropdown,
    NewWindowLink,
    PlayerNameLabels,
} from "../components";

const PlayerFeats = ({ abbrev, feats, playoffs, season, userTid }) => {
    setTitle("Statistical Feats");

    const cols = getCols(
        "Name",
        "Pos",
        "Team",
        "GS",
        "Min",
        "FG",
        "FGA",
        "FG%",
        "3P",
        "3PA",
        "3P%",
        "FT",
        "FTA",
        "FT%",
        "ORB",
        "DRB",
        "TRB",
        "Ast",
        "Tov",
        "Stl",
        "Blk",
        "PF",
        "Pts",
        "GmSc",
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
                p.stats.gs,
                p.stats.min.toFixed(1),
                p.stats.fg,
                p.stats.fga,
                p.stats.fgp.toFixed(1),
                p.stats.tp,
                p.stats.tpa,
                p.stats.tpp.toFixed(1),
                p.stats.ft,
                p.stats.fta,
                p.stats.ftp.toFixed(1),
                p.stats.orb,
                p.stats.drb,
                p.stats.trb,
                p.stats.ast,
                p.stats.tov,
                p.stats.stl,
                p.stats.blk,
                p.stats.pf,
                p.stats.pts,
                helpers.gameScore(p.stats).toFixed(1),
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

            <p>
                All games where a player got a triple double, a 5x5, 50 points,
                25 rebounds, 20 assists, 10 steals, 10 blocks, or 10 threes are
                listed here (if you change game length in God Mode, the cuttoffs
                are scaled). Statistical feats from your players are{" "}
                <span className="text-info">highlighted in blue</span>.
            </p>

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
    userTid: PropTypes.number.isRequired,
};

export default PlayerFeats;
