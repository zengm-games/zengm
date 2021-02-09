import { bySport } from "../../common";
import HistoryBasketball from "./History.basketball";
import HistoryFootball from "./History.football";
import HistoryHockey from "./History.hockey";

const History = bySport({
	basketball: HistoryBasketball,
	football: HistoryFootball,
	hockey: HistoryHockey,
});

export default History;
