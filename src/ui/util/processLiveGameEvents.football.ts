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
	let e: any;
	let possessionChange: boolean = false;

	// Would be better to use event type, if it was available here like in hockey
	const possessionChangeTexts = [
		" kicked off ",
		" punted ",
		" recovered the fumble for the defense",
		" recovered the fumble in the endzone, resulting in a safety!",
		" intercepted the pass ",
		" gets ready to attempt an onside kick",
		"Turnover on downs",
	];

	while (!stop && events.length > 0) {
		e = events.shift();

		// Swap teams order, so home team is at bottom in box score
		const actualT = e.t === 0 ? 1 : 0;

		if (e.quarter !== undefined && !quarters.includes(e.quarter)) {
			quarters.push(e.quarter);
			boxScore.teams[0].ptsQtrs.push(0);
			boxScore.teams[1].ptsQtrs.push(0);

			const ptsQtrs = boxScore.teams[0].ptsQtrs;
			if (ptsQtrs.length > boxScore.numPeriods) {
				overtimes += 1;
				if (overtimes === 1) {
					boxScore.overtime = " (OT)";
				} else if (overtimes > 1) {
					boxScore.overtime = ` (${overtimes}OT)`;
				}
				boxScore.quarter = `${helpers.ordinal(overtimes)} overtime`;
			} else {
				boxScore.quarter = `${helpers.ordinal(ptsQtrs.length)} ${getPeriodName(
					boxScore.numPeriods,
				)}`;
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

			possessionChange = possessionChangeTexts.some(text =>
				e.text.includes(text),
			);

			// Must include parens so it does not collide with ABBREV0 and ABBREV1 for penalties lol
			text = e.text.replace("(ABBREV)", `(${boxScore.teams[actualT].abbrev})`);
			boxScore.time = e.time;
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
							p[e.s] = e.amt;
						} else {
							p[e.s] += e.amt;
						}
					}
				}
				boxScore.teams[actualT][e.s] += e.amt;
			}
		} else if (e.type === "removeLastScore") {
			boxScore.scoringSummary.pop();
		}

		if (e.scoringSummary) {
			boxScore.scoringSummary.push({
				...e,
				t: actualT,
			});
		}
	}

	return {
		overtimes,
		possessionChange,
		quarters,
		text,
	};
};

export default processLiveGameEvents;
