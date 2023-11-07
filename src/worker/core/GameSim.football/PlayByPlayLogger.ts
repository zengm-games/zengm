import type { TeamNum } from "./types";

type PlayByPlayEventInput =
	| {
			type: "quarter";
			clock: number;
			quarter: number;
	  }
	| {
			type: "overtime";
			clock: number;
			overtimes: number;
	  }
	| {
			type: "gameOver";
			clock: number;
	  }
	| {
			type: "injury";
			clock: number;
			injuredPID: number;
			names: string[];
			t: TeamNum;
	  }
	| {
			type: "kickoff";
			clock: number;
			names: string[];
			t: TeamNum;
			touchback: boolean;
			yds: number;
	  }
	| {
			type: "kickoffReturn";
			automaticFirstDown?: boolean;
			clock: number;
			names: string[];
			t: TeamNum;
			td: boolean;
			yds: number;
	  }
	| {
			type: "punt";
			clock: number;
			names: string[];
			t: TeamNum;
			touchback: boolean;
			yds: number;
	  }
	| {
			type: "puntReturn";
			clock: number;
			names: string[];
			t: TeamNum;
			td: boolean;
			yds: number;
	  }
	| {
			type: "extraPointAttempt";
			clock: number;
			t: TeamNum;
	  }
	| {
			type: "extraPoint" | "fieldGoal";
			clock: number;
			made: boolean;
			names: string[];
			t: TeamNum;
			yds: number;
	  }
	| {
			type: "fumble";
			clock: number;
			names: string[];
			t: TeamNum;
	  }
	| {
			type: "fumbleRecovery";
			clock: number;
			lost: boolean;
			names: string[];
			safety: boolean;
			t: TeamNum;
			td: boolean;
			touchback: boolean;
			yds: number;
	  }
	| {
			type: "interception";
			clock: number;
			names: string[];
			t: TeamNum;
			td: boolean;
			touchback: boolean;
			yds: number;
	  }
	| {
			type: "sack";
			clock: number;
			names: string[];
			safety: boolean;
			t: TeamNum;
			yds: number;
	  }
	| {
			type: "dropback";
			clock: number;
			names: string[];
			t: TeamNum;
	  }
	| {
			type: "passComplete";
			clock: number;
			names: string[];
			safety: boolean;
			t: TeamNum;
			td: boolean;
			yds: number;
	  }
	| {
			type: "passIncomplete";
			clock: number;
			names: string[];
			t: TeamNum;
			yds: number;
	  }
	| {
			type: "handoff";
			clock: number;
			names: string[];
			t: TeamNum;
	  }
	| {
			type: "run";
			clock: number;
			names: string[];
			safety: boolean;
			t: TeamNum;
			td: boolean;
			yds: number;
	  }
	| {
			type: "onsideKick";
			clock: number;
			names: string[];
			t: TeamNum;
	  }
	| {
			type: "onsideKickRecovery";
			clock: number;
			names: string[];
			success: boolean;
			t: TeamNum;
			td: boolean;
	  }
	| {
			type: "penalty";
			automaticFirstDown: boolean;
			clock: number;
			decision: "accept" | "decline";
			halfDistanceToGoal: boolean;
			names: string[];
			offsetStatus: "offset" | "overrule" | undefined;
			penaltyName: string;
			placeOnOne: boolean;
			spotFoul: boolean;
			t: TeamNum;
			tackOn: boolean;
			yds: number;
	  }
	| {
			type: "penaltyCount";
			clock: number;
			count: number;
			offsetStatus: "offset" | "overrule" | undefined;
	  }
	| {
			type: "timeout";
			clock: number;
			offense: boolean;
			t: TeamNum;
	  }
	| {
			type: "twoMinuteWarning";
			clock: number;
	  }
	| {
			type: "kneel";
			clock: number;
			names: string[];
			t: TeamNum;
	  }
	| {
			type: "flag";
			clock: number;
	  }
	| {
			type: "twoPointConversion";
			clock: number;
			t: TeamNum;
	  }
	| {
			type: "twoPointConversionFailed";
			clock: number;
			t: TeamNum;
	  }
	| {
			type: "turnoverOnDowns";
			clock: number;
	  };

export type PlayByPlayEvent =
	| (
			| PlayByPlayEventInput
			| {
					type: "stat";
					t: TeamNum;
					pid: number | undefined | null;
					s: string;
					amt: number;
			  }
	  )
	| {
			type: "init";
			boxScore: any;
	  }
	| {
			type: "removeLastScore";
	  }
	| {
			type: "clock";
			awaitingKickoff: TeamNum | undefined;
			clock: number;
			down: number;
			scrimmage: number;
			t: TeamNum;
			toGo: number;
	  };

class PlayByPlayLogger {
	active: boolean;

	playByPlay: PlayByPlayEvent[];

	constructor(active: boolean) {
		this.active = active;
		this.playByPlay = [];
	}

	logEvent(event: PlayByPlayEventInput) {
		this.playByPlay.push({
			...event,
		});
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
			clock,
			down,
			scrimmage,
			t,
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

	removeLastScore() {
		this.playByPlay.push({
			type: "removeLastScore",
		});
	}
}

export default PlayByPlayLogger;
