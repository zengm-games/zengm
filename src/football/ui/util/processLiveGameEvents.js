import { helpers } from "../../../deion/ui/util";

// For strings of a format like 1:23 (times), which is greater? 1 for first, -1 for second, 0 for tie
const cmpTime = (t1, t2) => {
    const [min1, sec1] = t1.split(":").map(x => parseInt(x, 10));
    const [min2, sec2] = t2.split(":").map(x => parseInt(x, 10));

    if (min1 > min2) {
        return 1;
    }
    if (min1 < min2) {
        return -1;
    }
    if (sec1 > sec2) {
        return 1;
    }
    if (sec1 < sec2) {
        return -1;
    }
    return 0;
};

// Mutates boxScore!!!
const processLiveGameEvents = ({ events, boxScore, overtimes, quarters }) => {
    let stop = false;
    let text;

    while (!stop && events.length > 0) {
        const e = events.shift();

        if (e.quarter !== undefined && !quarters.includes(e.quarter)) {
            quarters.push(e.quarter);
            boxScore.teams[0].ptsQtrs.push(0);
            boxScore.teams[1].ptsQtrs.push(0);

            const ptsQtrs = boxScore.teams[0].ptsQtrs;
            if (ptsQtrs.length > 4) {
                overtimes += 1;
                if (overtimes === 1) {
                    boxScore.overtime = " (OT)";
                } else if (overtimes > 1) {
                    boxScore.overtime = ` (${overtimes}OT)`;
                }
                boxScore.quarter = `${helpers.ordinal(overtimes)} overtime`;
            } else {
                boxScore.quarter = `${helpers.ordinal(ptsQtrs.length)} quarter`;
            }

            boxScore.time = e.time;
        }

        if (e.type === "text") {
            text = e.text;
            stop = true;
        } else if (e.type === "clock") {
            if (e.awaitingKickoff) {
                text = `${e.time} - ${boxScore.teams[e.t].abbrev} kicking off`;
            } else {
                let fieldPos = "";
                if (e.scrimmage === 50) {
                    fieldPos = "50 yd line";
                } else if (e.scrimmage > 50) {
                    fieldPos = `opp ${100 - e.scrimmage}`;
                } else {
                    fieldPos = `own ${e.scrimmage}`;
                }

                text = `${e.time} - ${
                    boxScore.teams[e.t].abbrev
                } ball, ${helpers.ordinal(e.down)} & ${e.toGo}, ${fieldPos}`;
            }

            boxScore.time = e.time;
            stop = true;
        } else if (e.type === "stat") {
            // Quarter-by-quarter score
            if (e.s === "pts") {
                const ptsQtrs = boxScore.teams[e.t].ptsQtrs;
                ptsQtrs[ptsQtrs.length - 1] += e.amt;
                boxScore.teams[e.t].ptsQtrs = ptsQtrs;
            }

            // Everything else
            if (boxScore.teams[e.t].hasOwnProperty(e.s) && e.s !== "min") {
                if (e.pid !== undefined) {
                    const p = boxScore.teams[e.t].players.find(
                        p2 => p2.pid === e.pid,
                    );
                    if (p === undefined) {
                        console.log("Can't find player", e);
                    }
                    if (p) {
                        if (e.s.endsWith("Lng")) {
                            if (e.amt > p[e.s]) {
                                p[e.s] = e.amt;
                            }
                        } else {
                            p[e.s] += e.amt;
                        }
                    }
                }
                boxScore.teams[e.t][e.s] += e.amt;
            }
        }
    }

    //  Handle filtering of scoringSummary
    if (boxScore.scoringSummary && boxScore.time !== undefined) {
        for (const event of boxScore.scoringSummary) {
            if (event.time === undefined) {
                continue;
            }

            if (event.hide === false) {
                // Already past, no need to check again
                continue;
            }

            if (!quarters.includes(event.quarter)) {
                // Future quarters
                event.hide = true;
            } else if (event.quarter !== quarters[quarters.length - 1]) {
                // Past quarters
                event.hide = false;
            } else {
                // Current quarter
                event.hide = cmpTime(event.time, boxScore.time) === -1;
            }
        }
    }

    return {
        overtimes,
        quarters,
        text,
    };
};

export default processLiveGameEvents;
