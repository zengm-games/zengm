import PropTypes from "prop-types";
import React from "react";
import {
    DataTable,
    Dropdown,
    JumpTo,
    NewWindowLink,
    PlayerNameLabels,
} from "../../../deion/ui/components";
import { getCols, helpers, setTitle } from "../../../deion/ui/util";

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

    const cols = getCols(
        "Name",
        "Pos",
        "Age",
        "Team",
        ...stats.map(stat => `stat:${stat}`),
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
            actualAbbrev = p.abbrev;
            actualTid = p.tid;
            if (playoffs === "playoffs") {
                p.stats = p.careerStatsPlayoffs;
            }
        } else {
            actualAbbrev = p.stats.abbrev;
            actualTid = p.stats.tid;
        }

        const roundOverrides =
            process.env.SPORT === "basketball"
                ? {
                      gp: "none",
                      gs: "none",
                      fgp: "oneDecimalPlace",
                      tpp: "oneDecimalPlace",
                      ftp: "oneDecimalPlace",
                      ws48: "roundWinp",
                      pm: "plusMinus",
                  }
                : {};

        const statsRow = stats.map(stat => {
            if (roundOverrides[stat] === "none") {
                return p.stats[stat];
            }
            if (roundOverrides[stat] === "oneDecimalPlace") {
                return p.stats[stat].toFixed(1);
            }
            if (roundOverrides[stat] === "roundWinp") {
                return helpers.roundWinp(p.stats[stat]);
            }
            if (roundOverrides[stat] === "plusMinus") {
                return helpers.plusMinus(p.stats[stat], d);
            }
            return p.stats[stat].toFixed(d);
        });

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
                defaultSort={[cols.length - 1, "desc"]}
                name={`PlayerStats${statType === "advanced" ? "Adv" : ""}`}
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
    statType: PropTypes.oneOf(["advanced", "per36", "perGame", "totals"])
        .isRequired,
    stats: PropTypes.arrayOf(PropTypes.string).isRequired,
    userTid: PropTypes.number,
};

export default PlayerStats;
