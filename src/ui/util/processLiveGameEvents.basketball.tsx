import { getPeriodName } from "../../common";
import { choice } from "../../common/random";
import { helpers, local } from ".";
import type { PlayByPlayEvent } from "../../worker/core/GameSim.basketball/PlayByPlayLogger";
import type { ReactNode } from "react";

const getPronoun = (pronoun: Parameters<typeof helpers.pronoun>[1]) => {
	return helpers.pronoun(local.getState().gender, pronoun);
};

let playersByPidGid: number | undefined;
let playersByPid:
	| Record<
			number,
			{
				name: string;
				inGame: boolean;
			}
	  >
	| undefined;

const getName = (pid: number) => {
	return playersByPid?.[pid]?.name ?? "???";
};

export const getText = (
	event: PlayByPlayEvent,
	boxScore: {
		numPeriods: number;
		teams: [{ pts: number }, { pts: number }];
	},
) => {
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
			texts = [`${getName(event.pid)} loses the ball out of bounds`];
		} else {
			texts = [`${getName(event.pid)} turns the ball over`];
		}
	} else if (event.type === "stl") {
		if (event.outOfBounds) {
			texts = [
				`${getName(event.pid)} knocks the ball out of bounds off ${getName(
					event.pidTov,
				)}`,
			];
		} else {
			texts = [
				`${getName(event.pid)} stole the ball from ${getName(event.pidTov)}`,
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

		texts = [`${he} slams it home!`, `${he} tips it in!`];
		weights = local.getState().gender === "male" ? [1, 1] : [0, 1];
	} else if (event.type === "fgTipInAndOne") {
		const he = getPronoun("He");

		texts = [
			`${he} slams it home, and a foul!`,
			`${he} tips it in, and a foul!`,
		];
		weights = local.getState().gender === "male" ? [1, 1] : [0, 1];
	} else if (event.type === "fgPutBack") {
		const he = getPronoun("He");

		texts = [`${he} slams it home!`, `${he} lays it in!`];
		weights = local.getState().gender === "male" ? [1, 1] : [0, 1];
	} else if (event.type === "fgPutBackAndOne") {
		const he = getPronoun("He");

		texts = [
			`${he} slams it home, and a foul!`,
			`${he} lays it in, and a foul!`,
		];
		weights = local.getState().gender === "male" ? [1, 1] : [0, 1];
	} else if (event.type === "fgAtRim") {
		const he = getPronoun("He");

		texts = [
			`${he} throws it down on ${getName(event.pidDefense)}!`,
			`${he} slams it home`,
			"The layup is good",
		];
		weights = local.getState().gender === "male" ? [1, 2, 2] : [1, 10, 1000];
	} else if (event.type === "fgAtRimAndOne") {
		const he = getPronoun("He");

		texts = [
			`${he} throws it down on ${getName(event.pidDefense)}, and a foul!`,
			`${he} slams it home, and a foul!`,
			"The layup is good, and a foul!",
		];
		weights = local.getState().gender === "male" ? [1, 2, 2] : [1, 10, 1000];
	} else if (
		event.type === "fgLowPost" ||
		event.type === "fgMidRange" ||
		event.type === "tp"
	) {
		texts = ["It's good!"];
	} else if (
		event.type === "fgLowPostAndOne" ||
		event.type === "fgMidRangeAndOne" ||
		event.type === "tpAndOne"
	) {
		texts = ["It's good, and a foul!"];
	} else if (
		event.type === "blkAtRim" ||
		event.type === "blkTipIn" ||
		event.type === "blkPutBack"
	) {
		texts = [
			`${getName(event.pid)} blocked the layup attempt`,
			`${getName(event.pid)} blocked the dunk attempt`,
		];
		if (local.getState().gender === "female") {
			weights = [1, 0];
		}
	} else if (
		event.type === "blkLowPost" ||
		event.type === "blkMidRange" ||
		event.type === "blkTp"
	) {
		texts = [`Blocked by ${getName(event.pid)}!`];
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
		texts = [`${getName(event.pid)} grabbed the offensive rebound`];
	} else if (event.type === "drb") {
		texts = [`${getName(event.pid)} grabbed the defensive rebound`];
	} else if (event.type === "gameOver") {
		texts = ["End of game"];
	} else if (event.type === "ft") {
		texts = [`${getName(event.pid)} made a free throw`];
	} else if (event.type === "missFt") {
		texts = [`${getName(event.pid)} missed a free throw`];
	} else if (event.type === "pfNonShooting") {
		texts = [`Non-shooting foul on ${getName(event.pid)}`];
	} else if (event.type === "pfBonus") {
		texts = [
			`Non-shooting foul on ${getName(
				event.pid,
			)}. They are in the penalty, so two FTs for ${getName(
				event.pidShooting,
			)}`,
		];
	} else if (event.type === "pfFG") {
		texts = [
			`Shooting foul on ${getName(event.pid)}, two FTs for ${getName(
				event.pidShooting,
			)}`,
		];
	} else if (event.type === "pfTP") {
		texts = [
			`Shooting foul on ${getName(event.pid)}, three FTs for ${getName(
				event.pidShooting,
			)}`,
		];
	} else if (event.type === "pfAndOne") {
		// More description is already in the shot text
		texts = [`Foul on ${getName(event.pid)}`];
	} else if (event.type === "foulOut") {
		texts = [
			<span className="text-danger">{getName(event.pid)} fouled out</span>,
		];
	} else if (event.type === "sub") {
		texts = [
			`Substitution: ${getName(event.pid)} for ${getName(event.pidOff)}`,
		];
	} else if (event.type === "jumpBall") {
		texts = [`${getName(event.pid)} won the jump ball`];
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
			texts = ["They run out the clock to end the game"];
		} else if (event.reason === "noShot") {
			texts = ["They didn't get a shot up before the buzzer"];
		} else {
			texts = ["The clock runs out as the defense tries to foul"];
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
			text += ` (assist: ${getName(eAny.pidAst)})`;
		}

		return text;
	} else {
		throw new Error(`No text for ${event.type}`);
	}
};

