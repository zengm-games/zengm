import type { POS_NUMBERS_INVERSE } from "../../../common/constants.baseball";
import { formatScoringSummaryEvent } from "../../../common/formatScoringSummaryEvent.baseball";
import type { Runner, TeamNum } from "./types";

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

	playByPlay: PlayByPlayEvent[] = [];

	scoringSummary: PlayByPlayEventScore[] = [];

	period = 1;

	constructor(active: boolean) {
		this.active = active;
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
