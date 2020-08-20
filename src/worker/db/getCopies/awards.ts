import { idb } from "..";
import { mergeByPk } from "./helpers";

const getCopies = async ({
	season,
}: {
	season?: number;
} = {}): Promise<any[]> => {
	if (season !== undefined) {
		const awards = mergeByPk(
			await idb.league.getAll("awards", season),
			(await idb.cache.awards.getAll()).filter(event => {
				return event.season === season;
			}),
			"awards",
		);
		return awards;
	}

	return mergeByPk(
		await idb.league.getAll("awards"),
		await idb.cache.awards.getAll(),
		"awards",
	);
};

export default getCopies;
