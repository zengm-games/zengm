import rosterAutoSortBasketball from "./rosterAutoSort.basketball";
import rosterAutoSortFootball from "./rosterAutoSort.football";

const rosterAutoSort = (
	tid: number,
	onlyNewPlayers?: boolean,
	pos?: string,
) => {
	if (process.env.SPORT === "football") {
		return rosterAutoSortFootball(tid, onlyNewPlayers, pos as any);
	}

	return rosterAutoSortBasketball(tid, onlyNewPlayers);
};

export default rosterAutoSort;
