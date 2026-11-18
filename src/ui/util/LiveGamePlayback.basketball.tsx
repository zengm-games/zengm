import { getPeriodName } from "../../common/getPeriodName.ts";
import { choice } from "../../common/random.ts";
import { helpers } from "./helpers.ts";
import { local } from "./local.ts";
import type { PlayByPlayEventOutput } from "../../worker/core/GameSim.basketball/PlayByPlayLogger.ts";
import type { ReactNode } from "react";
import { formatClock } from "../../common/formatClock.ts";
import { formatLiveGameStat } from "./formatLiveGameStat.ts";
import type {
	PlayByPlayEvent,
	PlayByPlayEventStat,
} from "../../worker/core/GameSim/PlayByPlayLoggerBase.ts";
import type { PlayerInjury } from "../../common/types.ts";
import {
	addStat,
	getEventTeam,
	LiveGamePlaybackBase,
	type LiveGameBoxScore,
	type LiveGameEntry,
} from "./LiveGamePlaybackBase.ts";

const getPronoun = (pronoun: Parameters<typeof helpers.pronoun>[1]) => {
	return helpers.pronoun(local.getState().gender, pronoun);
};

type BoxScorePlayer = {
	pid: number;
	name: string;
	inGame: boolean;
	injury: PlayerInjury;
	drb: number;
	orb: number;
	pf: number;
	pm: number;
};

type BoxScoreTeam = {
	players: BoxScorePlayer[];
	pts: number;
	ptsQtrs: number[];
	sAtt?: number;
	sPts?: number;
	timeouts: number;
};

type BoxScore = LiveGameBoxScore<BoxScoreTeam> & {
	elamTarget?: number;
};

