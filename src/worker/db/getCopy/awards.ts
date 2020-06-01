import { idb } from "..";

const getCopy = async ({ season }: { season: number }): Promise<any | void> => {
	const result = await idb.getCopies.awards({
		season,
	});
	return result[0];
};

export default getCopy;
