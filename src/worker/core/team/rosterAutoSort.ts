import { bySport } from "../../../common/index.ts";
import rosterAutoSortBaseball from "./rosterAutoSort.baseball.ts";
import rosterAutoSortBasketball from "./rosterAutoSort.basketball.ts";
import rosterAutoSortFootball from "./rosterAutoSort.football.ts";
import rosterAutoSortHockey from "./rosterAutoSort.hockey.ts";

const rosterAutoSort = async (
	tid: number,
	onlyNewPlayers?: boolean,
	pos?: string,
) => {
	await bySport<any>({
		baseball: rosterAutoSortBaseball,
		basketball: rosterAutoSortBasketball,
		football: rosterAutoSortFootball,
		hockey: rosterAutoSortHockey,
	})(tid, onlyNewPlayers, pos as any);
};

export default rosterAutoSort;
