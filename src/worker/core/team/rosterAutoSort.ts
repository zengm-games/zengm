import { bySport } from "../../../common";
import rosterAutoSortBaseball from "./rosterAutoSort.baseball";
import rosterAutoSortBasketball from "./rosterAutoSort.basketball";
import rosterAutoSortFootball from "./rosterAutoSort.football";
import rosterAutoSortHockey from "./rosterAutoSort.hockey";

const rosterAutoSort = (
	tid: number,
	onlyNewPlayers?: boolean,
	pos?: string,
) => {
	return bySport({
		baseball: rosterAutoSortBaseball(tid, onlyNewPlayers, pos as any),
		basketball: rosterAutoSortBasketball(tid, onlyNewPlayers),
		football: rosterAutoSortFootball(tid, onlyNewPlayers, pos as any),
		hockey: rosterAutoSortHockey(tid, onlyNewPlayers, pos as any),
	});
};

export default rosterAutoSort;
