import PropTypes from "prop-types";
import React from "react";
import _ from "underscore";
import { g, helpers } from "../../common";
import { getCols, setTitle } from "../util";
import { DataTable, Dropdown, JumpTo, NewWindowLink } from "../components";

const regOrOpp = (teamOpponent, key: string) => {
    if (teamOpponent === "opponent") {
        return `opp${key[0].toUpperCase()}${key.slice(1)}`;
    }
    return key;
};

const TeamStats = ({ playoffs, season, stats, teamOpponent, teams }) => {
    setTitle(`Team Stats - ${season}`);

    const cols =
        teamOpponent !== "advanced"
            ? getCols(
                  "Team",
                  "G",
                  "W",
                  "L",
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
                  "MOV",
              )
            : getCols("Team", "W", "L", "PW", "PL", "MOV", "ORtg", "DRtg", "NRtg", "Pace", "3PAr", "FTr");

    const teamCount = teams.length;
    const rows = teams.map(t => {
        const statTypeColumns =
            teamOpponent !== "advanced"
                ? [
                      "fg",
                      "fga",
                      "fgp",
                      "tp",
                      "tpa",
                      "tpp",
                      "ft",
                      "fta",
                      "ftp",
                      "orb",
                      "drb",
                      "trb",
                      "ast",
                      "tov",
                      "stl",
                      "blk",
                      "pf",
                      "pts",
                      "mov",
                  ].map(key => regOrOpp(teamOpponent, key))
                : ["pw", "pl", "mov", "ortg", "drtg", "nrtg", "pace", "tpar", "ftr"];
        const otherStatColumns = ["won", "lost"];

        // Create the cells for this row.
        const data = {
            abbrev: (
                <a href={helpers.leagueUrl(["roster", t.abbrev, season])}>
                    {t.abbrev}
                </a>
            ),
            won: t.seasonAttrs.won,
            lost: t.seasonAttrs.lost,
        };
        if (teamOpponent !== "advanced") {
            data.gp = t.stats.gp;
        }

        for (const statType of statTypeColumns) {
            const value = t.stats.hasOwnProperty(statType)
                ? t.stats[statType]
                : t.seasonAttrs[statType];
            data[statType] = value.toFixed(1);
        }

        const plusMinusCols = [regOrOpp(teamOpponent, "mov"), "nrtg"];
        for (const plusMinusCol of plusMinusCols) {
            if (data.hasOwnProperty(plusMinusCol)) {
                data[plusMinusCol] = (
                    <span
                        className={
                            t.stats[plusMinusCol] > 0 ? "text-success" : "text-danger"
                        }
                    >
                        {t.stats[plusMinusCol].toFixed(1)}
                    </span>
                );
            }
        }

        // This is our team.
        if (g.userTid === t.tid) {
            // Color stat values accordingly.
            for (const [statType, value] of _.pairs(data)) {
                if (
                    !statTypeColumns.includes(statType) &&
                    !otherStatColumns.includes(statType)
                ) {
                    continue;
                }

                // Determine our team's percentile for this stat type. Closer to the start is better.
                const statTypeValue = t.stats.hasOwnProperty(statType)
                    ? t.stats[statType]
                    : t.seasonAttrs[statType];
                const percentile =
                    1 -
                    stats[statType].indexOf(statTypeValue) / (teamCount - 1);

                let className;
                if (percentile >= 2 / 3) {
                    className = "success";
                } else if (percentile >= 1 / 3) {
                    className = "warning";
                } else {
                    className = "danger";
                }

                data[statType] = {
                    classNames: className,
                    value,
                };
            }

            return {
                key: t.tid,
                data: _.values(data),
            };
        }

        return {
            key: t.tid,
            data: _.values(data),
        };
    });

    function legendSquare(className) {
        const styles = {
            bottom: "-2.5px",
            display: "inline-block",
            height: "15px",
            margin: "0 2.5px 0 10px",
            position: "relative",
            width: "15px",
        };

        return <span className={`bg-${className}`} style={styles} />;
    }

    return (
        <div>
            <Dropdown
                view="team_stats"
                fields={["seasons", "teamOpponent", "playoffs"]}
                values={[season, teamOpponent, playoffs]}
            />
            <JumpTo season={season} />
            <h1>
                Team Stats <NewWindowLink />
            </h1>

            <div className="row">
                <div className="col-sm-4">
                    More:{" "}
                    <a
                        href={helpers.leagueUrl([
                            "team_shot_locations",
                            season,
                        ])}
                    >
                        Shot Locations
                    </a>{" "}
                    |{" "}
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
        </div>
    );
};

TeamStats.propTypes = {
    playoffs: PropTypes.oneOf(["playoffs", "regularSeason"]).isRequired,
    season: PropTypes.number.isRequired,
    stats: PropTypes.object.isRequired,
    teamOpponent: PropTypes.oneOf(["advanced", "opponent", "team"]).isRequired,
    teams: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default TeamStats;