// false means assign possession to other team
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

// Mutates boxScore!!!
const processLiveGameEvents = ({
	events,
	boxScore,
	overtimes,
	quarters,
}: {
	events: PlayByPlayEvent[];
	boxScore: any;
	overtimes: number;
	quarters: string[];
}) => {
	if (
		!playersByPid ||
		boxScore.gid !== playersByPidGid ||
		events[0]?.type === "init"
	) {
		playersByPidGid = boxScore.gid;
		playersByPid = {};
		for (const t of boxScore.teams) {
			for (const p of t.players) {
				playersByPid[p.pid] = p;
			}
		}
	}
	let stop = false;
	let text;
	let t: 0 | 1 | undefined;
	let textOnly = false;

	while (!stop && events.length > 0) {
		const e = events.shift();
		if (!e) {
			continue;
		}

		const eAny = e as any;

		// Swap teams order, so home team is at bottom in box score
		const actualT = eAny.t === 0 ? 1 : eAny.t === 1 ? 0 : undefined;

		// Hacky quarter stuff, ugh
		if (
			e.type === "period" ||
			e.type === "overtime" ||
			boxScore.quarter === ""
		) {
			boxScore.teams[0].ptsQtrs.push(0);
			boxScore.teams[1].ptsQtrs.push(0);
			const quarter = boxScore.teams[0].ptsQtrs.length;
			if (quarter > boxScore.numPeriods) {
				overtimes = quarter - boxScore.numPeriods;
				if (overtimes === 1) {
					boxScore.overtime = "(OT)";
				} else if (overtimes > 1) {
					boxScore.overtime = `(${overtimes}OT)`;
				}
				boxScore.quarter = `${helpers.ordinal(overtimes)} overtime`;
				boxScore.quarterShort = overtimes === 1 ? "OT" : `${overtimes}OT`;
			} else {
				boxScore.quarter = `${helpers.ordinal(quarter)} ${getPeriodName(
					boxScore.numPeriods,
				)}`;
				boxScore.quarterShort = `${getPeriodName(
					boxScore.numPeriods,
					true,
				)}${quarter}`;
				quarters.push(boxScore.quarterShort);
			}
		} else if (e.type === "shootoutStart") {
			boxScore.shootout = true;
			boxScore.teams[0].sPts = 0;
			boxScore.teams[0].sAtt = 0;
			boxScore.teams[1].sPts = 0;
			boxScore.teams[1].sAtt = 0;
		}

		if (e.type === "stat") {
			// Quarter-by-quarter score
			if (e.s === "pts") {
				const ptsQtrs = boxScore.teams[actualT!].ptsQtrs;
				ptsQtrs[ptsQtrs.length - 1] += e.amt;
				boxScore.teams[actualT!].ptsQtrs = ptsQtrs;
			}

			// Everything else
			if (
				e.s === "min" ||
				e.s === "fg" ||
				e.s === "fga" ||
				e.s === "tp" ||
				e.s === "tpa" ||
				e.s === "ft" ||
				e.s === "fta" ||
				e.s === "orb" ||
				e.s === "drb" ||
				e.s === "ast" ||
				e.s === "tov" ||
				e.s === "stl" ||
				e.s === "blk" ||
				e.s === "ba" ||
				e.s === "pf" ||
				e.s === "pts"
			) {
				const p = playersByPid[e.pid!];
				(p as any)[e.s] += e.amt;
				boxScore.teams[actualT!][e.s] += e.amt;

				if (e.s === "pts") {
					for (let j = 0; j < 2; j++) {
						for (let k = 0; k < boxScore.teams[j].players.length; k++) {
							if (boxScore.teams[j].players[k].inGame) {
								boxScore.teams[j].players[k].pm +=
									actualT === j ? e.amt : -e.amt;
							}
						}
					}
				}
			} else if (e.s === "gs") {
				const p = playersByPid[e.pid!];
				p.inGame = true;
			} else if (e.s === "sPts" || e.s === "sAtt") {
				// Shootout
				boxScore.teams[actualT!][e.s] += e.amt;
			}
		} else if (e.type === "timeouts") {
			// Reversed for actualT
			boxScore.teams[0].timeouts = e.timeouts[1];
			boxScore.teams[1].timeouts = e.timeouts[0];
		} else if (e.type !== "init") {
			text = getText(e, boxScore);
			t = actualT;
			textOnly =
				e.type === "gameOver" ||
				e.type === "period" ||
				e.type === "overtime" ||
				e.type === "elamActive" ||
				e.type === "shootoutStart" ||
				e.type === "shootoutTie" ||
				e.type === "shootoutTeam";

			let time;
			if (eAny.clock !== undefined) {
				const seconds = eAny.clock;
				if (seconds <= 59.9) {
					const centiSecondsRounded = Math.ceil(seconds * 10);
					const remainingSeconds = Math.floor(centiSecondsRounded / 10);
					const remainingCentiSeconds = centiSecondsRounded % 10;
					time = `${remainingSeconds}.${remainingCentiSeconds}`;
				} else {
					const secondsRounded = Math.ceil(seconds);
					const minutes = Math.floor(secondsRounded / 60);
					const remainingSeconds = secondsRounded % 60;
					const formattedSeconds =
						remainingSeconds < 10 ? `0${remainingSeconds}` : remainingSeconds;
					time = `${minutes}:${formattedSeconds}`;
				}
			}

			if (e.type === "injury") {
				const p = playersByPid[e.pid];
				if (p) {
					(p as any).injury = {
						type: "Injured",
						gamesRemaining: -1,
					};
				}
			}

			if (e.type === "sub") {
				playersByPid[e.pid].inGame = true;
				playersByPid[e.pidOff].inGame = false;
			} else if (e.type === "elamActive") {
				boxScore.elamTarget = e.target;
			}

			if (time) {
				boxScore.time = time;
			}

			if (Object.hasOwn(newPossessionTypes, eAny.type)) {
				boxScore.possession = newPossessionTypes[eAny.type]
					? actualT
					: actualT === 0
						? 1
						: 0;
			}

			stop = true;
		}
	}

	return {
		overtimes,
		quarters,
		t,
		text,
		textOnly,
	};
};

export default processLiveGameEvents;
