import { formatScoringSummaryEvent } from "../../../common/formatScoringSummaryEvent.football";
import type { TeamNum } from "./types";

export type PlayByPlayEventInputScore =
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
			type: "puntReturn";
			clock: number;
			names: string[];
			t: TeamNum;
			td: boolean;
			yds: number;
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
			twoPointConversionTeam: TeamNum | undefined;
			yds: number;
			ydsBefore: number;
	  }
	| {
			type: "interception";
			clock: number;
			names: string[];
			t: TeamNum;
			twoPointConversionTeam: TeamNum | undefined;
			yds: number;
	  }
	| {
			type: "interceptionReturn";
			clock: number;
			names: string[];
			t: TeamNum;
			td: boolean;
			touchback: boolean;
			twoPointConversionTeam: TeamNum | undefined;
			yds: number;
	  }
	| {
			type: "passComplete";
			clock: number;
			names: string[];
			safety: boolean;
			t: TeamNum;
			td: boolean;
			twoPointConversionTeam: TeamNum | undefined;
			yds: number;
	  }
	| {
			type: "run";
			clock: number;
			names: string[];
			safety: boolean;
			t: TeamNum;
			td: boolean;
			twoPointConversionTeam: TeamNum | undefined;
			yds: number;
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
			type: "extraPoint" | "fieldGoal";
			clock: number;
			made: boolean;
			names: string[];
			t: TeamNum;
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
			type: "twoPointConversionFailed";
			clock: number;
			t: TeamNum;
	  }
	| {
			type: "shootoutShot";
			t: TeamNum;
			names: string[];
			made: boolean;
			att: number;
			yds: number;
			clock: number;
	  };

export type PlayByPlayEventInput =
	| PlayByPlayEventInputScore
	| {
			type: "quarter";
			clock: number;
			quarter: number;
			startsWithKickoff: boolean;
	  }
	| {
			type: "overtime";
			clock: number;
			overtimes: number;
			startsWithKickoff: boolean;
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
			type: "punt";
			clock: number;
			names: string[];
			t: TeamNum;
			touchback: boolean;
			yds: number;
	  }
	| {
			type: "extraPointAttempt";
			clock: number;
			t: TeamNum;
	  }
	| {
			type: "fumble";
			clock: number;
			names: string[];
			t: TeamNum;
	  }
	| {
			type: "dropback";
			clock: number;
			names: string[];
			t: TeamNum;
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
			type: "onsideKick";
			clock: number;
			names: string[];
			t: TeamNum;
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
			possessionAfter: TeamNum;
			scrimmageAfter: number;
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
			numLeft: number;
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
			yds: number;
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
			type: "turnoverOnDowns";
			clock: number;
			t: TeamNum;
	  }
	| {
			type: "shootoutStart";
			rounds: number;
			clock: number;
	  }
	| {
			type: "shootoutTie";
			clock: number;
	  }
	| {
			type: "timeouts";
			timeouts: [number, number];
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
			awaitingAfterTouchdown: boolean;
			clock: number;
			down: number;
			scrimmage: number;
			t: TeamNum;
			toGo: number;
	  };

export type PlayByPlayEventScore = PlayByPlayEventInputScore & {
	quarter: number;
};

class PlayByPlayLogger {
	active: boolean;

	playByPlay: PlayByPlayEvent[] = [];

	scoringSummary: (
		| PlayByPlayEventScore
		| {
				type: "removeLastScore";
		  }
	)[] = [];

	quarter = 1;

	constructor(active: boolean) {
		this.active = active;
	}

	logEvent(event: PlayByPlayEventInput) {
		if (event.type === "quarter" || event.type === "overtime") {
			this.quarter += 1;
		}

		if (this.active) {
			this.playByPlay.push({
				...event,
			});
		}

		const scoringSummaryEvent = formatScoringSummaryEvent(event, this.quarter);
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

	logClock({
		awaitingKickoff,
		awaitingAfterTouchdown,
		clock,
		down,
		scrimmage,
		t,
		toGo,
	}: {
		awaitingKickoff: TeamNum | undefined;
		awaitingAfterTouchdown: boolean;
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
			awaitingAfterTouchdown,
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
		if (this.active) {
			this.playByPlay.push({
				type: "removeLastScore",
			});
		}

		this.scoringSummary.push({
			type: "removeLastScore",
		});
	}
}

export default PlayByPlayLogger;
