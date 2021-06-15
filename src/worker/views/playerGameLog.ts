import type { UpdateEvents, ViewInput } from "../../common/types";
import { idb } from "../db";
import { getCommon } from "./player";

const updatePlayerGameLog = async (
	{ pid, season }: ViewInput<"playerGameLog">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (
		updateEvents.includes("firstRun") ||
		!state.retired ||
		state.pid !== pid ||
		state.season !== season
	) {
		const topStuff = await getCommon(pid);

		if (topStuff.type === "error") {
			// https://stackoverflow.com/a/59923262/786644
			const returnValue = {
				errorMessage: topStuff.errorMessage,
			};
			return returnValue;
		}

		const games = await idb.getCopies.games({ season });

		const seasons = Array.from(
			new Set(topStuff.player.stats.filter(row => row.gp > 0)),
		);

		console.log(games, seasons);

		return {
			...topStuff,
			season,
		};
	}
};

export default updatePlayerGameLog;
