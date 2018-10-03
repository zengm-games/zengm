import PropTypes from "prop-types";
import React from "react";
import { DataTable, NewWindowLink, PlayerNameLabels } from "../components";
import { getCols, helpers, setTitle } from "../util";

const awardName = (award, season, teamAbbrevsCache, userTid) => {
    if (!award) {
        // For old seasons with no Finals MVP
        return "N/A";
    }

    const ret = (
        <>
            <PlayerNameLabels pid={award.pid}>{award.name}</PlayerNameLabels> (
            <a
                href={helpers.leagueUrl([
                    "roster",
                    teamAbbrevsCache[award.tid],
                    season,
                ])}
            >
                {teamAbbrevsCache[award.tid]}
            </a>
            )
        </>
    );

    // This is our team.
    if (award.tid === userTid) {
        return {
            classNames: "table-info",
            value: ret,
        };
    }
    return ret;
};

const teamName = (t, season) => {
    if (t) {
        return (
            <>
                <a href={helpers.leagueUrl(["roster", t.abbrev, season])}>
                    {t.region}
                </a>{" "}
                ({t.won}-{t.lost})
            </>
        );
    }

    // This happens if there is missing data, such as from Delete Old Data
    return "N/A";
};

const HistoryAll = ({ seasons, teamAbbrevsCache, userTid }) => {
    setTitle("League History");

    const cols = getCols(
        "",
        "League Champion",
        "Runner Up",
        "Finals MVP",
        "MVP",
        "DPOY",
        "ROY",
    );

    const rows = seasons.map(s => {
        let countText;
        let seasonLink;
        if (s.champ) {
            seasonLink = (
                <a href={helpers.leagueUrl(["history", s.season])}>
                    {s.season}
                </a>
            );
            countText = ` - ${helpers.ordinal(s.champ.count)} title`;
        } else {
            // This happens if there is missing data, such as from Delete Old Data
            seasonLink = String(s.season);
            countText = null;
        }

        let champEl = (
            <span>
                {teamName(s.champ, s.season)}
                {countText}
            </span>
        );
        if (s.champ && s.champ.tid === userTid) {
            champEl = {
                classNames: "table-info",
                value: champEl,
            };
        }

        let runnerUpEl = teamName(s.runnerUp, s.season);
        if (s.runnerUp && s.runnerUp.tid === userTid) {
            runnerUpEl = {
                classNames: "table-info",
                value: runnerUpEl,
            };
        }

        return {
            key: s.season,
            data: [
                seasonLink,
                champEl,
                runnerUpEl,
                awardName(s.finalsMvp, s.season, teamAbbrevsCache, userTid),
                awardName(s.mvp, s.season, teamAbbrevsCache, userTid),
                awardName(s.dpoy, s.season, teamAbbrevsCache, userTid),
                awardName(s.roy, s.season, teamAbbrevsCache, userTid),
            ],
        };
    });

    return (
        <>
            <h1>
                League History <NewWindowLink />
            </h1>
            <p>
                More:{" "}
                <a href={helpers.leagueUrl(["team_records"])}>Team Records</a> |{" "}
                <a href={helpers.leagueUrl(["awards_records"])}>
                    Awards Records
                </a>
            </p>

            <DataTable
                cols={cols}
                defaultSort={[0, "desc"]}
                name="HistoryAll"
                nonfluid
                pagination
                rows={rows}
            />
        </>
    );
};

HistoryAll.propTypes = {
    seasons: PropTypes.arrayOf(PropTypes.object).isRequired,
    teamAbbrevsCache: PropTypes.arrayOf(PropTypes.string).isRequired,
    userTid: PropTypes.number.isRequired,
};

export default HistoryAll;
