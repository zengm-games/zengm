import { idb } from "../../db/index.ts";
import { g, helpers } from "../../util/index.ts";
import type {
	PlayoffSeries,
	PlayoffSeriesTeam,
	ScheduleGame,
} from "../../../common/types.ts";

// Play 2 home (true) then 2 away (false) and repeat, but ensure that the better team always gets the last game.
export const betterSeedHome = (
	numGamesPlayoffSeries: number,
	gameNum: number,
) => {
	// For series lengths like 3, 7, 11, 15, etc., special case last 3 games to ensure the home team always gets the last game
	const needsSpecialEnding = (numGamesPlayoffSeries + 1) % 4 === 0;

	if (needsSpecialEnding) {
		// Special case for last 3 games
		if (gameNum >= numGamesPlayoffSeries - 3) {
			return (
				gameNum === numGamesPlayoffSeries - 3 ||
				gameNum === numGamesPlayoffSeries - 1
			);
		}
	}

	const num = Math.floor(gameNum / 2);
	return num % 2 === 0;
};

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

	const numGamesToWin = helpers.numGamesToWinSeries(
		g.get("numGamesPlayoffSeries", "current")[playoffSeries.currentRound],
	);

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
