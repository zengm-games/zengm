import { idb } from "..";
import type { HeadToHead } from "../../../common/types";

const getCopy = async ({
	season,
}: {
	season: number;
}): Promise<HeadToHead | undefined> => {
	const result = await idb.getCopies.headToHeads({
		season,
	});
	return result[0];
};

export default getCopy;
