import { bySport } from "../../../common";
import rosterAutoSortBasketball from "./rosterAutoSort.basketball";
import rosterAutoSortFootball from "./rosterAutoSort.football";
import rosterAutoSortHockey from "./rosterAutoSort.hockey";

const rosterAutoSort = (
	tid: number,
	onlyNewPlayers?: boolean,
	pos?: string,
) => {
	return bySport({
		basketball: rosterAutoSortBasketball(tid, onlyNewPlayers),
		football: rosterAutoSortFootball(tid, onlyNewPlayers, pos as any),
		hockey: rosterAutoSortHockey(tid, onlyNewPlayers, pos as any),
	});
};

export default rosterAutoSort;
