import { idb } from "..";
import { mergeByPk } from "./helpers";

const getCopies = async ({
	season,
}: {
	season?: number;
} = {}): Promise<object[]> => {
	if (season !== undefined) {
		const awards = mergeByPk(
			await idb.league.getAll("awards", season),
			(await idb.cache.awards.getAll()).filter(event => {
				return event.season === season;
			}),
			idb.cache.storeInfos.awards.pk,
		);
		return awards;
	}

	return mergeByPk(
		await idb.league.getAll("awards"),
		await idb.cache.awards.getAll(),
		idb.cache.storeInfos.awards.pk,
	);
};

export default getCopies;
