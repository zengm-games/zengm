import { getPeriodName } from "../../../common";
import { g, helpers } from "../../util";
import type { PlayType, TeamNum } from "./types"; // Convert clock in minutes to min:sec, like 1.5 -> 1:30

const formatClock = (clock: number) => {
	const secNum = Math.ceil((clock % 1) * 60);

	let sec;
	if (secNum >= 60) {
		sec = "59";
	} else if (secNum < 10) {
		sec = `0${secNum}`;
	} else {
		sec = `${secNum}`;
	}

	return `${Math.floor(clock)}:${sec}`;
};

const descriptionYdsTD = (
	yds: number,
	td: boolean,
	touchdownText: string,
	showYdsOnTD: boolean,
) => {
	if (td && showYdsOnTD) {
		return `${yds} yards${td ? ` and ${touchdownText}!` : ""}`;
	}

	if (td) {
		return `${touchdownText}!`;
	}

	return `${yds} yards`;
};

class PlayByPlayLogger {
	active: boolean;

	playByPlay: any[];

	scoringSummary: any[];

	quarter: string;

	constructor(active: boolean) {
		this.active = active;
		this.playByPlay = [];
		this.scoringSummary = [];
		this.quarter = "Q1";
	}

	logEvent(
		type: PlayType,
		{
			clock,
			injuredPID,
			names,
			penaltyName,
			quarter,
			t,
		}: {
			clock: number;
			injuredPID?: number;
			names?: string[];
			offense?: boolean;
			penaltyName?: string;
			quarter?: number;
			t?: TeamNum;
		},
	) {
		let text;

		if (this.playByPlay !== undefined) {
			if (type === "injury") {
				if (names === undefined) {
					throw new Error("Missing names");
				}

				text = `${names[0]} was injured!`;
			} else if (type === "quarter") {
				text = `Start of ${helpers.ordinal(quarter)} ${getPeriodName(
					g.get("numPeriods"),
				)}`;

				if (quarter === undefined) {
					throw new Error("Missing quarter");
				}

				this.quarter = `Q${quarter}`;
			} else if (type === "overtime") {
				text = "Start of overtime";
				this.quarter = "OT";
			} else if (type === "gameOver") {
				text = "End of game";
			} else if (type === "hit") {
				if (names === undefined) {
					throw new Error("Missing names");
				}

				text = `${names[0]} hit ${names[1]}`;
			} else if (type === "gv") {
				if (names === undefined) {
					throw new Error("Missing names");
				}

				text = `Giveaway by ${names[0]}`;
			} else if (type === "tk") {
				if (names === undefined) {
					throw new Error("Missing names");
				}

				text = `Takeaway by ${names[0]}`;
			} else if (type === "slapshot") {
				if (names === undefined) {
					throw new Error("Missing names");
				}

				text = `Slapshot from ${names[0]}`;
			} else if (type === "wristshot") {
				if (names === undefined) {
					throw new Error("Missing names");
				}

				text = `Wristshot by ${names[0]}`;
			} else if (type === "shot") {
				if (names === undefined) {
					throw new Error("Missing names");
				}

				text = `Shot by ${names[0]}`;
			} else if (type === "block") {
				if (names === undefined) {
					throw new Error("Missing names");
				}

				text = `Blocked by ${names[0]}`;
			} else if (type === "miss") {
				text = "Shot missed the goal";
			} else if (type === "save") {
				if (names === undefined) {
					throw new Error("Missing names");
				}

				text = `Saved by ${names[0]}`;
			} else if (type === "save-freeze") {
				if (names === undefined) {
					throw new Error("Missing names");
				}

				text = `Saved by ${names[0]}, and he freezes the puck`;
			} else if (type === "faceoff") {
				if (names === undefined) {
					throw new Error("Missing names");
				}

				text = `${names[0]} wins the faceoff against ${names[1]}`;
			} else if (type === "goal") {
				text = "Goal!!!";
			} else if (type === "offensiveLineChange") {
				text = "Offensive line change";
			} else if (type === "fullLineChange") {
				text = "Full line change";
			} else if (type === "defensiveLineChange") {
				text = "Defensive line change";
			} else {
				throw new Error(`No text for "${type}"`);
			}

			if (text) {
				const event: any = {
					type: "text",
					text,
					t,
					time: formatClock(clock),
					quarter: this.quarter,
				};

				if (injuredPID !== undefined) {
					event.injuredPID = injuredPID;
				}

				this.playByPlay.push(event);

				if (type === "goal") {
					this.scoringSummary.push(event);
				}
			}
		}
	}

	logStat(
		qtr: number,
		t: number,
		pid: number | undefined | null,
		s: string,
		amt: number,
	) {
		if (!this.active) {
			return;
		}

		this.playByPlay.push({
			type: "stat",
			quarter: this.quarter,
			t,
			pid,
			s,
			amt,
		});
	}

	logClock({
		awaitingKickoff,
		clock,
		down,
		scrimmage,
		t,
		toGo,
	}: {
		awaitingKickoff: TeamNum | undefined;
		clock: number;
		down: number;
		scrimmage: number;
		t: TeamNum;
		toGo: number;
	}) {
		if (!this.active) {
			return;
		}

		this.playByPlay.push({
			type: "clock",
			awaitingKickoff,
			down,
			scrimmage,
			t,
			time: formatClock(clock),
			toGo,
		});
	}

	getPlayByPlay(boxScore: any) {
		if (!this.active) {
			return;
		}

		return [
			{
				type: "init",
				boxScore,
			},
			...this.playByPlay,
		];
	}
}

export default PlayByPlayLogger;
