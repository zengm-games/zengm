import { idb } from "../../db/index.ts";
import { helpers } from "../../util/index.ts";
import type {
	PlayoffSeries,
	PlayoffSeriesTeam,
	ScheduleGame,
} from "../../../common/types.ts";

export const seriesIsNotOver = (
	home: PlayoffSeriesTeam,
	away: PlayoffSeriesTeam | undefined,
	numGamesToWin: number,
): away is PlayoffSeriesTeam =>
	!!(away && home.won < numGamesToWin && away.won < numGamesToWin);

export const getSeriesTidKey = (tid0: number, tid1: number) =>
	tid0 < tid1 ? `${tid0},${tid1}` : `${tid1},${tid0}`;

export const getScheduledGamesForSeries = (
	schedule: ScheduleGame[],
	tid0: number,
	tid1: number,
) => {
	const key = getSeriesTidKey(tid0, tid1);
	return schedule.filter(
		(game) => getSeriesTidKey(game.homeTid, game.awayTid) === key,
	);
};

export const deleteScheduledGamesForCompletedSeries = async (
	playoffSeries: PlayoffSeries,
) => {
	if (playoffSeries.currentRound < 0) {
		return [];
	}

	const roundSeries = playoffSeries.series[playoffSeries.currentRound];
	if (!roundSeries) {
		return [];
	}

	const numGamesToWin = helpers.numGamesToWinRound(playoffSeries.currentRound);

	const completedSeriesKeys = new Set<string>();
	for (const { away, home } of roundSeries) {
		if (away && (home.won >= numGamesToWin || away.won >= numGamesToWin)) {
			completedSeriesKeys.add(getSeriesTidKey(home.tid, away.tid));
		}
	}

	if (completedSeriesKeys.size === 0) {
		return [];
	}

	const gidsDeleted = [];
	const schedule = await idb.cache.schedule.getAll();
	for (const game of schedule) {
		if (completedSeriesKeys.has(getSeriesTidKey(game.homeTid, game.awayTid))) {
			gidsDeleted.push(game.gid);
			await idb.cache.schedule.delete(game.gid);
		}
	}

	return gidsDeleted;
};
