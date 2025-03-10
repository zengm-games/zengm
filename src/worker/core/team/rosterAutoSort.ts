import { bySport } from "../../../common";
import rosterAutoSortBaseball from "./rosterAutoSort.baseball";
import rosterAutoSortBasketball from "./rosterAutoSort.basketball";
import rosterAutoSortFootball from "./rosterAutoSort.football";
import rosterAutoSortHockey from "./rosterAutoSort.hockey";

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
