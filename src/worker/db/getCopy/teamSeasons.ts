import { idb } from "..";
import type { GetCopyType, TeamSeason } from "../../../common/types";

const getCopy = async (
	{
		season,
		tid,
	}: {
		season: number;
		tid: number;
	},
	type?: GetCopyType,
): Promise<TeamSeason | undefined> => {
	const result = await idb.getCopies.teamSeasons(
		{
			season,
			tid,
		},
		type,
	);
	return result[0];
};

export default getCopy;
