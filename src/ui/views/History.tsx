import { bySport } from "../../common";
import HistoryBaseball from "./History.baseball";
import HistoryBasketball from "./History.basketball";
import HistoryFootball from "./History.football";
import HistoryHockey from "./History.hockey";

const History = bySport({
	baseball: HistoryBaseball,
	basketball: HistoryBasketball,
	football: HistoryFootball,
	hockey: HistoryHockey,
});

export default History;
