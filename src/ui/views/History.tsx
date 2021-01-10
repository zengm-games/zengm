import { bySport } from "../../common";
import HistoryBasketball from "./History.basketball";
import HistoryFootball from "./History.football";

const History = bySport({
	basketball: HistoryBasketball,
	football: HistoryFootball,
});

export default History;