const getText = (
	event: PlayByPlayEventOutput,
	boxScore: BoxScore,
	playersByPid: Record<number, BoxScorePlayer>,
) => {
	const getName = (pid: number) => {
		return playersByPid[pid]?.name ?? "???";
	};

	let texts: ReactNode[] | undefined;
	let weights;
	if (event.type === "period") {
		texts = [
			`Start of ${helpers.ordinal(event.period)} ${getPeriodName(
				boxScore.numPeriods,
			)}`,
		];
	} else if (event.type === "overtime") {
		const overtimes = event.period - boxScore.numPeriods;
		texts = [
			`Start of ${
				overtimes === 1 ? "" : `${helpers.ordinal(overtimes)} `
			} overtime`,
		];
	} else if (event.type === "injury") {
		texts = [`${getName(event.pid)} was injured!`];
	} else if (event.type === "tov") {
		if (event.outOfBounds) {
			texts = [
				`${getName(event.pid)} loses the ball out of bounds${formatLiveGameStat(playersByPid[event.pid], "tov")}`,
			];
		} else {
			texts = [
				`${getName(event.pid)} turns the ball over${formatLiveGameStat(playersByPid[event.pid], "tov")}`,
			];
		}
	} else if (event.type === "stl") {
		if (event.outOfBounds) {
			texts = [
				`${getName(event.pid)} knocks the ball out of bounds${formatLiveGameStat(playersByPid[event.pid], "stl")} off ${getName(
					event.pidTov,
				)}${formatLiveGameStat(playersByPid[event.pidTov], "tov")}`,
			];
		} else {
			texts = [
				`${getName(event.pid)} stole${formatLiveGameStat(playersByPid[event.pid], "stl")} the ball from ${getName(event.pidTov)}${formatLiveGameStat(playersByPid[event.pidTov], "tov")}`,
			];
		}
	} else if (event.type === "fgaTipIn") {
		texts = [
			`${getName(event.pid)} cuts to the rim as ${getName(
				event.pidPass,
			)} lobs up the inbound pass`,
		];
	} else if (event.type === "fgaPutBack") {
		texts = [`${getName(event.pid)} puts the offensive rebound back up`];
	} else if (event.type === "fgaAtRim") {
		texts = [`${getName(event.pid)} elevates for a shot at the rim`];
	} else if (event.type === "fgaLowPost") {
		texts = [`${getName(event.pid)} attempts a low post shot`];
	} else if (event.type === "fgaMidRange") {
		texts = [`${getName(event.pid)} attempts a mid-range shot`];
	} else if (event.type === "fgaTp") {
		if (event.desperation) {
			texts = [
				`${getName(event.pid)} throws up a deep three as time winds down`,
			];
		} else {
			texts = [`${getName(event.pid)} attempts a three pointer`];
		}
	} else if (event.type === "fgaTpFake") {
		// This is for when threePointers is false
		if (event.desperation) {
			texts = [
				`${getName(event.pid)} throws up a deep shot as time winds down`,
			];
		} else {
			texts = [`${getName(event.pid)} attempts a deep shot`];
		}
	} else if (event.type === "fgTipIn") {
		const he = getPronoun("He");
		texts = [
			`${he} slams it home!${formatLiveGameStat(playersByPid[event.pid], "pts")}`,
			`${he} tips it in!${formatLiveGameStat(playersByPid[event.pid], "pts")}`,
		]; // Not sure if the pronoun should be replaced
		weights = local.getState().gender === "male" ? [1, 1] : [0, 1];
	} else if (event.type === "fgTipInAndOne") {
		const he = getPronoun("He");
		texts = [
			`${he} slams it home${formatLiveGameStat(playersByPid[event.pid], "pts")}, and a foul!`,
			`${he} tips it in${formatLiveGameStat(playersByPid[event.pid], "pts")}, and a foul!`,
		];
		weights = local.getState().gender === "male" ? [1, 1] : [0, 1];
	} else if (event.type === "fgPutBack") {
		const he = getPronoun("He");
		texts = [
			`${he} slams it home!${formatLiveGameStat(playersByPid[event.pid], "pts")}`,
			`${he} lays it in!${formatLiveGameStat(playersByPid[event.pid], "pts")}`,
		];
		weights = local.getState().gender === "male" ? [1, 1] : [0, 1];
	} else if (event.type === "fgPutBackAndOne") {
		const he = getPronoun("He");

		texts = [
			`${he} slams it home, and a foul!${formatLiveGameStat(playersByPid[event.pid], "pts")}`,
			`${he} lays it in, and a foul!${formatLiveGameStat(playersByPid[event.pid], "pts")}`,
		];
		weights = local.getState().gender === "male" ? [1, 1] : [0, 1];
	} else if (event.type === "fgAtRim") {
		const he = getPronoun("He");

		texts = [
			`${he} throws it down on ${getName(event.pidDefense)}!${formatLiveGameStat(playersByPid[event.pid], "pts")}`,
			`${he} slams it home${formatLiveGameStat(playersByPid[event.pid], "pts")}`,
			`The layup is good${formatLiveGameStat(playersByPid[event.pid], "pts")}`,
		];
		weights = local.getState().gender === "male" ? [1, 2, 2] : [1, 10, 1000];
	} else if (event.type === "fgAtRimAndOne") {
		const he = getPronoun("He");
		texts = [
			`${he} throws it down on ${getName(event.pidDefense)}, and a foul!${formatLiveGameStat(playersByPid[event.pid], "pts")}`,
			`${he} slams it home, and a foul!${formatLiveGameStat(playersByPid[event.pid], "pts")}`,
			`The layup is good, and a foul!${formatLiveGameStat(playersByPid[event.pid], "pts")}`,
		];
		weights = local.getState().gender === "male" ? [1, 2, 2] : [1, 10, 1000];
	} else if (
		event.type === "fgLowPost" ||
		event.type === "fgMidRange" ||
		event.type === "tp"
	) {
		texts = [`It's good!${formatLiveGameStat(playersByPid[event.pid], "pts")}`];
	} else if (
		event.type === "fgLowPostAndOne" ||
		event.type === "fgMidRangeAndOne" ||
		event.type === "tpAndOne"
	) {
		texts = [
			`It's good and a foul!${formatLiveGameStat(playersByPid[event.pid], "pts")}`,
		];
	} else if (
		event.type === "blkAtRim" ||
		event.type === "blkTipIn" ||
		event.type === "blkPutBack"
	) {
		texts = [
			`${getName(event.pid)} blocked the layup attempt${formatLiveGameStat(playersByPid[event.pid], "blk")}`,
			`${getName(event.pid)} blocked the dunk attempt${formatLiveGameStat(playersByPid[event.pid], "blk")}`,
		];
		if (local.getState().gender === "female") {
			weights = [1, 0];
		}
	} else if (
		event.type === "blkLowPost" ||
		event.type === "blkMidRange" ||
		event.type === "blkTp"
	) {
		texts = [
			`Blocked by ${getName(event.pid)}!${formatLiveGameStat(playersByPid[event.pid], "blk")}`,
		];
	} else if (event.type === "missTipIn") {
		const he = getPronoun("He");
		texts = [`${he} blows the layup`, `${he} blows the dunk`, "No good"];
		if (local.getState().gender === "female") {
			weights = [1, 0, 1];
		}
	} else if (event.type === "missAtRim" || event.type === "missPutBack") {
		texts = [
			`${getPronoun("He")} missed the layup`,
			"The layup attempt rolls out",
			"No good",
		];
		weights = [1, 1, 3];
	} else if (
		event.type === "missLowPost" ||
		event.type === "missMidRange" ||
		event.type === "missTp"
	) {
		texts = ["The shot rims out", "No good", `${getPronoun("He")} bricks it`];
		weights = [1, 4, 1];
	} else if (event.type === "orb") {
		const p = playersByPid[event.pid]!;
		const trb = p.drb + p.orb;
		texts = [
			`${getName(event.pid)} grabbed the offensive rebound${formatLiveGameStat(trb, "trb")}`,
		];
	} else if (event.type === "drb") {
		const p = playersByPid[event.pid]!;
		const trb = p.drb + p.orb;

		texts = [
			`${getName(event.pid)} grabbed the defensive rebound${formatLiveGameStat(trb, "trb")}`,
		];
	} else if (event.type === "gameOver") {
		texts = ["End of game"];
	} else if (event.type === "ft") {
		texts = [
			`${getName(event.pid)} made a free throw${formatLiveGameStat(playersByPid[event.pid], "pts")}`,
		];
	} else if (event.type === "missFt") {
		texts = [`${getName(event.pid)} missed a free throw`];
	} else if (event.type === "pfNonShooting") {
		texts = [
			`Non-shooting foul on ${getName(event.pid)}${formatLiveGameStat(playersByPid[event.pid], "pf")}`,
		];
	} else if (event.type === "pfBonus") {
		texts = [
			<>
				Non-shooting foul on {getName(event.pid)}
				{formatLiveGameStat(playersByPid[event.pid], "pf")}
				<br />
				They are in the penalty, so two FTs for {getName(event.pidShooting)}
			</>,
		];
	} else if (event.type === "pfFG") {
		texts = [
			<>
				Shooting foul on {getName(event.pid)}
				{formatLiveGameStat(playersByPid[event.pid], "pf")}
				<br />
				Two FTs for {getName(event.pidShooting)}
			</>,
		];
	} else if (event.type === "pfTP") {
		texts = [
			<>
				Shooting foul on {getName(event.pid)}
				{formatLiveGameStat(playersByPid[event.pid], "pf")}
				<br />
				Three FTs for {getName(event.pidShooting)}
			</>,
		];
	} else if (event.type === "foulOut") {
		texts = [
			<span className="text-danger">{getName(event.pid)} fouled out</span>,
		];
	} else if (event.type === "sub") {
		texts = [
			<>
				On: {event.pids.map((pid) => getName(pid)).join(", ")}
				<br />
				Off: {event.pidsOff.map((pid) => getName(pid)).join(", ")}
			</>,
		];
	} else if (event.type === "jumpBall") {
		texts = [
			`${getName(event.pid)} won the jump ball against ${getName(event.pid2)}`,
		];
	} else if (event.type === "elamActive") {
		texts = [`Elam Ending activated! First team to ${event.target} wins.`];
	} else if (event.type === "timeout") {
		texts = [
			`Timeout (${event.numLeft} remaining)${
				event.advancesBall ? ", the ball is advanced to half court" : ""
			}`,
		];
	} else if (event.type === "endOfPeriod") {
		if (event.reason === "runOutClock") {
			texts = ["They ran out the clock to end the game"];
		} else if (event.reason === "noShot") {
			texts = ["They didn't get a shot up before the buzzer"];
		} else {
			texts = ["The clock ran out as the defense tried to foul"];
		}
	} else if (event.type === "outOfBounds") {
		texts = [`Out of bounds, last touched by the ${event.on}`];
	} else if (event.type === "shootoutStart") {
		texts = [
			`The game will now be decided by a three-point shootout with ${event.rounds} rounds!`,
		];
	} else if (event.type === "shootoutTeam") {
		texts = [`${getName(event.pid)} steps up to the line`];
	} else if (event.type === "shootoutShot") {
		const he = getPronoun("He");
		texts = event.made
			? ["It's good!", "Swish!", "It rattles around but goes in!"]
			: [
					"It rims out!",
					`${he} bricks it!`,
					`${he} misses everything, airball!`,
				];
		weights = event.made ? [1, 0.25, 0.25] : [1, 0.1, 0.01];
	} else if (event.type === "shootoutTie") {
		texts = [
			"The shootout is tied! Players will alternate shots until there is a winner",
		];
	}

	if (texts) {
		let text = choice(texts, weights);

		const eAny = event as any;
		if (eAny.pidAst !== undefined) {
			text = (
				<>
					{text}
					<br />
					<span className="text-body-secondary">
						Assisted by {getName(eAny.pidAst)}
						{formatLiveGameStat(playersByPid[eAny.pidAst], "ast")}
					</span>
				</>
			);
		}

		if (eAny.pidFoul !== undefined) {
			// Hack! Need to add 1 because the pf stat is not logged until after this event, and it's tricky to fix that
			const pf = playersByPid[eAny.pidFoul]!.pf + 1;
			text = (
				<>
					{text}
					<br />
					<span className="text-body-secondary">
						Foul on {getName(eAny.pidFoul)}
						{formatLiveGameStat(pf, "pf")}
					</span>
				</>
			);
		}

		return text;
	} else {
		throw new Error(`No text for ${event.type}`);
	}
};

