import { draft, player } from "..";
import { g, helpers } from "../../util";
import { RATINGS } from "../../../common";

const maxRatingDists = async (numPlayers: number = 100) => {
	// Each player gets one entry per array: their career max in a rating
	const ratings: {
		[key: string]: number[];
	} = {};

	for (const rating of ["ovr", ...RATINGS]) {
		ratings[rating] = [];
	}

	const ages = helpers.deepCopy(ratings);
	let playersToProcess: any[] = [];

	for (let i = 0; i < numPlayers; i++) {
		if (playersToProcess.length === 0) {
			const players = await draft.genPlayersWithoutSaving(2019, 15.5, []);
			playersToProcess = players;
		}

		const p = playersToProcess.pop(); // Log every 5%

		if (i % Math.round(numPlayers / 20) === 0) {
			console.log(`${Math.round((100 * i) / numPlayers)}%`);
		}

		const maxRatings = { ...p.ratings[0] };
		const maxAges: any = { ...ages };

		for (const key of Object.keys(maxAges)) {
			maxAges[key] = g.get("season") - p.draft.year;
		}

		for (let j = 0; j < 20; j++) {
			await player.develop(p, 1, false, 15.5, true);
			p.born.year -= 1; // Aging after develop

			for (const key of Object.keys(ratings)) {
				if (p.ratings[0][key] > maxRatings[key]) {
					maxRatings[key] = p.ratings[0][key];
					maxAges[key] = g.get("season") - p.born.year;
				}
			}
		}

		for (const key of Object.keys(ratings)) {
			ratings[key].push(maxRatings[key]);
			ages[key].push(maxAges[key]);
		}
	}

	const q1 = Math.floor(0.25 * numPlayers);
	const q2 = Math.floor(0.5 * numPlayers);
	const q3 = Math.floor(0.75 * numPlayers);
	console.log("Ranges are min/q1/median/q3/max");

	for (const key of Object.keys(ratings)) {
		ratings[key].sort((a, b) => a - b);

		ages[key].sort((a, b) => a - b);
		const ranges = [
			ratings[key][0],
			ratings[key][q1],
			ratings[key][q2],
			ratings[key][q3],
			ratings[key].at(-1),
		];
		const ageRanges = [
			ages[key][0],
			ages[key][q1],
			ages[key][q2],
			ages[key][q3],
			ages[key][ratings[key].length - 1],
		];
		const num100s = ratings[key].filter(x => x === 100).length;
		console.log(`${key}:`);
		console.log(`Max ratings: ${JSON.stringify(ranges)}`);
		console.log(`Ages of max ratings: ${JSON.stringify(ageRanges)}`);
		console.log(`Number of 100s: ${num100s}`);
		console.log("");
	}
};

export default maxRatingDists;
