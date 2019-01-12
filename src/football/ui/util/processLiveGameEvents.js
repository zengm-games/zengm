import { helpers } from "../../../deion/ui/util";

// Mutates boxScore!!!
const processLiveGameEvents = ({ events, boxScore, overtimes, quarters }) => {
    let stop = false;
    let text;

    while (!stop && events.length > 0) {
        const e = events.shift();

        if (e.quarter !== undefined && !quarters.has(e.quarter)) {
            console.log("new quarter", e.quarter);
            quarters.add(e.quarter);
            console.log("quarters", quarters);
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
        }

        if (e.type === "text") {
            if (e.t === 0 || e.t === 1) {
                text = `${e.time} - ${boxScore.teams[e.t].abbrev} - ${e.text}`;
            } else {
                text = e.text;
            }

            // Show score after scoring plays
            /*            if (text.includes("made")) {
                text += ` (${boxScore.teams[0].pts}-${boxScore.teams[1].pts})`;
            }*/

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
                        p[e.s] += e.amt;
                    }
                }
                boxScore.teams[e.t][e.s] += e.amt;
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
