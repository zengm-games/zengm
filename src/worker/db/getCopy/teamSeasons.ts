import { idb } from "..";
import type { TeamSeason } from "../../../common/types";

const getCopy = async ({
	season,
	tid,
}: {
	season: number;
	tid: number;
}): Promise<TeamSeason | undefined> => {
	const result = await idb.getCopies.teamSeasons({
		season,
		tid,
	});
	return result[0];
};

export default getCopy;
