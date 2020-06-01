import { idb } from "..";
import type { AllStars } from "../../../common/types";

const getCopy = async ({
	season,
}: {
	season: number;
}): Promise<AllStars | undefined> => {
	const result = await idb.getCopies.allStars({
		season,
	});
	return result[0];
};

export default getCopy;
