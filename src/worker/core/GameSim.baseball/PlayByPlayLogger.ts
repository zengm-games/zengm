import type { Runner, TeamNum } from "./types";

type PlayByPlayEventInputScore = {
	type: "goal";
	clock: number;
	t: TeamNum;
	names: [string] | [string, string] | [string, string, string];
	pids: [number] | [number, number] | [number, number, number];
	goalType: "ev" | "sh" | "pp" | "en";
	shotType: string;
};

type PlayByPlayEventInput =
	| {
			type: "sideStart";
			inning: number;
			t: TeamNum;
	  }
	| {
			type: "sideOver";
			inning: number;
	  }
	| {
			type: "inningOver";
			inning: number;
	  }
	| {
			type: "gameOver";
	  }
	| {
			type: "injury";
			clock: number;
			t: TeamNum;
			pid: number;
	  }
	| {
			type: "plateAppearance";
			t: TeamNum;
			pid: number;
	  }
	| {
			type: "pitch";
			t: TeamNum;
			pid: number;
			pitchType: string;
	  }
	| {
			type: "foul";
			balls: number;
			strikes: number;
	  }
	| {
			type: "ball";
			intentional: boolean;
			balls: number;
			strikes: number;
	  }
	| {
			type: "strike";
			swinging: boolean;
			balls: number;
			strikes: number;
	  }
	| {
			type: "strikeOut";
			swinging: boolean;
			outs: number;
			bases: [boolean, boolean, boolean];
	  }
	| {
			type: "bunt" | "ground" | "line";
			t: TeamNum;
			pid: number;
			direction:
				| "left"
				| "right"
				| "middle"
				| "farLeft"
				| "farRight"
				| "farLeftFoul"
				| "farRightFoul";
			speed: "soft" | "normal" | "hard";
	  }
	| {
			type: "fly";
			t: TeamNum;
			pid: number;
			direction:
				| "left"
				| "right"
				| "middle"
				| "farLeft"
				| "farRight"
				| "farLeftFoul"
				| "farRightFoul";
			distance: "infield" | "shallow" | "normal" | "deep";
	  }
	| {
			type: "hitResult";
			result: "flyOut" | "throwOut" | "fieldersChoice" | "doublePlay" | "hit";
			t: TeamNum;
			pid: number;
			posDefense: number[]; // Like for a double play, this could be [6, 4, 3]
			runners: Runner[];
			numBases: 1 | 2 | 3 | 4;
			outAtNextBase: boolean; // For if the runner was thrown out when trying to advance one more base
			outs: number;
			bases: [boolean, boolean, boolean];
	  }
	| {
			type: "hitResult";
			result: "error";
			t: TeamNum;
			pid: number;
			pidError: number;
			posDefense: number[]; // Like for a double play, this could be [6, 4, 3]
			runners: Runner[];
			numBases: 1 | 2 | 3 | 4;
			outAtNextBase: boolean; // For if the runner was thrown out when trying to advance one more base
			outs: number;
			bases: [boolean, boolean, boolean];
	  }
	| {
			type: "walk";
			t: TeamNum;
			pid: number;
			runners: Runner[];
			bases: [boolean, boolean, boolean];
	  }
	| {
			type: "stealStart";
			t: TeamNum;
			pid: number;
			from: 1 | 2 | 3;
	  }
	| {
			type: "stealEnd";
			t: TeamNum;
			pid: number;
			pidError?: number;
			to: 2 | 3 | 4;
			out: boolean;
			outAtNextBase: boolean; // For if the runner was thrown out when trying to advance one more base
			runners: Runner[];
			outs: number;
			bases: [boolean, boolean, boolean];
	  }
	| {
			type: "balk";
			t: TeamNum;
			pid: number;
			runners: Runner[];
			bases: [boolean, boolean, boolean];
	  }
	| {
			type: "sub";
			t: TeamNum;
			pidOff: number;
			pidOn: number;
	  };

export type PlayByPlayEvent =
	| ((
			| PlayByPlayEventInput
			| {
					type: "stat";
					t: TeamNum;
					pid: number | undefined | null;
					s: string;
					amt: number;
			  }
	  ) & {
			inning: number;
	  })
	| {
			type: "init";
			boxScore: any;
	  };

export type PlayByPlayEventScore = PlayByPlayEventInputScore & {
	quarter: number;
	hide?: boolean;
};

class PlayByPlayLogger {
	active: boolean;

	playByPlay: PlayByPlayEvent[];

	scoringSummary: PlayByPlayEventScore[];

	quarter: number;

	constructor(active: boolean) {
		this.active = active;
		this.playByPlay = [];
		this.scoringSummary = [];
		this.quarter = 1;
	}

	logEvent(event: PlayByPlayEventInput) {
		if (event.type === "quarter") {
			this.quarter = event.quarter;
		} else if (event.type === "overtime") {
			this.quarter += 1;
		}

		const event2: PlayByPlayEvent = {
			quarter: this.quarter,
			...event,
		};

		this.playByPlay.push(event2);

		if (event2.type === "goal") {
			this.scoringSummary.push(event2);
		}
	}

	logStat(t: TeamNum, pid: number | undefined | null, s: string, amt: number) {
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

	getPlayByPlay(boxScore: any): PlayByPlayEvent[] | undefined {
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
