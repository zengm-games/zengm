import { idb } from "../index.ts";
import type { GetCopyType, TeamSeason } from "../../../common/types.ts";

const getCopy = async (
	query:
		| {
				rid?: undefined;
				season: number;
				tid: number;
		  }
		| {
				rid: number;
				season?: undefined;
				tid?: undefined;
		  },
	type?: GetCopyType,
): Promise<TeamSeason | undefined> => {
	const result = await idb.getCopies.teamSeasons(query, type);
	return result[0];
};

export default getCopy;
