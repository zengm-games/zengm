import type { TeamNum } from "./types";

type PlayByPlayEventInputScore = {
	type: "goal";
	clock: number;
	t: TeamNum;
	names: [string] | [string, string] | [string, string, string];
	pids: [number] | [number, number] | [number, number, number];
	goalType: "ev" | "sh" | "pp" | "en";
	shotType: string;
};

type Runner = {
	pid: number;
	from: 0 | 1 | 2; // 1st/2nd/3rd base
	to: 1 | 2 | 3; // 2nd/3rd/home
	out: boolean;
};

type PlayByPlayEventInput =
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
			names: [string];
			injuredPID: number;
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
			type: "bunt";
			t: TeamNum;
			pid: number;
			direction: "left" | "right" | "middle";
			speed: "soft" | "normal" | "hard";
	  }
	| {
			type: "ground";
			t: TeamNum;
			pid: number;
			direction: "left" | "right" | "middle";
			speed: "soft" | "normal" | "hard";
	  }
	| {
			type: "line";
			t: TeamNum;
			pid: number;
			direction: "left" | "right" | "middle";
			speed: "soft" | "normal" | "hard";
	  }
	| {
			type: "fly";
			t: TeamNum;
			pid: number;
			direction: "left" | "right" | "middle";
			distance: "infield" | "shallow" | "normal" | "deep";
	  }
	| {
			type: "hit";
			t: TeamNum;
			pid: number;
			runners: Runner[];
			numBases: 1 | 2 | 3 | 4;
			outAtNextBase: boolean; // For if the runner was thrown out when trying to advance one more base
	  }
	| {
			type: "flyOut";
			t: TeamNum;
			pid: number;
			pidDefense: number;
			runners: Runner[];
	  }
	| {
			type: "throwOut";
			t: TeamNum;
			pid: number;
			posDefense: number[]; // Like for a double play, this could be [6, 4, 3]
			base: 0 | 1 | 2;
			runners: Runner[];
	  }
	| {
			type: "walk";
			t: TeamNum;
			pid: number;
			runners: Runner[];
	  }
	| {
			type: "stealStart";
			t: TeamNum;
			pid: number;
			from: 0 | 1 | 2;
	  }
	| {
			type: "stealEnd";
			t: TeamNum;
			pid: number;
			to: 1 | 2 | 3;
			out: boolean;
	  }
	| {
			type: "errorHit";
			t: TeamNum;
			pid: number;
			pidError: number;
			runners: Runner[];
			numBases: 1 | 2 | 3 | 4;
			outAtNextBase: boolean; // For if the runner was thrown out when trying to advance one more base
	  }
	| {
			type: "errorThrow";
			t: TeamNum;
			pidError: number;
			runners: Runner[];
	  }
	| {
			type: "balk";
			t: TeamNum;
			pid: number;
			runners: Runner[];
	  }
	| {
			type:
				| "gv"
				| "tk"
				| "slapshot"
				| "wristshot"
				| "shot"
				| "reboundShot"
				| "block"
				| "miss"
				| "save"
				| "save-freeze"
				| "deflection";
			clock: number;
			t: TeamNum;
			names: [string];
	  }
	| PlayByPlayEventInputScore
	| {
			type: "offensiveLineChange" | "fullLineChange" | "defensiveLineChange";
			clock: number;
			t: TeamNum;
	  }
	| {
			type: "playersOnIce";
			t: TeamNum;
			pids: number[];
	  }
	| {
			type: "penalty";
			clock: number;
			t: TeamNum;
			names: [string];
			penaltyType: keyof typeof penaltyTypes;
			penaltyName: string;
			penaltyPID: number;
	  }
	| {
			type: "penaltyOver";
			clock: number;
			t: TeamNum;
			names: [string];
			penaltyPID: number;
	  }
	| {
			type: "pullGoalie";
			clock: number;
			t: TeamNum;
			name: string;
	  }
	| {
			type: "noPullGoalie";
			clock: number;
			t: TeamNum;
			name: string;
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
			quarter: number;
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
