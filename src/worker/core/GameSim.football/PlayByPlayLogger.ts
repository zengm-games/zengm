import type GameSim from ".";
import { getPeriodName } from "../../../common";
import type { GameAttributesLeague } from "../../../common/types";
import { g, helpers } from "../../util";
import type { TeamNum } from "./types";

// Convert clock in minutes to min:sec, like 1.5 -> 1:30
const formatClock = (clock: number) => {
	const secNum = Math.ceil((clock % 1) * 60);

	let sec;
	if (secNum >= 60) {
		sec = "59";
	} else if (secNum < 10) {
		sec = `0${secNum}`;
	} else {
		sec = `${secNum}`;
	}

	return `${Math.floor(clock)}:${sec}`;
};

const descriptionYdsTD = (
	yds: number,
	td: boolean,
	touchdownText: string,
	showYdsOnTD: boolean,
) => {
	if (td && showYdsOnTD) {
		return `${yds} yards${td ? ` and ${touchdownText}!` : ""}`;
	}

	if (td) {
		return `${touchdownText}!`;
	}

	return `${yds} yards`;
};

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

class PlayByPlayLogger {
	active: boolean;

	playByPlay: any[];

	twoPointConversionTeam: number | undefined;

	quarter: string;

	gender: GameAttributesLeague["gender"];

	g: GameSim;

	constructor(gameSim: GameSim, active: boolean) {
		this.active = active;
		this.playByPlay = [];
		this.quarter = "Q1";
		this.gender = g.get("gender");
		this.g = gameSim;
	}

