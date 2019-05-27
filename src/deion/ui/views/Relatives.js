import PropTypes from "prop-types";
import React from "react";
import { getCols, helpers, setTitle } from "../util";
import { DataTable, NewWindowLink } from "../components";

const Relatives = ({ pid, players, stats, userTid }) => {
    const target =
        pid !== undefined ? players.find(p => p.pid === pid) : undefined;

    const title =
        target === undefined ? "Relatives" : `${target.name}'s Family`;

    setTitle(title);

    const superCols = [
        {
            title: "",
            colspan: 6,
        },
        {
            title: "Relatives",
            colspan: 4,
        },
        {
            title: "Best Season",
            colspan: 2 + stats.length,
        },
        {
            title: "Career Stats",
            colspan: stats.length,
        },
    ];

    const cols = getCols(
        "Name",
        "Pos",
        "Drafted",
        "Retired",
        "Pick",
        "Peak Ovr",
        ...(target !== undefined ? ["Relation"] : []),
        "Details",
        "# Fathers",
        "# Brothers",
        "# Sons",
        "Year",
        "Team",
        ...stats.map(stat => `stat:${stat}`),
        ...stats.map(stat => `stat:${stat}`),
    );

    const rows = players.map(p => {
        const relationArray = [];
        if (target) {
            if (p.pid === pid) {
                relationArray.push("Self");
            } else {
                const relation = target.relatives.find(
                    rel => rel.pid === p.pid,
                );
                if (relation) {
                    relationArray.push(
                        helpers.upperCaseFirstLetter(relation.type),
                    );
                } else {
                    relationArray.push("???");
                }
            }
        }

        return {
            key: p.pid,
            data: [
                <a href={helpers.leagueUrl(["player", p.pid])}>{p.name}</a>,
                p.ratings[p.ratings.length - 1].pos,
                p.draft.year,
                p.retiredYear === Infinity ? null : p.retiredYear,
                p.draft.round > 0 ? `${p.draft.round}-${p.draft.pick}` : "",
                p.peakOvr,
                ...relationArray,
                p.pid !== pid ? (
                    <a
                        href={helpers.leagueUrl([
                            "frivolities",
                            "relatives",
                            p.pid,
                        ])}
                    >
                        Details
                    </a>
                ) : null,
                p.numFathers,
                p.numBrothers,
                p.numSons,
                p.bestStats.season,
                <a
                    href={helpers.leagueUrl([
                        "roster",
                        p.bestStats.abbrev,
                        p.bestStats.season,
                    ])}
                >
                    {p.bestStats.abbrev}
                </a>,
                ...stats.map(stat =>
                    helpers.roundStat(p.bestStats[stat], stat),
                ),
                ...stats.map(stat =>
                    helpers.roundStat(p.careerStats[stat], stat),
                ),
            ],
            classNames: {
                "table-danger": p.hof,
                "table-success": p.retiredYear === Infinity,
                "table-info": p.statsTids
                    .slice(0, p.statsTids.length - 1)
                    .includes(userTid),
            },
        };
    });

    return (
        <>
            <h1>
                {title} <NewWindowLink />
            </h1>

            {target ? (
                <p>
                    More:{" "}
                    <a href={helpers.leagueUrl(["frivolities", "relatives"])}>
                        All Players With Relatives
                    </a>
                </p>
            ) : (
                <p>
                    These are the players with a relative in the league. Click
                    "Details" for a player to see his relatives.
                </p>
            )}

            <p>
                Players who have played for your team are{" "}
                <span className="text-info">highlighted in blue</span>. Active
                players are{" "}
                <span className="text-success">highlighted in green</span>. Hall
                of Famers are{" "}
                <span className="text-danger">highlighted in red</span>.
            </p>

            <DataTable
                cols={cols}
                defaultSort={[20, "desc"]}
                name="Relatives"
                pagination
                rows={rows}
                superCols={superCols}
            />
        </>
    );
};

Relatives.propTypes = {
    pid: PropTypes.number,
    players: PropTypes.arrayOf(PropTypes.object).isRequired,
    stats: PropTypes.arrayOf(PropTypes.string).isRequired,
    userTid: PropTypes.number.isRequired,
};

export default Relatives;
