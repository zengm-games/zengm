import PropTypes from "prop-types";
import React from "react";
import { getCols, helpers, prefixStatOpp, setTitle } from "../util";
import { DataTable, Dropdown, JumpTo, NewWindowLink } from "../components";

const legendSquare = className => {
    return <span className={`table-${className} legend-square ml-3`} />;
};

const TeamStats = ({
    allStats,
    playoffs,
    season,
    stats,
    teamOpponent,
    teams,
    ties,
    userTid,
}) => {
    setTitle(`Team Stats - ${season}`);

    const basicColNames = ["Team", "stat:gp", "W", "L"];
    if (ties) {
        basicColNames.push("T");
    }

    const cols = getCols(
        ...basicColNames,
        ...stats.map(stat => {
            if (stat.startsWith("opp")) {
                return `stat:${stat.charAt(3).toLowerCase()}${stat.slice(4)}`;
            }
            return `stat:${stat}`;
        }),
    );

    const teamCount = teams.length;
    const rows = teams.map(t => {
        const otherStatColumns = ["won", "lost"];
        if (ties) {
            otherStatColumns.push("tied");
        }

        // Create the cells for this row.
        const data = {
            abbrev: (
                <a href={helpers.leagueUrl(["roster", t.abbrev, season])}>
                    {t.abbrev}
                </a>
            ),
            gp: t.stats.gp,
            won: t.seasonAttrs.won,
            lost: t.seasonAttrs.lost,
        };

        if (ties) {
            data.tied = t.seasonAttrs.tied;
        }

        for (const stat of stats) {
            const value = t.stats.hasOwnProperty(stat)
                ? t.stats[stat]
                : t.seasonAttrs[stat];
            data[stat] = helpers.roundStat(value, stat);
        }

        if (process.env.SPORT === "basketball") {
            const plusMinusCols = [prefixStatOpp(teamOpponent, "mov"), "nrtg"];
            for (const plusMinusCol of plusMinusCols) {
                if (data.hasOwnProperty(plusMinusCol)) {
                    data[plusMinusCol] = (
                        <span
                            className={
                                t.stats[plusMinusCol] > 0
                                    ? "text-success"
                                    : "text-danger"
                            }
                        >
                            {t.stats[plusMinusCol].toFixed(1)}
                        </span>
                    );
                }
            }
        }

        // This is our team.
        if (userTid === t.tid) {
            // Color stat values accordingly.
            for (const [statType, value] of Object.entries(data)) {
                if (
                    (!stats.includes(statType) &&
                        !otherStatColumns.includes(statType)) ||
                    !allStats[statType]
                ) {
                    continue;
                }

                // Determine our team's percentile for this stat type. Closer to the start is better.
                const statTypeValue = t.stats.hasOwnProperty(statType)
                    ? t.stats[statType]
                    : t.seasonAttrs[statType];
                const percentile =
                    1 -
                    allStats[statType].indexOf(statTypeValue) / (teamCount - 1);

                let className;
                if (percentile >= 2 / 3) {
                    className = "table-success";
                } else if (percentile >= 1 / 3) {
                    className = "table-warning";
                } else {
                    className = "table-danger";
                }

                data[statType] = {
                    classNames: className,
                    value,
                };
            }

            return {
                key: t.tid,
                data: Object.values(data),
            };
        }

        return {
            key: t.tid,
            data: Object.values(data),
        };
    });

    return (
        <>
            <Dropdown
                view="team_stats"
                fields={["seasons", "teamOpponentAdvanced", "playoffs"]}
                values={[season, teamOpponent, playoffs]}
            />
            <JumpTo season={season} />
            <h1>
                Team Stats <NewWindowLink />
            </h1>

            <div className="row">
                <div className="col-sm-4">
                    More:{" "}
                    {process.env.SPORT === "basketball" ? (
                        <>
                            <a
                                href={helpers.leagueUrl([
                                    "team_shot_locations",
                                    season,
                                ])}
                            >
                                Shot Locations
                            </a>{" "}
                            |{" "}
                        </>
                    ) : null}
                    <a href={helpers.leagueUrl(["team_stat_dists", season])}>
                        Stat Distributions
                    </a>
                </div>
                <div className="col-sm-8 text-right">
                    <p>
                        For a statistical category, among all teams, your team
                        is in the...
                    </p>

                    <p>
                        {legendSquare("success")} <strong>Top third</strong>
                        {legendSquare("warning")} <strong>Middle third</strong>
                        {legendSquare("danger")} <strong>Bottom third</strong>
                    </p>
                </div>
            </div>

            <DataTable
                cols={cols}
                defaultSort={[2, "desc"]}
                name={`TeamStats${teamOpponent === "advanced" ? "Adv" : ""}`}
                rows={rows}
            />
        </>
    );
};

TeamStats.propTypes = {
    allStats: PropTypes.object.isRequired,
    playoffs: PropTypes.oneOf(["playoffs", "regularSeason"]).isRequired,
    season: PropTypes.number.isRequired,
    stats: PropTypes.arrayOf(PropTypes.string).isRequired,
    teamOpponent: PropTypes.oneOf(["advanced", "opponent", "team"]).isRequired,
    teams: PropTypes.arrayOf(PropTypes.object).isRequired,
    ties: PropTypes.bool.isRequired,
    userTid: PropTypes.number.isRequired,
};

export default TeamStats;
