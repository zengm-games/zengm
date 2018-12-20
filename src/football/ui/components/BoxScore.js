import PropTypes from "prop-types";
import React from "react";
import ResponsiveTableWrapper from "../../../deion/ui/components/ResponsiveTableWrapper";
import { getCols } from "../../../deion/ui/util";
import processStats from "../../worker/core/player/processStats";

const statsByType = {
    passing: [
        "pssCmp",
        "pss",
        "cmpPct",
        "pssYds",
        "pssTD",
        "pssInt",
        "pssSk",
        "pssSkYds",
        "qbRat",
        "fmbLost",
    ],
    rushing: ["rus", "rusYds", "rusYdsPerAtt", "rusLng", "rusTD", "fmbLost"],
    receiving: ["tgt", "rec", "recYds", "recYdsPerAtt", "recTD", "recLng"],
    kicking: [
        "fg",
        "fga",
        "fgPct",
        "fgLng",
        "xp",
        "xpa",
        "xpPct",
        "kickingPts",
    ],
    punting: ["pnt", "pntYdsPerAtt", "pntIn20", "pntTB", "pntLng", "pntBlk"],
    returns: [
        "kr",
        "krYds",
        "krYdsPerAtt",
        "krLng",
        "krTD",
        "pr",
        "prYds",
        "prYdsPerAtt",
        "prLng",
        "prTD",
    ],
    defense: [],
};

const sortsByType = {
    passing: ["pssYds"],
    rushing: ["rusYds"],
    receiving: ["recYds"],
    kicking: ["kickingPts"],
    punting: ["pnt"],
    returns: ["krYds", "prYds"],
    defense: [],
};

const StatsTable = ({ Row, boxScore, type }) => {
    const stats = statsByType[type];
    const cols = getCols(...stats.map(stat => `stat:${stat}`));
    const sorts = sortsByType[type];

    return (
        <>
            {boxScore.teams.map(t => (
                <div key={t.abbrev} className="mb-3">
                    <ResponsiveTableWrapper>
                        <table className="table table-striped table-bordered table-sm table-hover">
                            <thead>
                                <tr>
                                    <th colSpan="2">
                                        {t.region} {t.name}
                                    </th>
                                    {cols.map(({ desc, title, width }, i) => {
                                        return (
                                            <th
                                                key={i}
                                                title={desc}
                                                width={width}
                                            >
                                                {title}
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody>
                                {t.players
                                    .map(p => {
                                        p.processed = processStats(p, stats);
                                        return p;
                                    })
                                    .filter(p => {
                                        // Filter based on if player has any stats
                                        for (const stat of stats) {
                                            if (
                                                p.processed[stat] !==
                                                    undefined &&
                                                p.processed[stat] !== 0 &&
                                                stat !== "fmbLost"
                                            ) {
                                                return true;
                                            }
                                        }
                                        return false;
                                    })
                                    .sort((a, b) => {
                                        for (const sort of sorts) {
                                            if (
                                                b.processed[sort] !==
                                                a.processed[sort]
                                            ) {
                                                return (
                                                    b.processed[sort] -
                                                    a.processed[sort]
                                                );
                                            }
                                        }
                                        return 0;
                                    })
                                    .map((p, i) => {
                                        return (
                                            <Row
                                                key={p.pid}
                                                i={i}
                                                p={p}
                                                stats={stats}
                                            />
                                        );
                                    })}
                            </tbody>
                        </table>
                    </ResponsiveTableWrapper>
                </div>
            ))}
        </>
    );
};

const BoxScore = ({ boxScore, Row }) => {
    return (
        <div className="mb-3">
            <h3>Scoring Summary</h3>
            <p>...</p>
            {[
                "Passing",
                "Rushing",
                "Receiving",
                "Kicking",
                "Punting",
                "Returns",
                "Defense",
            ].map(title => (
                <React.Fragment key={title}>
                    <h3>{title}</h3>
                    <StatsTable
                        Row={Row}
                        boxScore={boxScore}
                        type={title.toLowerCase()}
                    />
                </React.Fragment>
            ))}
        </div>
    );
};

BoxScore.propTypes = {
    boxScore: PropTypes.object.isRequired,
    Row: PropTypes.any,
};

export default BoxScore;
