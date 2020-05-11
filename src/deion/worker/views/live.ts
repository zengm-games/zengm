import { g, lock } from "../util";
import type { UpdateEvents } from "../../common/types";
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

const updateGamesInProgress = async (
	inputs: unknown,
	updateEvents: UpdateEvents,
) => {
	if (updateEvents.includes("lock.gameSim")) {
		return {
			gamesInProgress: lock.get("gameSim"),
		};
	}
};

export default async (inputs: unknown, updateEvents: UpdateEvents) => {
	return Object.assign(
		{},
		await updateGamesList(),
		await updateGamesInProgress(inputs, updateEvents),
	);
};
