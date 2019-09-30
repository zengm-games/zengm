import PropTypes from "prop-types";
import React from "react";
import { DataTable, NewWindowLink } from "../components";
import { getCols, helpers, setTitle } from "../util";

const PlayerName = ({ p }) => {
    if (!p) {
        return "???";
    }

    return <a href={helpers.leagueUrl(["player", p.pid])}>{p.name}</a>;
};
PlayerName.propTypes = {
    p: PropTypes.shape({
        abbrev: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        pid: PropTypes.number.isRequired,
        tid: PropTypes.number.isRequired,
    }),
};

const PlayerTeam = ({ p, season }) => {
    if (!p) {
        return "???";
    }

    return (
        <a href={helpers.leagueUrl(["roster", p.abbrev, season])}>{p.abbrev}</a>
    );
};
PlayerTeam.propTypes = {
    p: PropTypes.shape({
        abbrev: PropTypes.string.isRequired,
    }),
    season: PropTypes.number.isRequired,
};

const ResultText = ({ gid, overtimes, score, season, teamNames }) => {
    if (gid === undefined || overtimes === undefined || score === undefined) {
        return "???";
    }

    const tw = score[0] >= score[1] ? 0 : 1;
    const tl = tw === 0 ? 1 : 0;

    let overtimeText = "";
    if (overtimes === 1) {
        overtimeText = " (OT)";
    } else if (overtimes > 1) {
        overtimeText = ` (${overtimes}OT)`;
    }

    return (
        <>
            <a href={helpers.leagueUrl(["game_log", "special", season, gid])}>
                {teamNames[tw]} {score[tw]}, {teamNames[tl]} {score[tl]}
            </a>
            {overtimeText}
        </>
    );
};
ResultText.propTypes = {
    gid: PropTypes.number,
    overtimes: PropTypes.number,
    score: PropTypes.arrayOf(PropTypes.number),
    season: PropTypes.number.isRequired,
    teamNames: PropTypes.arrayOf(PropTypes.string).isRequired,
};

const AllStarHistory = ({ allAllStars }) => {
    setTitle("All-Star History");

    console.log(allAllStars);
    const cols = getCols(
        "Season",
        "Result",
        "Captain 1",
        "Team",
        "Captain 2",
        "Team",
        "MVP",
        "Team",
    );

    const rows = allAllStars.map(row => {
        return {
            key: row.season,
            data: [
                row.season,
                <ResultText
                    gid={row.gid}
                    overtimes={row.overtimes}
                    score={row.score}
                    season={row.season}
                    teamNames={row.teamNames}
                />,
                <PlayerName p={row.captain1}>
                    {row.captain1 ? row.captain1.name : "???"}
                </PlayerName>,
                <PlayerTeam p={row.captain1} season={row.season}>
                    {row.captain1 ? row.captain1.abbrev : "???"}
                </PlayerTeam>,
                <PlayerName p={row.captain2}>
                    {row.captain2 ? row.captain2.name : "???"}
                </PlayerName>,
                <PlayerTeam p={row.captain2} season={row.season}>
                    {row.captain2 ? row.captain2.abbrev : "???"}
                </PlayerTeam>,
                <PlayerName p={row.mvp}>
                    {row.mvp ? row.mvp.name : "???"}
                </PlayerName>,
                <PlayerTeam p={row.mvp} season={row.season}>
                    {row.mvp ? row.mvp.abbrev : "???"}
                </PlayerTeam>,
            ],
        };
    });

    const pagination = rows.length > 100;

    return (
        <>
            <h1>
                All-Star History <NewWindowLink />
            </h1>
            <DataTable
                cols={cols}
                defaultSort={[0, "desc"]}
                name="AllStarHistory"
                pagination={pagination}
                rows={rows}
            />
        </>
    );
};

AllStarHistory.propTypes = {
    allAllStars: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default AllStarHistory;
