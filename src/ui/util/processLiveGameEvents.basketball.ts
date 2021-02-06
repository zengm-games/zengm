import { getPeriodName } from "../../common";
import { helpers } from "../../ui/util";

// Mutates boxScore!!!
const processLiveGameEvents = ({
	events,
	boxScore,
	overtimes,
	quarters,
}: {
	events: any[];
	boxScore: any;
	overtimes: number;
	quarters: string[];
}) => {
	let stop = false;
	let text;
	while (!stop && events.length > 0) {
		const e = events.shift();

		// Swap teams order, so home team is at bottom in box score
		const actualT = e.t === 0 ? 1 : 0;

		// Hacky quarter stuff, ugh
		if (e.text && e.text.startsWith("Start of")) {
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
			} else {
				boxScore.quarter = `${helpers.ordinal(quarter)} ${getPeriodName(
					boxScore.numPeriods,
				)}`;
				quarters.push(`Q${quarter}`);
			}
		}

		if (e.type === "text") {
			if (e.text === "End of game" || e.text.startsWith("Start of")) {
				text = e.text;
			} else if (actualT === 0 || actualT === 1) {
				text = `${boxScore.elamTarget === undefined ? `${e.time} - ` : ""}${
					boxScore.teams[actualT].abbrev
				} - ${e.text}`;
			} else {
				text = e.text;
			}

			if (e.injuredPID !== undefined) {
				const p = boxScore.teams[actualT].players.find(
					(p2: any) => p2.pid === e.injuredPID,
				);
				if (p === undefined) {
					console.log("Can't find injured player", e);
				}
				p.injury = {
					type: "Injured",
					gamesRemaining: -1,
				};
			}

			boxScore.time = e.time;

			stop = true;
		} else if (e.type === "sub") {
			for (let i = 0; i < boxScore.teams[actualT].players.length; i++) {
				if (boxScore.teams[actualT].players[i].pid === e.on) {
					boxScore.teams[actualT].players[i].inGame = true;
				} else if (boxScore.teams[actualT].players[i].pid === e.off) {
					boxScore.teams[actualT].players[i].inGame = false;
				}
			}
		} else if (e.type === "stat") {
			// Quarter-by-quarter score
			if (e.s === "pts") {
				const ptsQtrs = boxScore.teams[actualT].ptsQtrs;
				ptsQtrs[e.qtr] += e.amt;
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
				boxScore.teams[actualT].players[e.p][e.s] += e.amt;
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
			}
		} else if (e.type === "elamActive") {
			text = `Elam Ending activated! First team to ${e.target} wins.`;
			boxScore.elamTarget = e.target;

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
