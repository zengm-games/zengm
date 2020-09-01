import { helpers } from "../../ui/util";

// For strings of a format like 1:23 (times), which is greater? 1 for first, -1 for second, 0 for tie
const cmpTime = (t1: string, t2: string) => {
	const [min1, sec1] = t1.split(":").map(x => parseInt(x, 10));
	const [min2, sec2] = t2.split(":").map(x => parseInt(x, 10));

	if (min1 > min2) {
		return 1;
	}
	if (min1 < min2) {
		return -1;
	}
	if (sec1 > sec2) {
		return 1;
	}
	if (sec1 < sec2) {
		return -1;
	}
	return 0;
};

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

		if (e.quarter !== undefined && !quarters.includes(e.quarter)) {
			quarters.push(e.quarter);
			boxScore.teams[0].ptsQtrs.push(0);
			boxScore.teams[1].ptsQtrs.push(0);

			const ptsQtrs = boxScore.teams[0].ptsQtrs;
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

			boxScore.time = e.time;
		}

		if (e.type === "text") {
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

			text = e.text;
			stop = true;
		} else if (e.type === "clock") {
			if (typeof e.awaitingKickoff === "number") {
				text = `${e.time} - ${boxScore.teams[actualT].abbrev} kicking off`;
			} else {
				let fieldPos = "";
				if (e.scrimmage === 50) {
					fieldPos = "50 yd line";
				} else if (e.scrimmage > 50) {
					fieldPos = `opp ${100 - e.scrimmage}`;
				} else {
					fieldPos = `own ${e.scrimmage}`;
				}

				text = `${e.time} - ${
					boxScore.teams[actualT].abbrev
				} ball, ${helpers.ordinal(e.down)} & ${e.toGo}, ${fieldPos}`;
			}

			boxScore.time = e.time;
			stop = true;
		} else if (e.type === "stat") {
			// Quarter-by-quarter score
			if (e.s === "pts") {
				const ptsQtrs = boxScore.teams[actualT].ptsQtrs;
				ptsQtrs[ptsQtrs.length - 1] += e.amt;
				boxScore.teams[actualT].ptsQtrs = ptsQtrs;
			}

			// Everything else
			if (boxScore.teams[actualT].hasOwnProperty(e.s) && e.s !== "min") {
				if (e.pid !== undefined) {
					const p = boxScore.teams[actualT].players.find(
						(p2: any) => p2.pid === e.pid,
					);
					if (p === undefined) {
						console.log("Can't find player", e);
					}
					if (p) {
						if (e.s.endsWith("Lng")) {
							if (e.amt > p[e.s]) {
								p[e.s] = e.amt;
							}
						} else {
							p[e.s] += e.amt;
						}
					}
				}
				boxScore.teams[actualT][e.s] += e.amt;
			}
		}
	}

	//  Handle filtering of scoringSummary
	if (boxScore.scoringSummary && boxScore.time !== undefined) {
		for (const event of boxScore.scoringSummary) {
			if (event.time === undefined) {
				continue;
			}

			if (event.hide === false) {
				// Already past, no need to check again
				continue;
			}

			if (!quarters.includes(event.quarter)) {
				// Future quarters
				event.hide = true;
			} else if (event.quarter !== quarters[quarters.length - 1]) {
				// Past quarters
				event.hide = false;
			} else {
				// Current quarter
				event.hide = cmpTime(event.time, boxScore.time) === -1;
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
