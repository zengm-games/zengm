import { getPeriodName } from "../../common";
import { choice } from "../../common/random";
import { helpers, local } from "../../ui/util";
import type { PlayByPlayEvent } from "../../worker/core/GameSim.basketball/PlayByPlayLogger";

const getPronoun = (pronoun: Parameters<typeof helpers.pronoun>[1]) => {
	return helpers.pronoun(local.getState().gender, pronoun);
};

let gid: number | undefined;
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
	let texts;
	let weights;

	let showScore = false;

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
		texts = [`${getName(event.pid)} turned the ball over`];
	} else if (event.type === "stl") {
		texts = [
			`${getName(event.pid)} stole the ball from ${getName(event.pidTov)}`,
		];
	} else if (event.type === "fgaAtRim") {
		texts = [`${getName(event.pid)} elevates for a shot at the rim`];
	} else if (event.type === "fgaLowPost") {
		texts = [`${getName(event.pid)} attempts a low post shot`];
	} else if (event.type === "fgaMidRange") {
		texts = [`${getName(event.pid)} attempts a mid-range shot`];
	} else if (event.type === "fgaTp") {
		texts = [`${getName(event.pid)} attempts a three pointer`];
	} else if (event.type === "fgaTpFake") {
		// This is for when threePointers is false
		texts = [`${getName(event.pid)} attempts a deep shot`];
	} else if (event.type === "fgAtRim") {
		const he = getPronoun("He");

		texts = [
			`${he} throws it down on ${getName(event.pidDefense)}!`,
			`${he} slams it home`,
			"The layup is good",
		];
		weights = local.getState().gender === "male" ? [1, 2, 2] : [1, 10, 1000];
		showScore = true;
	} else if (event.type === "fgAtRimAndOne") {
		const he = getPronoun("He");

		texts = [
			`${he} throws it down on ${getName(event.pidDefense)}, and a foul!`,
			`${he} slams it home, and a foul!`,
			"The layup is good, and a foul!",
		];
		weights = local.getState().gender === "male" ? [1, 2, 2] : [1, 10, 1000];
		showScore = true;
	} else if (
		event.type === "fgLowPost" ||
		event.type === "fgMidRange" ||
		event.type === "tp"
	) {
		texts = ["It's good!"];
		showScore = true;
	} else if (
		event.type === "fgLowPostAndOne" ||
		event.type === "fgMidRangeAndOne" ||
		event.type === "tpAndOne"
	) {
		texts = ["It's good, and a foul!"];
		showScore = true;
	} else if (event.type === "blkAtRim") {
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
	} else if (event.type === "missAtRim") {
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
		showScore = true;
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
		texts = [`${getName(event.pid)} fouled out`];
	} else if (event.type === "sub") {
		texts = [
			`Substitution: ${getName(event.pid)} for ${getName(event.pidOff)}`,
		];
	} else if (event.type === "jumpBall") {
		texts = [`${getName(event.pid)} won the jump ball`];
	} else if (event.type === "elamActive") {
		texts = [`Elam Ending activated! First team to ${event.target} wins.`];
	}

	if (texts) {
		let text = choice(texts, weights);

		const eAny = event as any;
		if (eAny.pidAst !== undefined) {
			text += ` (assist: ${getName(eAny.pidAst)})`;
		}

		// Show score after scoring plays
		if (showScore) {
			text += ` (${boxScore.teams[0].pts}-${boxScore.teams[1].pts})`;
		}

		return text;
	} else {
		throw new Error(`No text for ${event.type}`);
	}
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
	if (boxScore.gid !== gid) {
		gid = boxScore.gid;
		playersByPid = {};
		for (const t of boxScore.teams) {
			for (const p of t.players) {
				playersByPid[p.pid] = p;
			}
		}
	}
	let stop = false;
	let text;
	while (!stop && events.length > 0) {
		const e = events.shift();
		if (!e) {
			continue;
		}

		const eAny = e as any;

		// Swap teams order, so home team is at bottom in box score
		const actualT = eAny.t === 0 ? 1 : 0;

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
					boxScore.overtime = " (OT)";
				} else if (overtimes > 1) {
					boxScore.overtime = ` (${overtimes}OT)`;
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
		}

		if (e.type === "stat") {
			// Quarter-by-quarter score
			if (e.s === "pts") {
				const ptsQtrs = boxScore.teams[actualT].ptsQtrs;
				ptsQtrs[ptsQtrs.length - 1] += e.amt;
				boxScore.teams[actualT].ptsQtrs = ptsQtrs;
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
				const p = playersByPid![e.pid!];
				(p as any)[e.s] += e.amt;
				boxScore.teams[actualT][e.s] += e.amt;

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
				const p = playersByPid![e.pid!];
				p.inGame = true;
			}
		} else if (e.type !== "init") {
			text = getText(e, boxScore);

			let time;
			if (eAny.clock !== undefined) {
				const sec = Math.floor((eAny.clock % 1) * 60);
				const secString = sec < 10 ? `0${sec}` : `${sec}`;
				time = `${Math.floor(eAny.clock)}:${secString}`;
			}

			if (time && e.type !== "period" && e.type !== "overtime") {
				text = `${boxScore.elamTarget === undefined ? `${time} - ` : ""}${
					boxScore.teams[actualT].abbrev
				} - ${text}`;
			}

			if (e.type === "injury") {
				const p = playersByPid![e.pid];
				if (p) {
					(p as any).injury = {
						type: "Injured",
						gamesRemaining: -1,
					};
				}
			}

			if (e.type === "sub") {
				playersByPid![e.pid].inGame = true;
				playersByPid![e.pidOff].inGame = false;
			} else if (e.type === "elamActive") {
				boxScore.elamTarget = e.target;
			}

			if (time) {
				boxScore.time = time;
			}

			stop = true;
		}
	}

	return {
		overtimes,
		quarters,
		text,
	};
};

export default processLiveGameEvents;
