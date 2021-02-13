import { idb } from "..";

const getCopy = async ({
	season,
}: {
	season: number;
}): Promise<any | undefined> => {
	const result = await idb.getCopies.awards({
		season,
	});
	return result[0];
};

export default getCopy;
