type TeamNum = 0 | 1;
export type BlockType =
	| "blkAtRim"
	| "blkLowPost"
	| "blkMidRange"
	| "blkTp"
	| "blkTipIn"
	| "blkPutBack";
export type FgaType = "fgaAtRim" | "fgaLowPost" | "fgaMidRange" | "fgaPutBack";
export type FgMissType =
	| "missPutBack"
	| "missAtRim"
	| "missLowPost"
	| "missMidRange"
	| "missTp"
	| "missTipIn";
export type FgMakeNormalType = // fgAtRim/AndOne, ft,fgPutBack/AndOne excluded because they are handled separately

		| "fgLowPost"
		| "fgLowPostAndOne"
		| "fgMidRange"
		| "fgMidRangeAndOne"
		| "tp"
		| "tpAndOne"
		| "fgTipIn"
		| "fgTipInAndOne";

export type FgMakeWithoutAstType = "ft" | "fgPutBack" | "fgPutBackAndOne";
export type FgMakeWithDefenderType = "fgAtRimAndOne" | "fgAtRim";
export type FgMakeType =
	| FgMakeNormalType
	| FgMakeWithoutAstType
	| FgMakeWithDefenderType;
type PlayByPlayEventInputScore =
	| {
			type: FgMakeWithDefenderType;
			t: TeamNum;
			pid: number;
			pidDefense: number;
			pidAst: number | undefined;
			clock: number;
	  }
	| {
			type: FgMakeNormalType;
			t: TeamNum;
			pid: number;
			pidAst: number | undefined;
			clock: number;
	  }
	| {
			type: FgMakeWithoutAstType;
			t: TeamNum;
			pid: number;
			clock: number;
	  };

type PlayByPlayEventInputNoScore =
	| {
			type:
				| BlockType
				| FgaType
				| FgMissType
				| "pfNonShooting"
				| "pfAndOne"
				| "drb"
				| "orb"
				| "foulOut"
				| "injury"
				| "missFt";
			t: TeamNum;
			pid: number;
			clock: number;
	  }
	| {
			type: "jumpBall";
			t: TeamNum;
			pid: number;
			pid2: number;
			clock: number;
	  }
	| {
			type: "fgaTp" | "fgaTpFake";
			t: TeamNum;
			pid: number;
			clock: number;
			desperation: boolean;
	  }
	| {
			type: "fgaTipIn" | "fgTipInAndOne";
			t: TeamNum;
			pid: number;
			clock: number;
			pidPass: number;
	  }
	| {
			type: "gameOver";
	  }
	| {
			type: "overtime";
			clock: number;
			period: number;
	  }
	| {
			type: "pfBonus" | "pfFG" | "pfTP";
			t: TeamNum;
			pid: number;
			pidShooting: number;
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
			pids: number[];
			pidsOff: number[];
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

const scoringTypes: Set<PlayByPlayEventInput["type"]> = new Set([
	"fgAtRim",
	"fgAtRimAndOne",
	"fgLowPost",
	"fgLowPostAndOne",
	"fgMidRange",
	"fgMidRangeAndOne",
	"ft",
	"tp",
	"tpAndOne",
] satisfies PlayByPlayEventInputScore["type"][]);

const isScoringPlay = (
	event: PlayByPlayEventInput,
): event is PlayByPlayEventInputScore => {
	return scoringTypes.has(event.type);
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
