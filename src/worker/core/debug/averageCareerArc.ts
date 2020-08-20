import { player } from "..";
import { g } from "../../util";

const averageCareerArc = async (ratingToSave: string) => {
	console.log(
		'Warning: This does not include "special" draft prospects created in draft.genPlayers',
	);
	const numPlayers = 1000; // Number of players per profile

	const numSeasons = 20;
	const averageOvr: number[] = [];
	const averagePot: number[] = [];
	const averageRat: number[] = [];

	for (let i = 0; i < numSeasons; i++) {
		averageOvr[i] = 0;
		averagePot[i] = 0;
		averageRat[i] = 0;
	}

	for (let i = 0; i < numPlayers; i++) {
		const p = player.generate(0, 19, g.get("season"), true, 15);

		for (let k = 0; k < numSeasons; k++) {
			averageOvr[k] += p.ratings[0].ovr;
			averagePot[k] += p.ratings[0].pot;

			if (ratingToSave) {
				// @ts-ignore
				averageRat[k] += p.ratings[0][ratingToSave];
			}

			await player.develop(p, 1, true);
		}
	}

	for (let i = 0; i < numSeasons; i++) {
		averageOvr[i] /= numPlayers;
		averagePot[i] /= numPlayers;

		if (ratingToSave) {
			averageRat[i] /= numPlayers;
		}
	}

	console.log("ovr:");
	console.log(averageOvr);
	console.log("pot:");
	console.log(averagePot);

	if (ratingToSave) {
		console.log(`${ratingToSave}:`);
		console.log(averageRat);
	}
};

export default averageCareerArc;
