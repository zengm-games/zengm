// @flow

import { helpers } from "../../../../deion/worker/util";
import { PlayType, TeamNum } from "./types";

class PlayByPlayLogger {
    constructor() {
        this.playByPlay = [];
    }

    logEvent(
        type: PlayType,
        {
            names,
            t,
            td,
            yds,
        }: {
            names?: string[],
            t?: TeamNum,
            td?: boolean,
            yds?: number,
        } = {},
    ) {
        let text;
        if (this.playByPlay !== undefined) {
            if (type === "injury") {
                text = `${names[0]} was injured!`;
            } else if (type === "quarter") {
                text = `Start of ${helpers.ordinal(
                    this.team[0].stat.ptsQtrs.length,
                )} quarter`;
            } else if (type === "run") {
                text = `${names[0]} rushed for ${yds} yds${
                    td ? " and a touchdown!" : ""
                }`;
            } else if (type === "overtime") {
                text = "Start of overtime";
            }

            if (text) {
                let sec = Math.floor((this.t % 1) * 60);
                if (sec < 10) {
                    sec = `0${sec}`;
                }
                this.playByPlay.push({
                    type: "text",
                    text,
                    t,
                    time: `${Math.floor(this.t)}:${sec}`,
                });
            } else {
                throw new Error(`No text for ${type}`);
            }
        }
    }

    logStat(qtr: number, t: number, pid: number, s: string, amt: number) {
        this.playByPlay.push({
            type: "stat",
            qtr: this.team[t].stat.ptsQtrs.length - 1,
            t,
            pid,
            s,
            amt,
        });
    }

    getAll(boxScore) {
        return [
            {
                type: "init",
                boxScore,
            },
        ].concat(this.playByPlay);
    }
}

export default PlayByPlayLogger;
