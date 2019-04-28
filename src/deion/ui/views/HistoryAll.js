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
            <PlayerNameLabels pid={award.pid} pos={award.pos}>
                {award.name}
            </PlayerNameLabels>{" "}
            (
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

const teamName = (t, season, ties) => {
    if (t) {
        return (
            <>
                <a href={helpers.leagueUrl(["roster", t.abbrev, season])}>
                    {t.region}
                </a>{" "}
                ({t.won}-{t.lost}
                {ties ? <>-{t.tied}</> : null})
            </>
        );
    }

    // This happens if there is missing data, such as from Delete Old Data
    return "N/A";
};

const HistoryAll = ({ awards, seasons, teamAbbrevsCache, ties, userTid }) => {
    setTitle("League History");

    const cols = getCols(
        "",
        "League Champion",
        "Runner Up",
        ...awards.map(award => `award:${award}`),
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
            <>
                {teamName(s.champ, s.season, ties)}
                {countText}
            </>
        );
        if (s.champ && s.champ.tid === userTid) {
            champEl = {
                classNames: "table-info",
                value: champEl,
            };
        }

        let runnerUpEl = teamName(s.runnerUp, s.season, ties);
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
                ...awards.map(award =>
                    awardName(s[award], s.season, teamAbbrevsCache, userTid),
                ),
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
                pagination
                rows={rows}
            />
        </>
    );
};

HistoryAll.propTypes = {
    awards: PropTypes.arrayOf(PropTypes.string).isRequired,
    seasons: PropTypes.arrayOf(PropTypes.object).isRequired,
    teamAbbrevsCache: PropTypes.arrayOf(PropTypes.string).isRequired,
    ties: PropTypes.bool.isRequired,
    userTid: PropTypes.number.isRequired,
};

export default HistoryAll;