// See updatePossession
const newPossessionTypes: Record<string, boolean> = {
	fgAtRim: true,
	fgAtRimAndOne: true,
	fgLowPost: true,
	fgLowPostAndOne: true,
	fgMidRange: true,
	fgMidRangeAndOne: true,
	ft: true,
	tp: true,
	tpAndOne: true,
	drb: true,
	fgaTipIn: true,
	fgaPutBack: true,
	fgaAtRim: true,
	fgaLowPost: true,
	fgaMidRange: true,
	fgaTp: true,
	fgaTpFake: true,
	jumpBall: true,
	missAtRim: true,
	missFt: true,
	missLowPost: true,
	missMidRange: true,
	missTp: true,
	orb: true,
	stl: true,
	tov: false,
	timeout: true,
	endOfPeriod: true,
};

const PLAYER_AND_TEAM_STATS = new Set([
	"min",
	"fg",
	"fga",
	"tp",
	"tpa",
	"ft",
	"fta",
	"orb",
	"drb",
	"ast",
	"tov",
	"stl",
	"blk",
	"ba",
	"pf",
	"pts",
]);

export class LiveGamePlaybackBasketball extends LiveGamePlaybackBase<
	PlayByPlayEventOutput,
	BoxScore
> {
	protected override getClockText() {
		// No clock in the Elam Ending
		if (this.boxScore.elamTarget !== undefined) {
			return `Target: ${this.boxScore.elamTarget}`;
		}

		return super.getClockText();
	}

	protected override processStat(e: PlayByPlayEventStat) {
		const { boxScore, playersByPid } = this;

		this.addPeriodPts(e);

		if (PLAYER_AND_TEAM_STATS.has(e.s)) {
			addStat(playersByPid[e.pid!]!, e.s, e.amt);
			addStat(boxScore.teams[e.t], e.s, e.amt);

			if (e.s === "pts") {
				for (const t of [0, 1] as const) {
					for (const p of boxScore.teams[t].players) {
						if (p.inGame) {
							p.pm += e.t === t ? e.amt : -e.amt;
						}
					}
				}
			}
		} else if (e.s === "gs") {
			playersByPid[e.pid!]!.inGame = true;
		} else if (e.s === "sPts" || e.s === "sAtt") {
			// Shootout
			addStat(boxScore.teams[e.t], e.s, e.amt);
		}
	}

	protected override processEvent(
		e: PlayByPlayEvent<PlayByPlayEventOutput>,
	): LiveGameEntry | undefined {
		const { boxScore, playersByPid } = this;

		this.startPeriodIfNeeded(e.type === "period" || e.type === "overtime");

		if (e.type === "shootoutStart") {
			this.startShootout();
		}

		if (e.type === "stat") {
			this.processStat(e);
			return;
		}

		if (e.type === "timeouts") {
			boxScore.teams[0].timeouts = e.timeouts[0];
			boxScore.teams[1].timeouts = e.timeouts[1];
			return;
		}

		if (e.type === "init") {
			return;
		}

		const entry = {
			t: getEventTeam(e),
			text: getText(e, boxScore, playersByPid),
			textOnly:
				e.type === "gameOver" ||
				e.type === "period" ||
				e.type === "overtime" ||
				e.type === "elamActive" ||
				e.type === "shootoutStart" ||
				e.type === "shootoutTie" ||
				e.type === "shootoutTeam",
		};

		if (e.type === "injury") {
			const p = playersByPid[e.pid];
			if (p) {
				p.injury = {
					type: "Injured",
					gamesRemaining: -1,
				};
			}
		}

		if (e.type === "sub") {
			for (const pid of e.pids) {
				playersByPid[pid]!.inGame = true;
			}
			for (const pid of e.pidsOff) {
				playersByPid[pid]!.inGame = false;
			}
		} else if (e.type === "elamActive") {
			boxScore.elamTarget = e.target;
		}

		const { clock } = e as { clock?: number };
		if (clock !== undefined) {
			boxScore.time = formatClock(clock);
		}

		this.updatePossession(e, newPossessionTypes);

		return entry;
	}
}
