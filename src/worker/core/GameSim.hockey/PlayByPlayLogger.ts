import { getPeriodName } from "../../../common";
import { g, helpers } from "../../util";
import type { TeamNum } from "./types"; // Convert clock in minutes to min:sec, like 1.5 -> 1:30

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

type PlayByPlayEvent =
	| {
			type: "quarter" | "overtime";
			quarter: number;
			clock: number;
	  }
	| {
			type: "gameOver";
			clock: number;
	  }
	| {
			type: "injury";
			clock: number;
			t: TeamNum;
			names: [string];
			injuredPID: number;
	  }
	| {
			type: "hit" | "faceoff";
			clock: number;
			t: TeamNum;
			names: [string, string];
	  }
	| {
			type:
				| "gv"
				| "tk"
				| "slapshot"
				| "wristshot"
				| "shot"
				| "block"
				| "miss"
				| "save"
				| "save-freeze";
			clock: number;
			t: TeamNum;
			names: [string];
	  }
	| {
			type: "goal";
			clock: number;
			t: TeamNum;
			names: [string];
	  }
	| {
			type: "offensiveLineChange" | "fullLineChange" | "defensiveLineChange";
			clock: number;
			t: TeamNum;
	  };

class PlayByPlayLogger {
	active: boolean;

	playByPlay: any[];

	scoringSummary: any[];

	quarter: number;

	constructor(active: boolean) {
		this.active = active;
		this.playByPlay = [];
		this.scoringSummary = [];
		this.quarter = 1;
	}

	logEvent(event: PlayByPlayEvent) {
		let text;

		if (this.playByPlay !== undefined) {
			if (event.type === "injury") {
				text = `${event.names[0]} was injured!`;
			} else if (event.type === "quarter") {
				text = `Start of ${helpers.ordinal(event.quarter)} ${getPeriodName(
					g.get("numPeriods"),
				)}`;

				this.quarter = event.quarter;
			} else if (event.type === "overtime") {
				text = "Start of overtime";
				this.quarter += 1;
			} else if (event.type === "gameOver") {
				text = "End of game";
			} else if (event.type === "hit") {
				text = `${event.names[0]} hit ${event.names[1]}`;
			} else if (event.type === "gv") {
				text = `Giveaway by ${event.names[0]}`;
			} else if (event.type === "tk") {
				text = `Takeaway by ${event.names[0]}`;
			} else if (event.type === "slapshot") {
				text = `Slapshot from ${event.names[0]}`;
			} else if (event.type === "wristshot") {
				text = `Wristshot by ${event.names[0]}`;
			} else if (event.type === "shot") {
				text = `Shot by ${event.names[0]}`;
			} else if (event.type === "block") {
				text = `Blocked by ${event.names[0]}`;
			} else if (event.type === "miss") {
				text = "Shot missed the goal";
			} else if (event.type === "save") {
				text = `Saved by ${event.names[0]}`;
			} else if (event.type === "save-freeze") {
				text = `Saved by ${event.names[0]}, and he freezes the puck`;
			} else if (event.type === "faceoff") {
				text = `${event.names[0]} wins the faceoff against ${event.names[1]}`;
			} else if (event.type === "goal") {
				text = "Goal!!!";
			} else if (event.type === "offensiveLineChange") {
				text = "Offensive line change";
			} else if (event.type === "fullLineChange") {
				text = "Full line change";
			} else if (event.type === "defensiveLineChange") {
				text = "Defensive line change";
			} else {
				throw new Error(`No text for "${event.type}"`);
			}

			const event2: any = {
				type: "text",
				text,
				t: event.t,
				time: formatClock(event.clock),
				quarter: this.quarter,
			};

			if (event.injuredPID !== undefined) {
				event2.injuredPID = injuredPID;
			}

			this.playByPlay.push(event2);

			if (event.type === "goal") {
				this.scoringSummary.push(event2);
			}
		}
	}

	logStat(t: number, pid: number | undefined | null, s: string, amt: number) {
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
