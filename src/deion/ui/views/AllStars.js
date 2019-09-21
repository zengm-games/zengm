import classNames from "classnames";
import PropTypes from "prop-types";
import React from "react";
import { DataTable, NewWindowLink, PlayerNameLabels } from "../components";
import { getCols, helpers, setTitle } from "../util";

const PlayersTable = ({ name, players, stats }) => {
    const cols = getCols(
        "Name",
        "Team",
        "Age",
        "Ovr",
        ...stats.map(stat => `stat:${stat}`),
    );

    const rows = players.map(p => {
        return {
            key: p.pid,
            data: [
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
            ],
        };
    });

    return (
        <DataTable
            cols={cols}
            defaultSort={[3, "desc"]}
            name={`AllStars:${name}`}
            rows={rows}
        />
    );
};

PlayersTable.propTypes = {
    name: PropTypes.string.isRequired,
    players: PropTypes.arrayOf(PropTypes.object).isRequired,
    stats: PropTypes.arrayOf(PropTypes.string).isRequired,
};

const AllStars = ({ finalized, remaining, stats, teams, teamNames }) => {
    setTitle("All Stars");

    console.log("finalized", finalized);
    console.log("teamNames", teamNames);
    console.log("teams", teams);
    console.log("remaining", remaining);

    return (
        <>
            <h1>
                All Stars <NewWindowLink />
            </h1>
            <div className="row">
                <div className="col-4">
                    <h3>{teamNames[0]}</h3>
                    <PlayersTable
                        name="Team0"
                        players={teams[0]}
                        stats={stats}
                    />
                </div>
                <div className="col-4">
                    <h3>{teamNames[1]}</h3>
                    <PlayersTable
                        name="Team1"
                        players={teams[1]}
                        stats={stats}
                    />
                </div>
                <div className="col-4">
                    <h3>Remaining All Stars</h3>
                    <PlayersTable
                        name="Remaining"
                        players={remaining}
                        stats={stats}
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
};

export default AllStars;
