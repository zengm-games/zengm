import { isSport } from "../../../common";
import rosterAutoSortBasketball from "./rosterAutoSort.basketball";
import rosterAutoSortFootball from "./rosterAutoSort.football";

const rosterAutoSort = (
	tid: number,
	onlyNewPlayers?: boolean,
	pos?: string,
) => {
	if (isSport("football")) {
		return rosterAutoSortFootball(tid, onlyNewPlayers, pos as any);
	}

	return rosterAutoSortBasketball(tid, onlyNewPlayers);
};

export default rosterAutoSort;
