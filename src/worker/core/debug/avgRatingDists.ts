import range from "lodash-es/range";
import { draft, player } from "..";

const avgRatingDists = async (numPlayers: number = 100) => {
	const NUM_SEASONS = 20;
	const ratings: any[] = range(NUM_SEASONS).map(() => {
		return {
			ovr: [],
			stre: [],
			spd: [],
			jmp: [],
			endu: [],
			ins: [],
			dnk: [],
			ft: [],
			fg: [],
			tp: [],
			oiq: [],
			diq: [],
			drb: [],
			pss: [],
			reb: [],
		};
	});
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

		for (let j = 0; j < NUM_SEASONS; j++) {
			await player.develop(p, 1, false, 15.5, true);
			p.born.year -= 1; // Aging after develop

			for (const key of Object.keys(ratings[j])) {
				ratings[j][key].push(p.ratings[0][key]);
			}
		}
	}

	const q1 = Math.floor(0.25 * numPlayers);
	const q2 = Math.floor(0.5 * numPlayers);
	const q3 = Math.floor(0.75 * numPlayers);
	console.log("Career arc for the q1/median/q3 player");

	for (const key of Object.keys(ratings[0])) {
		const ratingsForKey: any[] = ratings.map(r => {
			return r[key].sort((a: any, b: any) => a - b);
		});
		const q1s = ratingsForKey.map(row => row[q1]);
		const q2s = ratingsForKey.map(row => row[q2]);
		const q3s = ratingsForKey.map(row => row[q3]);
		console.log(`${key}:`);
		console.log(`q1: ${JSON.stringify(q1s)}`);
		console.log(`q2: ${JSON.stringify(q2s)}`);
		console.log(`q3: ${JSON.stringify(q3s)}`);
		console.log("");
	}
};

export default avgRatingDists;
