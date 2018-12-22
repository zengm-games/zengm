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
    defense: [
        "defTckSolo",
        "defTckAst",
        "defTck",
        "defTckLoss",
        "defSk",
        "defSft",
        "defPssDef",
        "defInt",
        "defIntYds",
        "defIntTD",
        "defIntLng",
        "defFmbFrc",
        "defFmbRec",
        "defFmbYds",
        "defFmbTD",
    ],
};

const sortsByType = {
    passing: ["pssYds"],
    rushing: ["rusYds"],
    receiving: ["recYds"],
    kicking: ["kickingPts"],
    punting: ["pnt"],
    returns: ["krYds", "prYds"],
    defense: ["defTck"],
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
                                        return {
                                            ...p,
                                            processed: processStats(p, stats),
                                        };
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
                                    .map((p, i) => (
                                        <Row
                                            key={p.pid}
                                            i={i}
                                            p={p}
                                            stats={stats}
                                        />
                                    ))}
                            </tbody>
                        </table>
                    </ResponsiveTableWrapper>
                </div>
            ))}
        </>
    );
};

const quarters = {
    Q1: "1st Quarter",
    Q2: "2nd Quarter",
    Q3: "3rd Quarter",
    Q4: "4th Quarter",
    OT: "Overtime",
};

// Condenses TD + XP/2P into one event rather than two
const processEvents = events => {
    const processedEvents = [];
    const score = [0, 0];

    for (const event of events) {
        let scoreType = null;
        if (event.text.includes("extra point")) {
            scoreType = "XP";
            if (event.text.includes("makes")) {
                score[event.t] += 1;
            }
        } else if (event.text.includes("field goal")) {
            scoreType = "FG";
            if (event.text.includes("makes")) {
                score[event.t] += 3;
            }
        } else if (event.text.includes("touchdown")) {
            scoreType = "TD";
            score[event.t] += 6;
        } else if (event.text.toLowerCase().includes("two")) {
            scoreType = "2P";
            if (!event.text.includes("failed")) {
                score[event.t] += 2;
            }
        } else if (event.text.includes("safety")) {
            scoreType = "SF";
            score[event.t] += 2;
        }

        const prevEvent = processedEvents[processedEvents.length - 1];

        if (prevEvent && scoreType === "XP") {
            prevEvent.score = score.slice();
            prevEvent.text += ` (${event.text})`;
        } else if (prevEvent && scoreType === "2P" && event.t === prevEvent.t) {
            prevEvent.score = score.slice();
            prevEvent.text += ` (${event.text})`;
        } else {
            processedEvents.push({
                t: event.t,
                quarter: event.quarter,
                time: event.time,
                text: event.text,
                score: score.slice(),
                scoreType,
            });
        }
    }

    return processedEvents;
};

const ScoringSummary = ({ events, teams }) => {
    let prevQuarter;

    const processedEvents = processEvents(events);

    return (
        <table className="table table-sm border-bottom">
            <tbody>
                {processedEvents.map((event, i) => {
                    let quarterHeader = null;
                    if (event.quarter !== prevQuarter) {
                        prevQuarter = event.quarter;
                        quarterHeader = (
                            <tr>
                                <td className="text-muted" colSpan="5">
                                    {quarters[event.quarter]}
                                </td>
                            </tr>
                        );
                    }

                    return (
                        <React.Fragment key={i}>
                            {quarterHeader}
                            <tr>
                                <td>{teams[event.t].abbrev}</td>
                                <td>{event.scoreType}</td>
                                <td>
                                    {event.score[0]}-{event.score[1]}
                                </td>
                                <td>{event.time}</td>
                                <td>{event.text}</td>
                            </tr>
                        </React.Fragment>
                    );
                })}
            </tbody>
        </table>
    );
};

const BoxScore = ({ boxScore, Row }) => {
    console.log("boxScore", boxScore);
    return (
        <div className="mb-3">
            <h3>Scoring Summary</h3>
            <ScoringSummary
                events={boxScore.scoringSummary}
                teams={boxScore.teams}
            />
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
