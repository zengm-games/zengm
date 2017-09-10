import PropTypes from "prop-types";
import React from "react";
import { g, helpers } from "../../common";
import {
    DataTable,
    Dropdown,
    JumpTo,
    NewWindowLink,
    PlayerNameLabels,
} from "../components";
import { getCols, setTitle } from "../util";

const PlayerStats = ({ abbrev, players, playoffs, season, statType }) => {
    const label = season !== undefined ? season : "Career Totals";
    setTitle(`Player Stats - ${label}`);

    const superCols = [
        {
            title: "",
            colspan: 6,
        },
        {
            title: "FG",
            desc: "Field Goals",
            colspan: 3,
        },
        {
            title: "3PT",
            desc: "Three-Pointers",
            colspan: 3,
        },
        {
            title: "FT",
            desc: "Free Throws",
            colspan: 3,
        },
        {
            title: "Reb",
            desc: "Rebounds",
            colspan: 3,
        },
        {
            title: "",
            colspan: 10,
        },
    ];

    const cols = getCols(
        "Name",
        "Pos",
        "Team",
        "GP",
        "GS",
        "Min",
        "M",
        "A",
        "%",
        "M",
        "A",
        "%",
        "M",
        "A",
        "%",
        "Off",
        "Def",
        "Tot",
        "Ast",
        "TO",
        "Stl",
        "Blk",
        "BA",
        "PF",
        "Pts",
        "+/-",
        "PER",
        "EWA",
    );

    // Number of decimals for many stats
    const d = statType === "totals" ? 0 : 1;

    const rows = players.map(p => {
        let pos;
        if (p.ratings.constructor === Array) {
            pos = p.ratings[p.ratings.length - 1].pos;
        } else if (p.ratings.pos) {
            pos = p.ratings.pos;
        } else {
            pos = "?";
        }

        // HACKS to show right stats, info
        let actualAbbrev;
        let actualTid;
        if (season === undefined) {
            p.stats = p.careerStats;
            actualAbbrev = helpers.getAbbrev(p.tid);
            actualTid = p.tid;
            if (playoffs === "playoffs") {
                p.stats = p.careerStatsPlayoffs;
            }
        } else {
            actualAbbrev = p.stats.abbrev;
            actualTid = p.stats.tid;
        }

        return {
            key: p.pid,
            data: [
                <PlayerNameLabels
                    injury={p.injury}
                    pid={p.pid}
                    skills={p.ratings.skills}
                    watch={p.watch}
                >
                    {p.name}
                </PlayerNameLabels>,
                pos,
                <a href={helpers.leagueUrl(["roster", actualAbbrev, season])}>
                    {actualAbbrev}
                </a>,
                p.stats.gp,
                p.stats.gs,
                p.stats.min.toFixed(d),
                p.stats.fg.toFixed(d),
                p.stats.fga.toFixed(d),
                p.stats.fgp.toFixed(1),
                p.stats.tp.toFixed(d),
                p.stats.tpa.toFixed(d),
                p.stats.tpp.toFixed(1),
                p.stats.ft.toFixed(d),
                p.stats.fta.toFixed(d),
                p.stats.ftp.toFixed(1),
                p.stats.orb.toFixed(d),
                p.stats.drb.toFixed(d),
                p.stats.trb.toFixed(d),
                p.stats.ast.toFixed(d),
                p.stats.tov.toFixed(d),
                p.stats.stl.toFixed(d),
                p.stats.blk.toFixed(d),
                p.stats.ba.toFixed(d),
                p.stats.pf.toFixed(d),
                p.stats.pts.toFixed(d),
                helpers.plusMinus(p.stats.pm, d),
                p.stats.per.toFixed(1),
                p.stats.ewa.toFixed(1),
            ],
            classNames: {
                danger: p.hof,
                info: actualTid === g.userTid,
            },
        };
    });

    return (
        <div>
            <Dropdown
                view="player_stats"
                fields={[
                    "teamsAndAllWatch",
                    "seasonsAndCareer",
                    "statTypes",
                    "playoffs",
                ]}
                values={[
                    abbrev,
                    season === undefined ? "career" : season,
                    statType,
                    playoffs,
                ]}
            />
            <JumpTo season={season} />
            <h1>
                Player Stats <NewWindowLink />
            </h1>
            <p>
                More:{" "}
                <a href={helpers.leagueUrl(["player_shot_locations", season])}>
                    Shot Locations
                </a>{" "}
                |{" "}
                <a href={helpers.leagueUrl(["player_stat_dists", season])}>
                    Stat Distributions
                </a>
            </p>

            <p>
                Players on your team are{" "}
                <span className="text-info">highlighted in blue</span>. Players
                in the Hall of Fame are{" "}
                <span className="text-danger">highlighted in red</span>. Only
                players averaging more than 5 minutes per game are shown.
            </p>

            <DataTable
                cols={cols}
                defaultSort={[27, "desc"]}
                name="PlayerStats"
                rows={rows}
                pagination
                superCols={superCols}
            />
        </div>
    );
};

PlayerStats.propTypes = {
    abbrev: PropTypes.string.isRequired,
    players: PropTypes.arrayOf(PropTypes.object).isRequired,
    playoffs: PropTypes.oneOf(["playoffs", "regularSeason"]).isRequired,
    season: PropTypes.number, // Undefined for career totals
    statType: PropTypes.oneOf(["per36", "perGame", "totals"]).isRequired,
};

export default PlayerStats;
