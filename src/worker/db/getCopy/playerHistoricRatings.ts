import { idb } from "..";
import type { PlayerHistoricRatings, GetCopyType } from "../../../common/types";

const getCopy = async (
	{ pid, season }: { pid: number; season: number },
	type?: GetCopyType,
): Promise<PlayerHistoricRatings | void> => {
	const result = await idb.getCopies.playerHistoricRatings(
		{
			pid,
		},
		type,
	);
	return result.filter(pr => pr.season === season)[0];
};

export default getCopy;
