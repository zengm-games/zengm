import PropTypes from "prop-types";
import React from "react";
import {
    DataTable,
    Dropdown,
    JumpTo,
    NewWindowLink,
    PlayerNameLabels,
} from "../components";
import { getCols, helpers, setTitle } from "../util";

const PlayerStats = ({
    abbrev,
    players,
    playoffs,
    season,
    statType,
    stats,
    userTid,
}) => {
    const label = season !== undefined ? season : "Career Totals";
    setTitle(`Player Stats - ${label}`);

    let tableName = `PlayerStats${statType === "advanced" ? "Adv" : ""}`;
    if (process.env.SPORT === "football") {
        tableName += statType;
    }

    const cols = getCols(
        "Name",
        "Pos",
        "Age",
        "Team",
        ...stats.map(stat => `stat:${stat}`),
    );

    let sortCol = cols.length - 1;
    if (process.env.SPORT === "football") {
        if (statType === "passing") {
            sortCol = 9;
        } else if (statType === "rushing") {
            sortCol = cols.length - 3;
        } else if (statType === "defense") {
            sortCol = 16;
        } else if (statType === "kicking") {
            sortCol = cols.length - 11;
        } else if (statType === "returns") {
            sortCol = 12;
        }
    }

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
            actualAbbrev = p.abbrev;
            actualTid = p.tid;
            if (playoffs === "playoffs") {
                p.stats = p.careerStatsPlayoffs;
            }
        } else {
            actualAbbrev = p.stats.abbrev;
            actualTid = p.stats.tid;
        }

        const statsRow = stats.map(stat =>
            helpers.roundStat(p.stats[stat], stat, statType === "totals"),
        );

        return {
            key: p.pid,
            data: [
                <PlayerNameLabels
                    injury={p.injury}
                    pid={p.pid}
                    skills={p.ratings.skills}
                    watch={p.watch}
                >
                    {p.nameAbbrev}
                </PlayerNameLabels>,
                pos,
                p.age,
                <a href={helpers.leagueUrl(["roster", actualAbbrev, season])}>
                    {actualAbbrev}
                </a>,
                ...statsRow,
            ],
            classNames: {
                "table-danger": p.hof,
                "table-info": actualTid === userTid,
            },
        };
    });

    return (
        <>
            <Dropdown
                view="player_stats"
                fields={[
                    "teamsAndAllWatch",
                    "seasonsAndCareer",
                    "statTypesAdv",
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
                {process.env.SPORT === "basketball" ? (
                    <>
                        <a
                            href={helpers.leagueUrl([
                                "player_shot_locations",
                                season,
                            ])}
                        >
                            Shot Locations
                        </a>{" "}
                        |{" "}
                    </>
                ) : null}
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
                defaultSort={[sortCol, "desc"]}
                name={tableName}
                rows={rows}
                pagination
            />
        </>
    );
};

PlayerStats.propTypes = {
    abbrev: PropTypes.string.isRequired,
    players: PropTypes.arrayOf(PropTypes.object).isRequired,
    playoffs: PropTypes.oneOf(["playoffs", "regularSeason"]).isRequired,
    season: PropTypes.number, // Undefined for career totals
    statType: PropTypes.oneOf([
        "advanced",
        "per36",
        "perGame",
        "totals",
        "passing",
        "rushing",
        "defense",
        "kicking",
        "returns",
    ]).isRequired,
    stats: PropTypes.arrayOf(PropTypes.string).isRequired,
    userTid: PropTypes.number,
};

export default PlayerStats;
