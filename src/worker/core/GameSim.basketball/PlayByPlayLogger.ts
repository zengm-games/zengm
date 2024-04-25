type TeamNum = 0 | 1;

type PlayByPlayEventInputScore =
	| {
			type: "fgAtRim";
			t: TeamNum;
			pid: number;
			pidDefense: number;
			pidAst: number | undefined;
			clock: number;
	  }
	| {
			type: "fgAtRimAndOne";
			t: TeamNum;
			pid: number;
			pidDefense: number;
			pidAst: number | undefined;
			clock: number;
	  }
	| {
			type: "fgLowPost";
			t: TeamNum;
			pid: number;
			pidAst: number | undefined;
			clock: number;
	  }
	| {
			type: "fgLowPostAndOne";
			t: TeamNum;
			pid: number;
			pidAst: number | undefined;
			clock: number;
	  }
	| {
			type: "fgMidRange";
			t: TeamNum;
			pid: number;
			pidAst: number | undefined;
			clock: number;
	  }
	| {
			type: "fgMidRangeAndOne";
			t: TeamNum;
			pid: number;
			pidAst: number | undefined;
			clock: number;
	  }
	| {
			type: "ft";
			t: TeamNum;
			pid: number;
			clock: number;
	  }
	| {
			type: "tp";
			t: TeamNum;
			pid: number;
			pidAst: number | undefined;
			clock: number;
	  }
	| {
			type: "tpAndOne";
			t: TeamNum;
			pid: number;
			pidAst: number | undefined;
			clock: number;
	  }
	| {
			type: "fgTipIn";
			t: TeamNum;
			pid: number;
			pidAst: number | undefined;
			clock: number;
	  }
	| {
			type: "fgTipInAndOne";
			t: TeamNum;
			pid: number;
			pidAst: number | undefined;
			clock: number;
	  }
	| {
			type: "fgPutBack";
			t: TeamNum;
			pid: number;
			clock: number;
	  }
	| {
			type: "fgPutBackAndOne";
			t: TeamNum;
			pid: number;
			clock: number;
	  };

