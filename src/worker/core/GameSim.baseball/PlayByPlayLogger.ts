import type { POS_NUMBERS_INVERSE } from "../../../common/constants.baseball";
import type { Runner, TeamNum } from "./types";

type PlayByPlayEventInput =
	| {
			type: "sideStart";
			inning: number;
			t: TeamNum;
			pitcherPid: number;
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
			t: TeamNum;
			pid: number;
			replacementPid: number | undefined;
	  }
	| {
			type: "reliefPitcher";
			t: TeamNum;
			pidOff: number;
			pidOn: number;
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
			bases: [number | undefined, number | undefined, number | undefined];
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
			distance: "infield" | "shallow" | "normal" | "deep" | "noDoubter";
	  }
	| {
			type: "hitResult";
			result: "flyOut" | "throwOut" | "fieldersChoice" | "doublePlay" | "hit";
			t: TeamNum;
			pid: number;
			posDefense: (keyof typeof POS_NUMBERS_INVERSE)[]; // Like for a double play, this could be [6, 4, 3]
			runners: Runner[];
			numBases: 1 | 2 | 3 | 4;
			outAtNextBase: boolean; // For if the runner was thrown out when trying to advance one more base
			outs: number;
			bases: [number | undefined, number | undefined, number | undefined];
	  }
	| {
			type: "hitResult";
			result: "error";
			t: TeamNum;
			pid: number;
			pidError: number;
			posDefense: (keyof typeof POS_NUMBERS_INVERSE)[]; // Like for a double play, this could be [6, 4, 3]
			runners: Runner[];
			numBases: 1 | 2 | 3 | 4;
			outAtNextBase: boolean; // For if the runner was thrown out when trying to advance one more base
			outs: number;
			bases: [number | undefined, number | undefined, number | undefined];
	  }
	| {
			type: "walk";
			t: TeamNum;
			pid: number;
			runners: Runner[];
			intentional: boolean;
			bases: [number | undefined, number | undefined, number | undefined];
	  }
	| {
			type: "hitByPitch";
			t: TeamNum;
			pid: number;
			runners: Runner[];
			bases: [number | undefined, number | undefined, number | undefined];
	  }
	| {
			type: "stealStart";
			pid: number;
			to: 2 | 3 | 4;
	  }
	| {
			type: "stealStartAll";
	  }
	| {
			type: "stealEnd";
			pid: number;
			pidError?: number;
			to: 2 | 3 | 4;
			out: boolean;
			throw: boolean;
			outAtNextBase: boolean; // For if the runner was thrown out when trying to advance one more base
			outs: number;
			bases: [number | undefined, number | undefined, number | undefined];
	  }
	| {
			type: "balk" | "wildPitch" | "passedBall";
			t: TeamNum;
			pid: number;
			runners: Runner[];
			bases: [number | undefined, number | undefined, number | undefined];
	  }
	| {
			type: "sub";
			t: TeamNum;
			pidOff: number;
			pidOn: number;
	  };

type PlayByPlayEventStat = {
	type: "stat";
	t: TeamNum;
	pid: number | undefined | null;
	s: string;
	amt: number;
};

export type PlayByPlayEvent =
	| (PlayByPlayEventInput | PlayByPlayEventStat)
	| {
			type: "init";
			boxScore: any;
	  };

export type PlayByPlayEventScore = PlayByPlayEvent & {
	inning: number;
	t: TeamNum;
	pid: number;
};

class PlayByPlayLogger {
	active: boolean;

	playByPlay: PlayByPlayEvent[];

	scoringSummary: PlayByPlayEventScore[];

	period: number;

	constructor(active: boolean) {
		this.active = active;
		this.playByPlay = [];
		this.scoringSummary = [];
		this.period = 1;
	}

	logEvent(event: PlayByPlayEventInput) {
		this.playByPlay.push(event);

		if (event.type === "sideStart") {
			this.period = event.inning;
		}

		let scored = false;
		if (event.type === "hitResult" && event.numBases === 4) {
			// Home run
			scored = true;
		} else {
			const runners = (event as Extract<PlayByPlayEvent, { type: "hitResult" }>)
				.runners;
			if (runners?.some(runner => runner.scored)) {
				scored = true;
			}
		}

		if (scored) {
			const scoringSummaryEvent = {
				...event,
				inning: this.period,
			};
			if (
				scoringSummaryEvent.type === "balk" ||
				scoringSummaryEvent.type === "wildPitch" ||
				scoringSummaryEvent.type === "passedBall"
			) {
				// Swap team, so it shows up correctly in scoring summary. Basically, t must be team that scored
				scoringSummaryEvent.t = scoringSummaryEvent.t === 0 ? 1 : 0;
			}

			this.scoringSummary.push(scoringSummaryEvent as any);
		}
	}

	logStat(t: TeamNum, pid: number | undefined | null, s: string, amt: number) {
		if (!this.active) {
			return;
		}

		this.playByPlay.push({
			type: "stat",
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
