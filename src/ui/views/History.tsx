import { bySport } from "../../common/index.ts";
import HistoryBaseball from "./History.baseball/index.tsx";
import HistoryBasketball from "./History.basketball/index.tsx";
import HistoryFootball from "./History.football/index.tsx";
import HistoryHockey from "./History.hockey/index.tsx";

const History = bySport({
	baseball: HistoryBaseball,
	basketball: HistoryBasketball,
	football: HistoryFootball,
	hockey: HistoryHockey,
});

export default History;
