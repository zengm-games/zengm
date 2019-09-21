import classNames from "classnames";
import PropTypes from "prop-types";
import React from "react";
import { DataTable, NewWindowLink, PlayerNameLabels } from "../components";
import { getCols, helpers, setTitle, toWorker } from "../util";

const PlayersTable = ({ name, players, stats, userTids }) => {
    const showDraftCol = name === "Remaining";

    const colNames = [
        "Name",
        "Team",
        "Age",
        "Ovr",
        ...stats.map(stat => `stat:${stat}`),
    ];
    if (showDraftCol) {
        colNames.unshift("Draft");
    }
    const cols = getCols(...colNames);

    const rows = players.map(p => {
        const data = [
            <PlayerNameLabels
                pid={p.pid}
                injury={p.injury}
                pos={p.ratings.pos}
                skills={p.skills}
                watch={p.watch}
            >
                {p.name}
            </PlayerNameLabels>,
            p.abbrev,
            p.age,
            p.ratings.ovr,
            ...stats.map(stat => helpers.roundStat(p.stats[stat], stat)),
        ];
        if (showDraftCol) {
            data.unshift(
                <button
                    className="btn btn-xs btn-primary"
                    disabled
                    title="Draft player"
                >
                    Draft
                </button>,
            );
        }

        return {
            key: p.pid,
            data,
            classNames: {
                "table-danger": p.hof,
                "table-info": userTids.includes(p.tid),
            },
        };
    });

    return (
        <DataTable
            cols={cols}
            defaultSort={[showDraftCol ? 4 : 3, "desc"]}
            name={`AllStars:${name}`}
            rows={rows}
        />
    );
};

PlayersTable.propTypes = {
    name: PropTypes.string.isRequired,
    players: PropTypes.arrayOf(PropTypes.object).isRequired,
    stats: PropTypes.arrayOf(PropTypes.string).isRequired,
    userTids: PropTypes.arrayOf(PropTypes.number).isRequired,
};

const AllStars = ({
    finalized,
    remaining,
    stats,
    teams,
    teamNames,
    userTids,
}) => {
    setTitle("All-Star Selections");

    console.log("finalized", finalized);
    console.log("teamNames", teamNames);
    console.log("teams", teams);
    console.log("remaining", remaining);

    return (
        <>
            <h1>
                All-Star Selections <NewWindowLink />
            </h1>
            <p>
                The top 24 players in the league play in an All-Star game. If
                any of them are injured, they are still All-Stars, but an
                additional All-Star will be selected as a replacement to play in
                the game.
            </p>
            <p>
                The players are split into two teams, captained by the top two
                players. The teams are filled by a draft. Just for fun, if a
                captain is on your team, you get to draft for him! Otherwise,
                the captains get to choose.
            </p>
            <button
                className="btn btn-lg btn-success mb-3"
                onClick={async () => {
                    await toWorker("allStarDraftStart");
                }}
            >
                Start draft
            </button>
            <div className="row">
                <div className="col-4">
                    <h3>{teamNames[0]}</h3>
                    <PlayersTable
                        name="Team0"
                        players={teams[0]}
                        stats={stats}
                        userTids={userTids}
                    />
                </div>
                <div className="col-4">
                    <h3>{teamNames[1]}</h3>
                    <PlayersTable
                        name="Team1"
                        players={teams[1]}
                        stats={stats}
                        userTids={userTids}
                    />
                </div>
                <div className="col-4">
                    <h3>Remaining All Stars</h3>
                    <PlayersTable
                        name="Remaining"
                        players={remaining}
                        stats={stats}
                        userTids={userTids}
                    />
                </div>
            </div>
        </>
    );
};

AllStars.propTypes = {
    finalized: PropTypes.bool.isRequired,
    remaining: PropTypes.arrayOf(PropTypes.object).isRequired,
    stats: PropTypes.arrayOf(PropTypes.string).isRequired,
    teamNames: PropTypes.arrayOf(PropTypes.string).isRequired,
    teams: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.object)).isRequired,
    userTids: PropTypes.arrayOf(PropTypes.number).isRequired,
};

export default AllStars;
