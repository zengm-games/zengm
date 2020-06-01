import HistoryBasketball from "./History.basketball";
import HistoryFootball from "./History.football";

const History =
	process.env.SPORT === "football" ? HistoryFootball : HistoryBasketball;

export default History;