	logEvent(e: PlayByPlayEventInput) {
		// Handle touchdowns, 2 point conversions, and 2 point conversion returns by the defense
		let touchdownText = "a touchdown";
		let showYdsOnTD = true;

		if (this.twoPointConversionTeam !== undefined) {
			if (this.twoPointConversionTeam === (e as any).t) {
				touchdownText = "a two point conversion";
				showYdsOnTD = false;
			} else {
				touchdownText = "two points";
			}
		}

		let text;

		if (this.playByPlay !== undefined) {
			if (e.type === "injury") {
				text = `${e.names[0]} was injured!`;
			} else if (e.type === "quarter") {
				text = `Start of ${helpers.ordinal(e.quarter)} ${getPeriodName(
					g.get("numPeriods"),
				)}`;

				this.quarter = `Q${e.quarter}`;
			} else if (e.type === "overtime") {
				this.quarter = `OT${e.overtimes}`;
				text = `Start of ${
					e.overtimes === 1 ? "" : `${helpers.ordinal(e.overtimes)} `
				} overtime`;
			} else if (e.type === "gameOver") {
				text = "End of game";
			} else if (e.type === "kickoff") {
				text = `${e.names[0]} kicked off${
					e.touchback
						? " for a touchback"
						: e.yds < 0
						? " into the end zone"
						: ` to the ${e.yds} yard line`
				}`;
			} else if (e.type === "kickoffReturn") {
				text = `${e.names[0]} returned the kickoff ${e.yds} yards${
					e.td ? " for a touchdown!" : ""
				}`;
			} else if (e.type === "onsideKick") {
				text = `${e.names[0]} gets ready to attempt an onside kick`;
			} else if (e.type === "onsideKickRecovery") {
				text = `The onside kick was recovered by ${
					e.success
						? "the kicking team!"
						: `the receiving team${
								e.td ? " and returned for a touchdown!" : ""
						  }`
				}`;
			} else if (e.type === "punt") {
				text = `${e.names[0]} punted ${e.yds} yards${
					e.touchback
						? " for a touchback"
						: e.yds < 0
						? " into the end zone"
						: ""
				}`;
			} else if (e.type === "puntReturn") {
				text = `${e.names[0]} returned the punt ${e.yds} yards${
					e.td ? " for a touchdown!" : ""
				}`;
			} else if (e.type === "extraPoint") {
				text = `${e.names[0]} ${e.made ? "made" : "missed"} the extra point`;
			} else if (e.type === "fieldGoal") {
				text = `${e.names[0]} ${e.made ? "made" : "missed"} a ${
					e.yds
				} yard field goal`;
			} else if (e.type === "fumble") {
				text = `${e.names[0]} fumbled the ball!`;
			} else if (e.type === "fumbleRecovery") {
				if (e.safety || e.touchback) {
					text = `${
						e.names[0]
					} recovered the fumble in the endzone, resulting in a ${
						e.safety ? "safety!" : "touchback"
					}`;
				} else if (e.lost) {
					text = `${e.names[0]} recovered the fumble for the defense ${
						e.td && e.yds < 1
							? `in the endzone for ${touchdownText}!`
							: `and returned it ${e.yds} yards${
									e.td ? ` for ${touchdownText}!` : ""
							  }`
					}`;
				} else {
					text = `${e.names[0]} recovered the fumble for the offense${
						e.td ? ` and carried it into the endzone for ${touchdownText}!` : ""
					}`;
				}
			} else if (e.type === "interception") {
				text = `${e.names[0]} intercepted the pass `;
				if (e.touchback) {
					text += "in the endzone";
				} else {
					text += `and returned it ${e.yds} yards${
						e.td ? ` for ${touchdownText}!` : ""
					}`;
				}
			} else if (e.type === "sack") {
				text = `${e.names[0]} was sacked by ${e.names[1]} for a ${
					e.safety ? "safety!" : `${Math.abs(e.yds)} yard loss`
				}`;
			} else if (e.type === "dropback") {
				text = `${e.names[0]} drops back to pass`;
			} else if (e.type === "passComplete") {
				if (e.safety) {
					text = `${e.names[0]} completed a pass to ${
						e.names[1]
					} but ${helpers.pronoun(
						this.gender,
						"he",
					)} was tackled in the endzone for a safety!`;
				} else {
					const result = descriptionYdsTD(
						e.yds,
						e.td,
						touchdownText,
						showYdsOnTD,
					);
					text = `${e.names[0]} completed a pass to ${e.names[1]} for ${result}`;
				}
			} else if (e.type === "passIncomplete") {
				text = `Incomplete pass to ${e.names[1]}`;
			} else if (e.type === "handoff") {
				if (e.names.length > 1) {
					// If names.length is 1, its a QB keeper, no need to log the handoff
					text = `${e.names[0]} hands the ball off to ${e.names[1]}`;
				}
			} else if (e.type === "run") {
				if (e.safety) {
					text = `${e.names[0]} was tackled in the endzone for a safety!`;
				} else {
					const result = descriptionYdsTD(
						e.yds,
						e.td,
						touchdownText,
						showYdsOnTD,
					);
					text = `${e.names[0]} rushed for ${result}`;
				}
			} else if (e.type === "penaltyCount") {
				text = `There are ${e.count} ${
					e.offsetStatus === "offset" ? "offsetting " : ""
				}fouls on the play${
					e.offsetStatus === "offset"
						? ", the previous down will be replayed"
						: ""
				}`;
			} else if (e.type === "penalty") {
				text = `Penalty, ABBREV${e.t} - ${e.penaltyName.toLowerCase()}${
					e.names.length > 0 ? ` on ${e.names[0]}` : ""
				}`;

				if (e.offsetStatus !== "offset") {
					const spotFoulText = e.tackOn
						? " from the end of the play"
						: e.spotFoul
						? " from the spot of the foul"
						: "";
					const automaticFirstDownText = e.automaticFirstDown
						? " and an automatic first down"
						: "";
					if (e.halfDistanceToGoal) {
						text += `, half the distance to the goal${spotFoulText}`;
					} else if (e.placeOnOne) {
						text += `, the ball will be placed at the 1 yard line${automaticFirstDownText}`;
					} else {
						text += `, ${e.yds} yards${spotFoulText}${automaticFirstDownText}`;
					}

					let decisionText;
					if (e.offsetStatus === "overrule") {
						decisionText = e.decision === "accept" ? "enforced" : "overruled";
					} else {
						decisionText = e.decision === "accept" ? "accepted" : "declined";
					}

					text += ` - ${decisionText}`;
				}
			} else if (e.type === "timeout") {
				text = `Time out, ${e.offense ? "offense" : "defense"}`;
			} else if (e.type === "twoMinuteWarning") {
				text = "Two minute warning";
			} else if (e.type === "kneel") {
				text = `${e.names[0]} kneels`;
			} else if (e.type === "flag") {
				text = "Flag on the play";
			} else if (e.type === "extraPointAttempt") {
				text = "Extra point attempt";
			} else if (e.type === "twoPointConversion") {
				text = "Two point conversion attempt";
			} else if (e.type === "twoPointConversionFailed") {
				text = "Two point conversion failed";
			} else if (e.type === "turnoverOnDowns") {
				text = "Turnover on downs";
			} else {
				throw new Error(`No text for "${e.type}"`);
			}

			if (text) {
				const event: any = {
					type: "text",
					text,
					t: (e as any).t,
					time: formatClock(e.clock),
					quarter: this.quarter,

					// Send current scrimmage, for use in FieldAndDrive updating
					scrimmage:
						(e as any).t !== undefined
							? this.g.currentPlay.state.current.scrimmage
							: undefined,
				};

				if ((e as any).injuredPID !== undefined) {
					event.injuredPID = (e as any).injuredPID;
				}

				if (
					(e as any).safety ||
					(e as any).td ||
					e.type === "extraPoint" ||
					e.type === "twoPointConversionFailed" ||
					(e.type === "fieldGoal" && e.made)
				) {
					event.scoringSummary = true;
				}

				this.playByPlay.push(event);
			}
		}
	}

	logStat(t: number, pid: number | undefined | null, s: string, amt: number) {
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
			down,
			scrimmage,
			t,
			time: formatClock(clock),
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
