import { PLAYER, POSITION_COUNTS } from "../../../common";
import { idb } from "../../db";
import { player } from "..";

const countPositions = async () => {
	// All non-retired players
	const players = await idb.league
		.transaction("players")
		.store.index("tid")
		.getAll(IDBKeyRange.lowerBound(PLAYER.FREE_AGENT));
	const posCounts: {
		[key: string]: number;
	} = {};
	const posOvrs: {
		[key: string]: number;
	} = {};

	for (const p of players) {
		const r = p.ratings[p.ratings.length - 1]; // Dynamically recompute, to make dev easier when changing position formula

		const position = player.pos(r);

		const ovr = player.ovr(r, position);

		if (posCounts[position] === undefined) {
			posCounts[position] = 0;
		}

		if (posOvrs[position] === undefined) {
			posOvrs[position] = 0;
		}

		posCounts[position] += 1;
		posOvrs[position] += ovr;
	}

	for (const position of Object.keys(posOvrs)) {
		posOvrs[position] /= posCounts[position];
	}

	if (process.env.SPORT === "football") {
		let positionCountsTotal = 0;

		for (const target of Object.values(POSITION_COUNTS)) {
			positionCountsTotal += target;
		}

		for (const [position, target] of Object.entries(POSITION_COUNTS)) {
			console.log(
				position,
				`${posCounts[position]} / ${Math.round(
					(players.length * target) / positionCountsTotal,
				)}`,
				Math.round(posOvrs[position]),
			);
		}
	} else {
		console.table(posCounts);
		console.table(posOvrs);
	}
};

export default countPositions;
