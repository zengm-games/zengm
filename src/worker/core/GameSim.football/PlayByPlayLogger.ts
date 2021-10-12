import { getPeriodName } from "../../../common";
import { g, helpers } from "../../util";
import type { PlayType, TeamNum } from "./types";

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

class PlayByPlayLogger {
	active: boolean;

	playByPlay: any[];

	twoPointConversionTeam: number | undefined;

	quarter: string;

	constructor(active: boolean) {
		this.active = active;
		this.playByPlay = [];
		this.quarter = "Q1";
	}

	logEvent(
		type: PlayType,
		{
			automaticFirstDown,
			clock,
			count,
			decision,
			injuredPID,
			lost,
			made,
			names,
			offense,
			offsetStatus,
			penaltyName,
			quarter,
			overtimes,
			safety,
			success,
			t,
			tackOn,
			td,
			touchback,
			yds,
			spotFoul,
			halfDistanceToGoal,
			placeOnOne,
		}: {
			automaticFirstDown?: boolean;
			clock: number;
			count?: number;
			decision?: "accept" | "decline";
			injuredPID?: number;
			lost?: boolean;
			made?: boolean;
			names?: string[];
			offense?: boolean;
			offsetStatus?: "offset" | "overrule";
			penaltyName?: string;
			quarter?: number;
			overtimes?: number;
			safety?: boolean;
			success?: boolean;
			t?: TeamNum;
			tackOn?: boolean;
			td?: boolean;
			touchback?: boolean;
			yds?: number;
			spotFoul?: boolean;
			halfDistanceToGoal?: boolean;
			placeOnOne?: boolean;
		},
	) {
		// Handle touchdowns, 2 point conversions, and 2 point conversion returns by the defense
		let touchdownText = "a touchdown";
		let showYdsOnTD = true;

		if (this.twoPointConversionTeam !== undefined) {
			if (this.twoPointConversionTeam === t) {
				touchdownText = "a two point conversion";
				showYdsOnTD = false;
			} else {
				touchdownText = "two points";
			}
		}

		let text;

		if (this.playByPlay !== undefined) {
			if (type === "injury") {
				if (names === undefined) {
					throw new Error("Missing names");
				}

				text = `${names[0]} was injured!`;
			} else if (type === "quarter") {
				if (quarter === undefined) {
					throw new Error("Missing quarter");
				}

				text = `Start of ${helpers.ordinal(quarter)} ${getPeriodName(
					g.get("numPeriods"),
				)}`;

				this.quarter = `Q${quarter}`;
			} else if (type === "overtime") {
				if (overtimes === undefined) {
					throw new Error("Missing overtimes");
				}
				this.quarter = `OT${overtimes}`;
				text = `Start of ${
					overtimes === 1 ? "" : `${helpers.ordinal(overtimes)} `
				} overtime`;
			} else if (type === "gameOver") {
				text = "End of game";
			} else if (type === "kickoff") {
				if (names === undefined) {
					throw new Error("Missing names");
				}

				if (yds === undefined) {
					throw new Error("Missing yds");
				}

				text = `${names[0]} kicked off${
					touchback
						? " for a touchback"
						: yds < 0
						? " into the end zone"
						: ` to the ${yds} yard line`
				}`;
			} else if (type === "kickoffReturn") {
				if (names === undefined) {
					throw new Error("Missing names");
				}

				if (yds === undefined) {
					throw new Error("Missing yds");
				}

				text = `${names[0]} returned the kickoff ${yds} yards${
					td ? " for a touchdown!" : ""
				}`;
			} else if (type === "onsideKick") {
				if (names === undefined) {
					throw new Error("Missing names");
				}

				text = `${names[0]} gets ready to attempt an onside kick`;
			} else if (type === "onsideKickRecovery") {
				if (success === undefined) {
					throw new Error("Missing success");
				}

				if (td === undefined) {
					throw new Error("Missing td");
				}

				text = `The onside kick was recovered by ${
					success
						? "the kicking team!"
						: `the receiving team${td ? " and returned for a touchdown!" : ""}`
				}`;
			} else if (type === "punt") {
				if (names === undefined) {
					throw new Error("Missing names");
				}

				if (yds === undefined) {
					throw new Error("Missing yds");
				}

				text = `${names[0]} punted ${yds} yards${
					touchback ? " for a touchback" : yds < 0 ? " into the end zone" : ""
				}`;
			} else if (type === "puntReturn") {
				if (names === undefined) {
					throw new Error("Missing names");
				}

				if (yds === undefined) {
					throw new Error("Missing yds");
				}

				text = `${names[0]} returned the punt ${yds} yards${
					td ? " for a touchdown!" : ""
				}`;
			} else if (type === "extraPoint") {
				if (names === undefined) {
					throw new Error("Missing names");
				}

				text = `${names[0]} ${made ? "made" : "missed"} the extra point`;
			} else if (type === "fieldGoal") {
				if (names === undefined) {
					throw new Error("Missing names");
				}

				if (yds === undefined) {
					throw new Error("Missing yds");
				}

				text = `${names[0]} ${
					made ? "made" : "missed"
				} a ${yds} yard field goal`;
			} else if (type === "fumble") {
				if (names === undefined) {
					throw new Error("Missing names");
				}

				text = `${names[0]} fumbled the ball!`;
			} else if (type === "fumbleRecovery") {
				if (names === undefined) {
					throw new Error("Missing names");
				}

				if (yds === undefined) {
					throw new Error("Missing yds");
				}

				if (safety || touchback) {
					text = `${
						names[0]
					} recovered the fumble in the endzone, resulting in a ${
						safety ? "safety!" : "touchback"
					}`;
				} else if (lost) {
					text = `${names[0]} recovered the fumble for the defense ${
						td && yds < 1
							? `in the endzone for ${touchdownText}!`
							: `and returned it ${yds} yards${
									td ? ` for ${touchdownText}!` : ""
							  }`
					}`;
				} else {
					text = `${names[0]} recovered the fumble for the offense${
						td ? ` and carried it into the endzone for ${touchdownText}!` : ""
					}`;
				}
			} else if (type === "interception") {
				if (names === undefined) {
					throw new Error("Missing names");
				}

				if (yds === undefined) {
					throw new Error("Missing yds");
				}

				text = `${names[0]} intercepted the pass `;
				if (touchback) {
					text += "in the endzone";
				} else {
					text += `and returned it ${yds} yards${
						td ? ` for ${touchdownText}!` : ""
					}`;
				}
			} else if (type === "sack") {
				if (names === undefined) {
					throw new Error("Missing names");
				}

				if (yds === undefined) {
					throw new Error("Missing yds");
				}

				text = `${names[0]} was sacked by ${names[1]} for a ${
					safety ? "safety!" : `${Math.abs(yds)} yard loss`
				}`;
			} else if (type === "dropback") {
				if (names === undefined) {
					throw new Error("Missing names");
				}

				text = `${names[0]} drops back to pass`;
			} else if (type === "passComplete") {
				if (names === undefined) {
					throw new Error("Missing names");
				}

				if (td === undefined) {
					throw new Error("Missing td");
				}

				if (yds === undefined) {
					throw new Error("Missing yds");
				}

				if (safety) {
					text = `${names[0]} completed a pass to ${names[1]} but he was tackled in the endzone for a safety!`;
				} else {
					const result = descriptionYdsTD(yds, td, touchdownText, showYdsOnTD);
					text = `${names[0]} completed a pass to ${names[1]} for ${result}`;
				}
			} else if (type === "passIncomplete") {
				if (names === undefined) {
					throw new Error("Missing names");
				}

				text = `Incomplete pass to ${names[1]}`;
			} else if (type === "handoff") {
				if (names === undefined) {
					throw new Error("Missing names");
				}

				if (names.length > 1) {
					// If names.length is 1, its a QB keeper, no need to log the handoff
					text = `${names[0]} hands the ball off to ${names[1]}`;
				}
			} else if (type === "run") {
				if (names === undefined) {
					throw new Error("Missing names");
				}

				if (td === undefined) {
					throw new Error("Missing td");
				}

				if (yds === undefined) {
					throw new Error("Missing yds");
				}

				if (safety) {
					text = `${names[0]} was tackled in the endzone for a safety!`;
				} else {
					const result = descriptionYdsTD(yds, td, touchdownText, showYdsOnTD);
					text = `${names[0]} rushed for ${result}`;
				}
			} else if (type === "penaltyCount") {
				if (count === undefined) {
					throw new Error("Missing count");
				}

				text = `There are ${count} ${
					offsetStatus === "offset" ? "offsetting " : ""
				}fouls on the play${
					offsetStatus === "offset"
						? ", the previous down will be replayed"
						: ""
				}`;
			} else if (type === "penalty") {
				if (decision === undefined) {
					throw new Error("Missing decision");
				}

				if (automaticFirstDown === undefined) {
					throw new Error("Missing automaticFirstDown");
				}

				if (names === undefined) {
					throw new Error("Missing names");
				}

				if (penaltyName === undefined) {
					throw new Error("Missing penaltyName");
				}

				if (yds === undefined) {
					throw new Error("Missing yds");
				}

				text = `Penalty, ABBREV${t} - ${penaltyName.toLowerCase()}${
					names.length > 0 ? ` on ${names[0]}` : ""
				}`;

				if (offsetStatus !== "offset") {
					const spotFoulText = tackOn
						? " from the end of the play"
						: spotFoul
						? " from the spot of the foul"
						: "";
					const automaticFirstDownText = automaticFirstDown
						? " and an automatic first down"
						: "";
					if (halfDistanceToGoal) {
						text += `, half the distance to the goal${spotFoulText}`;
					} else if (placeOnOne) {
						text += `, the ball will be placed at the 1 yard line${automaticFirstDownText}`;
					} else {
						text += `, ${yds} yards${spotFoulText}${automaticFirstDownText}`;
					}

					let decisionText;
					if (offsetStatus === "overrule") {
						decisionText = decision === "accept" ? "enforced" : "overruled";
					} else {
						decisionText = decision === "accept" ? "accepted" : "declined";
					}

					text += ` - ${decisionText}`;
				}
			} else if (type === "timeout") {
				text = `Time out, ${offense ? "offense" : "defense"}`;
			} else if (type === "twoMinuteWarning") {
				text = "Two minute warning";
			} else if (type === "kneel") {
				if (names === undefined) {
					throw new Error("Missing names");
				}

				text = `${names[0]} kneels`;
			} else if (type === "flag") {
				text = "Flag on the play";
			} else if (type === "extraPointAttempt") {
				text = "Extra point attempt";
			} else if (type === "twoPointConversion") {
				text = "Two point conversion attempt";
			} else if (type === "twoPointConversionFailed") {
				text = "Two point conversion failed";
			} else if (type === "turnoverOnDowns") {
				text = "Turnover on downs";
			} else {
				throw new Error(`No text for "${type}"`);
			}

			if (text) {
				const event: any = {
					type: "text",
					text,
					t,
					time: formatClock(clock),
					quarter: this.quarter,
				};

				if (injuredPID !== undefined) {
					event.injuredPID = injuredPID;
				}

				if (
					safety ||
					td ||
					type === "extraPoint" ||
					type === "twoPointConversionFailed" ||
					(made && type === "fieldGoal")
				) {
					event.scoringSummary = true;
				}

				this.playByPlay.push(event);
			}
		}
	}

	logStat(
		qtr: number,
		t: number,
		pid: number | undefined | null,
		s: string,
		amt: number,
	) {
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
