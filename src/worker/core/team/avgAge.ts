import { isSport } from "../../../common";

const avgAge = (
	players: {
		age: number;
		stats: {
			min: number;
			gp: number;
		};
	}[],
) => {
	let numerator = 0;
	let denominator = 0;

	for (const p of players) {
		numerator += p.age * p.stats.min * (isSport("basketball") ? p.stats.gp : 1);
		denominator += p.stats.min * (isSport("basketball") ? p.stats.gp : 1);
	}

	// Just do raw average if no mins
	if (numerator === 0 && denominator === 0) {
		for (const p of players) {
			numerator += p.age;
		}
		denominator = players.length;
	}

	return numerator / denominator;
};

export default avgAge;
