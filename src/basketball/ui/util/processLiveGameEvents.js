import { helpers } from "../../../deion/ui/util";

// Mutates boxScore!!!
const processLiveGameEvents = ({ events, boxScore, overtimes, quarters }) => {
    let stop = false;
    let text;
    while (!stop && events.length > 0) {
        const e = events.shift();

        if (e.type === "text") {
            if (e.t === 0 || e.t === 1) {
                text = `${e.time} - ${boxScore.teams[e.t].abbrev} - ${e.text}`;
            } else {
                text = e.text;
            }

            // Show score after scoring plays
            if (text.includes("made")) {
                text += ` (${boxScore.teams[0].pts}-${boxScore.teams[1].pts})`;
            }

            boxScore.time = e.time;

            stop = true;
        } else if (e.type === "sub") {
            for (let i = 0; i < boxScore.teams[e.t].players.length; i++) {
                if (boxScore.teams[e.t].players[i].pid === e.on) {
                    boxScore.teams[e.t].players[i].inGame = true;
                } else if (boxScore.teams[e.t].players[i].pid === e.off) {
                    boxScore.teams[e.t].players[i].inGame = false;
                }
            }
        } else if (e.type === "stat") {
            // Quarter-by-quarter score
            if (e.s === "pts") {
                const ptsQtrs = boxScore.teams[e.t].ptsQtrs;
                if (ptsQtrs.length <= e.qtr) {
                    // Must be overtime! This updates ptsQtrs too.
                    boxScore.teams[0].ptsQtrs.push(0);
                    boxScore.teams[1].ptsQtrs.push(0);

                    if (ptsQtrs.length > 4) {
                        overtimes += 1;
                        if (overtimes === 1) {
                            boxScore.overtime = " (OT)";
                        } else if (overtimes > 1) {
                            boxScore.overtime = ` (${overtimes}OT)`;
                        }
                        boxScore.quarter = `${helpers.ordinal(
                            overtimes,
                        )} overtime`;
                    } else {
                        boxScore.quarter = `${helpers.ordinal(
                            ptsQtrs.length,
                        )} quarter`;
                    }
                }
                ptsQtrs[e.qtr] += e.amt;
                boxScore.teams[e.t].ptsQtrs = ptsQtrs;
            }

            // Everything else
            if (
                e.s === "min" ||
                e.s === "fg" ||
                e.s === "fga" ||
                e.s === "tp" ||
                e.s === "tpa" ||
                e.s === "ft" ||
                e.s === "fta" ||
                e.s === "orb" ||
                e.s === "drb" ||
                e.s === "ast" ||
                e.s === "tov" ||
                e.s === "stl" ||
                e.s === "blk" ||
                e.s === "ba" ||
                e.s === "pf" ||
                e.s === "pts"
            ) {
                boxScore.teams[e.t].players[e.p][e.s] += e.amt;
                boxScore.teams[e.t][e.s] += e.amt;

                if (e.s === "pts") {
                    for (let j = 0; j < 2; j++) {
                        for (
                            let k = 0;
                            k < boxScore.teams[j].players.length;
                            k++
                        ) {
                            if (boxScore.teams[j].players[k].inGame) {
                                boxScore.teams[j].players[k].pm +=
                                    e.t === j ? e.amt : -e.amt;
                            }
                        }
                    }
                }
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
