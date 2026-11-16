import { getPeriodName } from "../../common/getPeriodName.ts";
import { helpers } from "./helpers.ts";
import { local } from "./local.ts";
import type {
	PlayByPlayEventOutput,
	PlayByPlayEventScore,
} from "../../worker/core/GameSim.hockey/PlayByPlayLogger.ts";
import type { PlayerInjury } from "../../common/types.ts";
import { formatScoringSummaryEvent } from "../../common/formatScoringSummaryEvent.hockey.ts";
import { formatClock } from "../../common/formatClock.ts";
import type { PlayByPlayEvent } from "../../worker/core/GameSim/PlayByPlayLoggerBase.ts";
import {
	getEventTeam,
	LiveGamePlaybackBase,
	type LiveGameBoxScore,
	type LiveGameEntry,
} from "./LiveGamePlaybackBase.ts";

// true means the event's team has the ball, false means the other team does
const newPossessionTypes: Record<string, boolean> = {
	faceoff: true,
	gv: false,
	tk: true,
	slapshot: true,
	wristshot: true,
	shot: true,
	reboundShot: true,
	deflection: true,
};

const getText = (
	event: PlayByPlayEventOutput,
	boxScore: {
		numPeriods: number;
		time: string;
		teams: [{ abbrev: string }, { abbrev: string }];
	},
) => {
	let text;

	if (event.type === "injury") {
		text = `${event.names[0]} was injured!`;
	} else if (event.type === "quarter") {
		text = `Start of ${helpers.ordinal(event.quarter)} ${getPeriodName(
			boxScore.numPeriods,
		)}`;
	} else if (event.type === "overtime") {
		const overtimes = event.quarter - boxScore.numPeriods;
		text = `Start of ${
			overtimes === 1 ? "" : `${helpers.ordinal(overtimes)} `
		} overtime`;
	} else if (event.type === "gameOver") {
		text = "End of game";
	} else if (event.type === "hit") {
		text = `${event.names[0]} hit ${event.names[1]}`;
	} else if (event.type === "gv") {
		text = `Giveaway by ${event.names[0]}`;
	} else if (event.type === "tk") {
		text = `Takeaway by ${event.names[0]}`;
	} else if (event.type === "slapshot") {
		text = `Slapshot from ${event.names[0]}`;
	} else if (event.type === "wristshot") {
		text = `Wristshot by ${event.names[0]}`;
	} else if (event.type === "shot") {
		text = `Shot by ${event.names[0]}`;
	} else if (event.type === "reboundShot") {
		text = `Shot by ${event.names[0]} off the rebound`;
	} else if (event.type === "deflection") {
		text = `Deflected by ${event.names[0]}`;
	} else if (event.type === "block") {
		text = `Blocked by ${event.names[0]}`;
	} else if (event.type === "miss") {
		text = "Shot missed the goal";
	} else if (event.type === "save") {
		text = `Saved by ${event.names[0]}`;
	} else if (event.type === "save-freeze") {
		text = `Saved by ${event.names[0]}, and ${helpers.pronoun(
			local.getState().gender,
			"he",
		)} freezes the puck`;
	} else if (event.type === "faceoff") {
		text = `${event.names[0]} wins the faceoff against ${event.names[1]}`;
	} else if (event.type === "goal") {
		// text empty because PlayByPlayEntry handles it
		// Not empty anymore to handle showing stats
		text = `${event.names[0]}${event.totalGA ? ` (${event.totalGA[0]})` : ""}`;
		if (event.names.length > 1) {
			text += ` assisted by ${event.names[1]}${event.totalGA ? ` (${event.totalGA[1]})` : ""}`;
			if (event.names.length > 2) {
				text += ` and ${event.names[2]}${event.totalGA ? ` (${event.totalGA[2]})` : ""}`;
			}
		}
		text = (
			<>
				<br />
				<span className="text-body-secondary">{text}</span>
			</>
		);
	} else if (event.type === "offensiveLineChange") {
		text = "Offensive line change";
	} else if (event.type === "fullLineChange") {
		text = "Full line change";
	} else if (event.type === "defensiveLineChange") {
		text = "Defensive line change";
	} else if (event.type === "penalty") {
		const type =
			event.penaltyType === "major"
				? "Major"
				: event.penaltyType === "minor"
					? "Minor"
					: "Double minor";
		text = (
			<span className="text-danger">
				{type} penalty on {event.names[0]} for {event.penaltyName}
			</span>
		);
	} else if (event.type === "penaltyOver") {
		text = (
			<span className="text-danger">
				{event.names[0]} is released from the penalty box
			</span>
		);
	} else if (event.type === "pullGoalie") {
		text = (
			<span className="text-danger">
				Pulled goalie! {event.name} takes the ice
			</span>
		);
	} else if (event.type === "noPullGoalie") {
		text = (
			<span className="text-danger">
				Goalie {event.name} comes back into the game
			</span>
		);
	} else if (event.type === "shootoutStart") {
		text = `The game will now be decided by a shootout with ${event.rounds} rounds!`;
	} else if (event.type === "shootoutTeam") {
		text = `${event.names[0]} takes the puck`;
	} else if (event.type === "shootoutShot") {
		text = event.made ? "" : `Saved by ${event.goalieName}`;
	} else if (event.type === "shootoutTie") {
		text = `The shootout is tied! Teams will alternate penalty shots until there is a winner`;
	}

	if (text === undefined) {
		throw new Error(`Invalid event type "${event.type}"`);
	}

	return text;
};

