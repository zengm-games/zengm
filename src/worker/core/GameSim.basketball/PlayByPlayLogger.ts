import type { TeamNum } from "../../../common/types";
import { PlayByPlayLoggerBase } from "../GameSim/PlayByPlayLoggerBase.ts";

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

type FgMakeWithoutAstType = "fgPutBack" | "fgPutBackAndOne";
type FgMakeWithDefenderType = "fgAtRimAndOne" | "fgAtRim";
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
			pidFoul: number | undefined;
	  }
	| {
			type: FgMakeNormalType;
			t: TeamNum;
			pid: number;
			pidAst: number | undefined;
			clock: number;
			pidFoul: number | undefined;
	  }
	| {
			type: FgMakeWithoutAstType;
			t: TeamNum;
			pid: number;
			clock: number;
			pidFoul: number | undefined;
	  }
	| {
			type: "ft";
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
			type: "fgaTipIn";
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

export type PlayByPlayEventOutput =
	| PlayByPlayEventInputScore
	| PlayByPlayEventInputNoScore;

class BasketballPlayByPlayLogger extends PlayByPlayLoggerBase<PlayByPlayEventOutput> {
	logEvent(event: PlayByPlayEventOutput) {
		if (!this.active) {
			return;
		}

		this.playByPlay.push(event);
	}
}

export default BasketballPlayByPlayLogger;
