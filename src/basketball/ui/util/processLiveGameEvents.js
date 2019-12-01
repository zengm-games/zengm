import { helpers } from "../../../deion/ui/util";

// Mutates boxScore!!!
const processLiveGameEvents = ({ events, boxScore, overtimes, quarters }) => {
	let stop = false;
	let text;
	while (!stop && events.length > 0) {
		const e = events.shift();

		// Swap teams order, so home team is at bottom in box score
		const actualT = e.t === 0 ? 1 : 0;

		if (e.type === "text") {
			if (actualT === 0 || actualT === 1) {
				text = `${e.time} - ${boxScore.teams[actualT].abbrev} - ${e.text}`;
			} else {
				text = e.text;
			}

			// Show score after scoring plays
			if (text.includes("made")) {
				text += ` (${boxScore.teams[0].pts}-${boxScore.teams[1].pts})`;
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
				if (ptsQtrs.length <= e.qtr) {
					// Must be overtime! This updates ptsQtrs too.
					boxScore.teams[0].ptsQtrs.push(0);
					boxScore.teams[1].ptsQtrs.push(0);

					if (ptsQtrs.length > 4) {
						overtimes += 1;
						if (overtimes === 1) {
							boxScore.overtime = " (OT)";
						} else if (overtimes > 1) {
							boxScore.overtime = ` (${overtimes}OT)`;
						}
						boxScore.quarter = `${helpers.ordinal(overtimes)} overtime`;
					} else {
						boxScore.quarter = `${helpers.ordinal(ptsQtrs.length)} quarter`;
					}
				}
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
		}
	}

	return {
		overtimes,
		quarters,
		text,
	};
};

export default processLiveGameEvents;
