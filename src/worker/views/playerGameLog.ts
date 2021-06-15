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

		const seasons = Array.from(
			new Set(
				topStuff.player.stats.filter(row => row.gp > 0).map(row => row.season),
			),
		);

		const games = await idb.getCopies.games({ season });

		const gameLog = [];
		for (const game of games) {
			let row = game.teams[0].players.find(p => p.pid === pid);
			let t0 = 0;
			if (!row) {
				row = game.teams[1].players.find(p => p.pid === pid);
				t0 = 1;
			}
			if (!row) {
				continue;
			}

			const t1 = t0 === 0 ? 1 : 0;

			let result;
			if (game.teams[t0].pts > game.teams[t1].pts) {
				result = "W";
			} else if (game.teams[t0].pts < game.teams[t1].pts) {
				result = "L";
			} else {
				result = "T";
			}

			let overtimes = "";
			if (game.overtimes !== undefined && game.overtimes > 0) {
				if (game.overtimes === 1) {
					overtimes = " OT";
				} else if (game.overtimes > 1) {
					overtimes = ` ${game.overtimes}OT`;
				}
			}

			gameLog.push({
				tid: game.teams[t0].tid,
				oppTid: game.teams[t1].tid,
				result,
				score: `${game.teams[t0].pts}-${game.teams[t1].pts}${overtimes}`,
			});
		}

		console.log(seasons, games, gameLog);

		return {
			...topStuff,
			season,
		};
	}
};

export default updatePlayerGameLog;
