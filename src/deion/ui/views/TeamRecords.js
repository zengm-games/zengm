import PropTypes from "prop-types";
import React from "react";
import { DataTable, Dropdown, NewWindowLink } from "../components";
import { getCols, helpers, setTitle } from "../util";

const teamLink = t => {
    return (
        <a href={helpers.leagueUrl(["team_history", t.abbrev])}>
            {t.region} {t.name}
        </a>
    );
};

const TeamRecords = ({ byType, categories, seasonCount, teamRecords }) => {
    setTitle("Team Records");

    let displayName;
    if (byType === "conf") {
        displayName = "Conference";
    } else if (byType === "div") {
        displayName = "Division";
    } else {
        displayName = "Team";
    }

    const cols = getCols(
        displayName,
        "W",
        "L",
        "%",
        "Playoffs",
        "Last Playoffs",
        "Finals",
        "Championships",
        "Last Title",
        ...categories.map(category => `count:${category}`),
    );
    // MVP, DPOY, SMOY, ROY
    for (let i = 9; i <= 12; i++) {
        cols[i].sortSequence = ["desc", "asc"];
        cols[i].sortType = "number";
    }

    const rows = teamRecords.map(tr => {
        return {
            key: tr.id,
            data: [
                byType === "team" ? teamLink(tr.team) : tr.team,
                tr.won,
                tr.lost,
                tr.winp,
                tr.playoffAppearances,
                tr.lastPlayoffAppearance,
                tr.finals,
                tr.championships,
                tr.lastChampionship,
                ...categories.map(category => tr[category]),
            ],
        };
    });

    return (
        <>
            <Dropdown
                view="team_records"
                fields={["teamRecordType"]}
                values={[byType]}
            />
            <h1>
                Team Records <NewWindowLink />
            </h1>

            <p>
                More:{" "}
                <a href={helpers.leagueUrl(["history_all"])}>League History</a>{" "}
                |{" "}
                <a href={helpers.leagueUrl(["awards_records"])}>
                    Awards Records
                </a>
            </p>

            <p>Totals over {seasonCount} seasons played.</p>

            <DataTable
                cols={cols}
                defaultSort={[0, "asc"]}
                name="TeamRecords"
                nonfluid
                rows={rows}
            />
        </>
    );
};

TeamRecords.propTypes = {
    byType: PropTypes.oneOf(["conf", "div", "team"]).isRequired,
    categories: PropTypes.arrayOf(PropTypes.string).isRequired,
    seasonCount: PropTypes.number.isRequired,
    teamRecords: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default TeamRecords;
