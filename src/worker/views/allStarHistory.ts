import { idb } from "../db";
import { g, helpers } from "../util";
import type { UpdateEvents, AllStars } from "../../common/types";

const addAbbrevAndCount = <
	T extends {
		tid: number;
	},
>(
	obj: T,
) => {
	return { ...obj, abbrev: g.get("teamInfoCache")[obj.tid]?.abbrev, count: 0 };
};

const augment = (allAllStars: AllStars[]) => {
	const augmented = allAllStars.map(row => {
		return {
			gid: row.gid,
			mvp: row.mvp ? addAbbrevAndCount(row.mvp) : undefined,
			overtimes: row.overtimes,
			score: row.score,
			season: row.season,
			teamNames: row.teamNames,
			captain1: addAbbrevAndCount(row.teams[0][0]),
			captain2: addAbbrevAndCount(row.teams[1][0]),
			dunk:
				row.dunk && row.dunk.winner !== undefined
					? addAbbrevAndCount(row.dunk.players[row.dunk.winner])
					: undefined,
			three:
				row.three && row.three.winner !== undefined
					? addAbbrevAndCount(row.three.players[row.three.winner])
					: undefined,
			type: row.type ?? "draft",
		};
	});

	const counts: Record<
		"captain" | "mvp" | "dunk" | "three",
		Record<number, number>
	> = {
		captain: {},
		mvp: {},
		dunk: {},
		three: {},
	};
	const keys = helpers.keys(counts);

	const updateCount = (
		key: "captain1" | "captain2" | "mvp" | "dunk" | "three",
		row: typeof augmented[number],
	) => {
		const object = row[key];
		if (!object) {
			return;
		}

		const pid = object.pid;

		const countKey = key === "captain1" || key === "captain2" ? "captain" : key;
		if (counts[countKey][pid] === undefined) {
			counts[countKey][pid] = 1;
		} else {
			counts[countKey][pid] += 1;
		}

		object.count = counts[countKey][pid];
	};

	for (const row of augmented) {
		for (const key of keys) {
			if (key === "captain") {
				updateCount("captain1", row);
				updateCount("captain2", row);
			} else {
				updateCount(key, row);
			}
		}
	}

	return augmented;
};

const updateAllStarHistory = async (
	inputs: unknown,
	updateEvents: UpdateEvents,
) => {
	if (updateEvents.includes("firstRun") || updateEvents.includes("gameSim")) {
		const allAllStars = await idb.getCopies.allStars();
		return {
			allAllStars: augment(allAllStars),
			userTid: g.get("userTid"),
		};
	}
};

export default updateAllStarHistory;
