import { PHASE } from "../../../common";
import type { HeadToHead } from "../../../common/types";
import { idb } from "../../db";
import { g } from "../../util";

type Info = {
	won: number;
	lost: number;
	tied: number;
	otl: number;
	pts: number;
	oppPts: number;
	seriesWon: number;
	seriesLost: number;
};

const iterateSeasons = async (
	{
		tid,
		type,
	}: {
		tid: number;
		type: "regularSeason" | "playoffs" | "combined";
	},
	cb: (info: Info) => void,
) => {
	return;

	// make sure to use cache for current season!
};

export default iterateSeasons;
