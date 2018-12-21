// @flow

import { helpers } from "../../../../deion/worker/util";
import { PlayType, TeamNum } from "./types";

class PlayByPlayLogger {
    active: boolean;

    playByPlay: any[];

    constructor(active: boolean) {
        this.active = active;
        this.playByPlay = [];
    }

    logEvent(
        type: PlayType,
        {
            lost,
            made,
            names,
            safety,
            t,
            td,
            touchback,
            yds,
        }: {
            lost?: boolean,
            made?: boolean,
            names?: string[],
            safety?: boolean,
            t?: TeamNum,
            td?: boolean,
            touchback?: boolean,
            yds?: number,
        } = {},
    ) {
        if (!this.active) {
            return;
        }

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
        if (!this.active) {
            return;
        }

        this.playByPlay.push({
            type: "stat",
            qtr: this.team[t].stat.ptsQtrs.length - 1,
            t,
            pid,
            s,
            amt,
        });
    }

    getPlayByPlay(boxScore) {
        if (!this.active) {
            return;
        }

        return [
            {
                type: "init",
                boxScore,
            },
        ].concat(this.playByPlay);
    }
}

export default PlayByPlayLogger;