type PlayByPlayEventInputNoScore =
	| {
			type: "blkTipIn";
			t: TeamNum;
			pid: number;
			clock: number;
	  }
	| {
			type: "blkPutBack";
			t: TeamNum;
			pid: number;
			clock: number;
	  }
	| {
			type: "blkAtRim";
			t: TeamNum;
			pid: number;
			clock: number;
	  }
	| {
			type: "blkLowPost";
			t: TeamNum;
			pid: number;
			clock: number;
	  }
	| {
			type: "blkMidRange";
			t: TeamNum;
			pid: number;
			clock: number;
	  }
	| {
			type: "blkTp";
			t: TeamNum;
			pid: number;
			clock: number;
	  }
	| {
			type: "drb";
			t: TeamNum;
			pid: number;
			clock: number;
	  }
	| {
			type: "fgaAtRim";
			t: TeamNum;
			pid: number;
			clock: number;
	  }
	| {
			type: "fgaLowPost";
			t: TeamNum;
			pid: number;
			clock: number;
	  }
	| {
			type: "fgaMidRange";
			t: TeamNum;
			pid: number;
			clock: number;
	  }
	| {
			type: "fgaTp";
			t: TeamNum;
			pid: number;
			clock: number;
			desperation: boolean;
	  }
	| {
			type: "fgaTpFake";
			t: TeamNum;
			pid: number;
			clock: number;
			desperation: boolean;
	  }
	| {
			type: "fgaTipIn";
			t: TeamNum;
			pid: number;
			pidPass: number;
			clock: number;
	  }
	| {
			type: "fgaPutBack";
			t: TeamNum;
			pid: number;
			clock: number;
	  }
	| {
			type: "foulOut";
			t: TeamNum;
			pid: number;
			clock: number;
	  }
	| {
			type: "gameOver";
	  }
	| {
			type: "injury";
			t: TeamNum;
			pid: number;
			clock: number;
	  }
	| {
			type: "jumpBall";
			t: TeamNum;
			pid: number;
			clock: number;
	  }
	| {
			type: "missTipIn";
			t: TeamNum;
			pid: number;
			clock: number;
	  }
	| {
			type: "missPutBack";
			t: TeamNum;
			pid: number;
			clock: number;
	  }
	| {
			type: "missAtRim";
			t: TeamNum;
			pid: number;
			clock: number;
	  }
	| {
			type: "missFt";
			t: TeamNum;
			pid: number;
			clock: number;
	  }
	| {
			type: "missLowPost";
			t: TeamNum;
			pid: number;
			clock: number;
	  }
	| {
			type: "missMidRange";
			t: TeamNum;
			pid: number;
			clock: number;
	  }
	| {
			type: "missTp";
			t: TeamNum;
			pid: number;
			clock: number;
	  }
	| {
			type: "orb";
			t: TeamNum;
			pid: number;
			clock: number;
	  }
	| {
			type: "overtime";
			clock: number;
			period: number;
	  }
	| {
			type: "pfNonShooting";
			t: TeamNum;
			pid: number;
			clock: number;
	  }
	| {
			type: "pfBonus";
			t: TeamNum;
			pid: number;
			pidShooting: number;
			clock: number;
	  }
	| {
			type: "pfFG";
			t: TeamNum;
			pid: number;
			pidShooting: number;
			clock: number;
	  }
	| {
			type: "pfTP";
			t: TeamNum;
			pid: number;
			pidShooting: number;
			clock: number;
	  }
	| {
			type: "pfAndOne";
			t: TeamNum;
			pid: number;
			clock: number;
	  }
	| {
			type: "period";
			clock: number;
			period: number;
	  }
	| {
			type: "stl";
			t: TeamNum;
			pid: number;
			pidTov: number;
			outOfBounds: boolean;
			clock: number;
	  }
	| {
			type: "sub";
			t: TeamNum;
			pid: number;
			pidOff: number;
			clock: number;
	  }
	| {
			type: "tov";
			t: TeamNum;
			pid: number;
			outOfBounds: boolean;
			clock: number;
	  }
	| {
			type: "elamActive";
			target: number;
	  }
	| {
			type: "timeout";
			t: TeamNum;
			numLeft: number;
			advancesBall: boolean;
			clock: number;
	  }
	| {
			type: "endOfPeriod";
			t: TeamNum;
			reason: "runOutClock" | "noShot" | "intentionalFoul";
			clock: number;
	  }
	| {
			type: "outOfBounds";
			t: TeamNum;
			on: "offense" | "defense";
			clock: number;
	  }
	| {
			type: "shootoutStart";
			rounds: number;
			clock: number;
	  }
	| {
			type: "shootoutTeam";
			t: TeamNum;
			pid: number;
	  }
	| {
			type: "shootoutShot";
			t: TeamNum;
			pid: number;
			made: boolean;
	  }
	| {
			type: "shootoutTie";
	  }
	| {
			type: "timeouts";
			timeouts: [number, number];
	  };

type PlayByPlayEventInput =
	| PlayByPlayEventInputScore
	| PlayByPlayEventInputNoScore;

// Only add period to scoring events, since they are used for scoringSummary
type PlayByPlayEventScore = PlayByPlayEventInputScore & { period: number };

export type PlayByPlayEvent =
	| (
			| PlayByPlayEventScore
			| PlayByPlayEventInputNoScore
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
	  };

const scoringTypes = [
	"fgAtRim",
	"fgAtRimAndOne",
	"fgLowPost",
	"fgLowPostAndOne",
	"fgMidRange",
	"fgMidRangeAndOne",
	"ft",
	"tp",
];

const isScoringPlay = (
	event: PlayByPlayEventInput,
): event is PlayByPlayEventInputScore => {
	return scoringTypes.includes(event.type);
};

class PlayByPlayLogger {
	active: boolean;

	playByPlay: PlayByPlayEvent[] = [];

	// scoringSummary: PlayByPlayEventScore[] = [];

	period = 1;

	constructor(active: boolean) {
		this.active = active;
	}

	logEvent(event: PlayByPlayEventInput) {
		if (event.type === "period" || event.type === "overtime") {
			this.period = event.period;
		}

		if (isScoringPlay(event)) {
			const event2 = {
				...event,
				period: this.period,
			};
			// this.scoringSummary.push(event2);
			if (this.active) {
				this.playByPlay.push(event2);
			}
		} else {
			if (this.active) {
				this.playByPlay.push(event);
			}
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
