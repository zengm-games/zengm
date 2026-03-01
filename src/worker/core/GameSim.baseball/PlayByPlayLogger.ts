import type { POS_NUMBERS_INVERSE } from "../../../common/constants.baseball.ts";
import { formatScoringSummaryEvent } from "../../../common/formatScoringSummaryEvent.baseball.ts";
import type { TeamNum } from "../../../common/types.ts";
import { PlayByPlayLoggerBase } from "../GameSim/PlayByPlayLoggerBase.ts";
import type { Runner } from "./types.ts";

export type PlayByPlayEventInput =
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
			pid: number;
			replacementPid: number | undefined;
	  }
	| {
			type: "reliefPitcher";
			pidOff: number;
			pidOn: number;
	  }
	| {
			type: "plateAppearance";
			pid: number;
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
			pid: number;
			posDefense: (keyof typeof POS_NUMBERS_INVERSE)[]; // Like for a double play, this could be [6, 4, 3]
			runners: Runner[];
			t: TeamNum;
			numBases: 1 | 2 | 3 | 4;
			outAtNextBase: boolean; // For if the runner was thrown out when trying to advance one more base
			outs: number;
			bases: [number | undefined, number | undefined, number | undefined];
			totalHits: number | undefined; // undefined in ASG or old box scores
	  }
	| {
			type: "hitResult";
			result: "error";
			pid: number;
			pidError: number;
			posDefense: (keyof typeof POS_NUMBERS_INVERSE)[]; // Like for a double play, this could be [6, 4, 3]
			runners: Runner[];
			t: TeamNum;
			numBases: 1 | 2 | 3 | 4;
			outAtNextBase: boolean; // For if the runner was thrown out when trying to advance one more base
			outs: number;
			bases: [number | undefined, number | undefined, number | undefined];
	  }
	| {
			type: "walk";
			pid: number;
			runners: Runner[];
			t: TeamNum;
			intentional: boolean;
			bases: [number | undefined, number | undefined, number | undefined];
	  }
	| {
			type: "hitByPitch";
			pid: number;
			runners: Runner[];
			t: TeamNum;
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
			totalSb: number | undefined; // undefined in ASG or old box scores
	  }
	| {
			type: "balk" | "wildPitch" | "passedBall";
			pid: number;
			runners: Runner[];
			t: TeamNum;
			bases: [number | undefined, number | undefined, number | undefined];
	  }
	| {
			type: "sub";
			pidOff: number;
			pidOn: number;
	  }
	| {
			type: "shootoutStart";
			rounds: number;
	  }
	| {
			type: "shootoutTeam";
			t: TeamNum;
			pid: number;
			pitcherPid: number;
	  }
	| {
			type: "shootoutShot";
			t: TeamNum;
			pid: number;
			made: boolean;
			att: number;
			pitcherPid: number;
			flavor: number;
	  }
	| {
			type: "shootoutTie";
	  };

export type PlayByPlayEventScore = PlayByPlayEventInput & {
	inning: number;
	t: TeamNum;
	pid: number;
};

class BaseballPlayByPlayLogger extends PlayByPlayLoggerBase<PlayByPlayEventInput> {
	scoringSummary: PlayByPlayEventScore[] = [];
	private period = 1;

	constructor(active: boolean) {
		super(active);
	}

	logEvent(event: PlayByPlayEventInput) {
		this.playByPlay.push(event);

		if (event.type === "sideStart") {
			this.period = event.inning;
		}

		const scoringSummaryEvent = formatScoringSummaryEvent(event, this.period);
		if (scoringSummaryEvent) {
			this.scoringSummary.push(scoringSummaryEvent);
		}
	}
}

export default BaseballPlayByPlayLogger;
