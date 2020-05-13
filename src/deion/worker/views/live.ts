import { g } from "../util";
import { getUpcoming } from "./schedule";

const updateGamesList = async () => {
	const games = await getUpcoming({
		oneDay: true,
	});

	return {
		games,
		userTid: g.get("userTid"),
	};
};

export default updateGamesList;
