// @flow
/* eslint no-nested-ternary: "off" */

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
            } else if (type === "overtime") {
                text = "Start of overtime";
            } else if (type === "kickoff") {
                text = `${names[0]} kicks off${
                    touchback
                        ? " for a touchback"
                        : yds < 0
                        ? " into the end zone"
                        : ` to the ${yds} yard line`
                }`;
            } else if (type === "kickoffReturn") {
                text = `${names[0]} returns the kickoff ${yds} yards${
                    td ? " for a touchdown!" : ""
                }`;
            } else if (type === "punt") {
                text = `${names[0]} punts${
                    touchback
                        ? " for a touchback"
                        : yds < 0
                        ? " into the end zone"
                        : ` to the ${yds} yard line`
                }`;
            } else if (type === "puntReturn") {
                text = `${names[0]} returns the punt ${yds} yards${
                    td ? " for a touchdown!" : ""
                }`;
            } else if (type === "extraPoint") {
                text = `${names[0]} ${
                    made ? "makes" : "misses"
                } the extra point`;
            } else if (type === "fieldGoal") {
                text = `${names[0]} ${
                    made ? "makes" : "misses"
                } a ${yds} yard field goal`;
            } else if (type === "fumble") {
                text = `${names[0]} fumbles the ball!`;
            } else if (type === "fumbleRecovery") {
                if (safety || touchback) {
                    text = `${
                        names[0]
                    } recovers the ball in the endzone, resulting in a ${
                        safety ? "safety!" : "touchback"
                    }`;
                } else if (lost) {
                    text = `${
                        names[0]
                    } recovers the ball for the defense and returned it ${yds} yards${
                        td ? " for a touchdown!" : ""
                    }`;
                } else {
                    text = `${names[0]} recovers the ball for the offense${
                        td
                            ? " and carries it into the endzone for a touchdown!"
                            : ""
                    }`;
                }
            } else if (type === "interception") {
                text = `${
                    names[0]
                } intercepts the pass and returns it ${yds} yards${
                    td ? " for a touchdown!" : ""
                }`;
            } else if (type === "sack") {
                text = `${names[0]} is sacked by ${names[0]} for a ${
                    safety ? "safety!" : `${yds} yard loss`
                }`;
            } else if (type === "dropback") {
                text = `${names[0]} drops back to pass`;
            } else if (type === "passComplete") {
                if (safety) {
                    text = `${names[0]} completes a pass to ${
                        names[1]
                    } but he is tacked in the endzone for a safety!`;
                }
                text = `${names[0]} completes a pass to ${
                    names[1]
                } for ${yds} yards${td ? " and a touchdown!" : ""}`;
            } else if (type === "passIncomplete") {
                text = `Incomplete pass to ${names[1]} ${
                    yds > 1 ? `${yds} yards down the field` : "in the backfield"
                }`;
            } else if (type === "handoff") {
                text = `${names[0]} hands the ball off to ${names[1]}`;
            } else if (type === "passComplete") {
                if (safety) {
                    text = `${names[0]} is tacked in the endzone for a safety!`;
                }
                text = `${names[0]} rushes for ${yds} yards${
                    td ? " and a touchdown!" : ""
                }`;
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
                throw new Error(`No text for "${type}"`);
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
