import PropTypes from "prop-types";
import React from "react";
import { getCols, helpers, setTitle } from "../util";
import { DataTable, NewWindowLink, SafeHtml } from "../components";

const TragicDeaths = ({ players, stats, userTid }) => {
    setTitle("Tragic Deaths");

    const superCols = [
        {
            title: "",
            colspan: 5,
        },
        {
            title: "At Death",
            colspan: 4,
        },
        {
            title: "Last Season",
            colspan: stats.length,
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
        "Pick",
        "Peak Ovr",
        "Ovr",
        "Team",
        "Year",
        "Age",
        ...stats.map(stat => `stat:${stat}`),
        ...stats.map(stat => `stat:${stat}`),
        "Details",
    );

    const rows = players.map(p => {
        const lastRatings = p.ratings[p.ratings.length - 1];
        const lastStats = p.stats[p.stats.length - 1];

        return {
            key: p.pid,
            data: [
                <a href={helpers.leagueUrl(["player", p.pid])}>{p.name}</a>,
                lastRatings.pos,
                p.draft.year,
                p.draft.round > 0 ? `${p.draft.round}-${p.draft.pick}` : "",
                p.peakOvr,
                lastRatings.ovr,
                <a
                    href={helpers.leagueUrl([
                        "roster",
                        p.bestStats.abbrev,
                        p.bestStats.season,
                    ])}
                >
                    {p.bestStats.abbrev}
                </a>,
                p.diedYear,
                p.ageAtDeath,
                ...stats.map(stat =>
                    lastStats ? helpers.roundStat(lastStats[stat], stat) : null,
                ),
                ...stats.map(stat =>
                    helpers.roundStat(p.careerStats[stat], stat),
                ),
                <SafeHtml dirty={p.details} />,
            ],
            classNames: {
                "table-danger": p.hof,
                "table-info": p.statsTids
                    .slice(0, p.statsTids.length - 1)
                    .includes(userTid),
                "table-success":
                    p.statsTids[p.statsTids.length - 1] === userTid,
            },
        };
    });

    return (
        <>
            <h1>
                Tragic Deaths <NewWindowLink />
            </h1>

            <p>
                Players who played for your team are{" "}
                <span className="text-info">highlighted in blue</span>. Players
                who died while on your team are{" "}
                <span className="text-success">highlighted in green</span>. Hall
                of Famers are{" "}
                <span className="text-danger">highlighted in red</span>.
            </p>

            <DataTable
                cols={cols}
                defaultSort={[4, "desc"]}
                name="TragicDeaths"
                pagination
                rows={rows}
                superCols={superCols}
            />
        </>
    );
};

TragicDeaths.propTypes = {
    players: PropTypes.arrayOf(PropTypes.object).isRequired,
    stats: PropTypes.arrayOf(PropTypes.string).isRequired,
    userTid: PropTypes.number.isRequired,
};

export default TragicDeaths;