type BoxScorePlayer = {
	pid: number;
	name: string;
	inGame: boolean;
	inPenaltyBox: boolean;
	injury: PlayerInjury;
	seasonStats: Record<string, number>;
};

type BoxScoreTeam = {
	abbrev: string;
	players: BoxScorePlayer[];
	pts: number;
	ptsQtrs: number[];
	sAtt?: number;
	sPts?: number;
};

type BoxScore = LiveGameBoxScore<BoxScoreTeam> & {
	scoringSummary: PlayByPlayEventScore[];
};

export class LiveGamePlaybackHockey extends LiveGamePlaybackBase<
	PlayByPlayEventOutput,
	BoxScore
> {
	protected override describeScore(entry: LiveGameEntry) {
		return {
			label: "Goal!",
			t: entry.t,
		};
	}

	protected override processEvent(e: PlayByPlayEvent<PlayByPlayEventOutput>) {
		const { boxScore, playersByPid } = this;

		let entry: LiveGameEntry | undefined;

		if (
			this.numPeriodsStarted === 0 ||
			e.type === "quarter" ||
			e.type === "overtime"
		) {
			this.startPeriod();
		}

		if (e.type === "shootoutStart") {
			this.startShootout();
		}

		if (e.type === "stat") {
			this.processStat(e);
		} else if (e.type === "playersOnIce") {
			for (const p of boxScore.teams[e.t].players) {
				p.inGame = e.pids.includes(p.pid);
			}
		} else if (e.type !== "init") {
			if (e.type === "injury") {
				const p = playersByPid[e.injuredPID]!;
				p.injury = {
					type: "Injured",
					gamesRemaining: -1,
				};
			} else if (e.type === "penalty") {
				const p = playersByPid[e.penaltyPID]!;
				p.inPenaltyBox = true;
			} else if (e.type === "penaltyOver") {
				const p = playersByPid[e.penaltyPID]!;
				p.inPenaltyBox = false;
			}

			entry = {
				t: getEventTeam(e),
				text: getText(e, boxScore),
				textOnly:
					e.type === "gameOver" ||
					e.type === "quarter" ||
					e.type === "overtime" ||
					e.type === "shootoutStart" ||
					e.type === "shootoutTie",
			};
			boxScore.time = formatClock(e.clock);

			this.updatePossession(e, newPossessionTypes);
		}

		//  Handle filtering of scoringSummary
		const scoringSummaryEvent = formatScoringSummaryEvent(e);
		if (scoringSummaryEvent) {
			boxScore.scoringSummary = [
				...boxScore.scoringSummary,
				scoringSummaryEvent,
			];
		}

		return entry;
	}
}
