import type { Game, PlayerFiltered } from "../../../common/types.ts";
import type { AwardPlayer } from "../../../common/types.basketball.ts";
import { orderBy } from "../../../common/utils.ts";
import { idb } from "../../db/index.ts";
import { helpers } from "../../util/index.ts";

const getFinalsGames = async (season: number) => {
	const games = await idb.getCopies.games({ season }, "noCopyCache");

	// Last game of the season will have the two finals teams
	const finalsTids = games.at(-1)?.teams.map((t) => t.tid);
	if (finalsTids === undefined) {
		return [];
	}

	// Get all playoff games between those two teams - that will be all finals games
	return games.filter(
		(game) =>
			game.playoffs &&
			finalsTids.includes(game.teams[0].tid) &&
			finalsTids.includes(game.teams[1].tid),
	);
};

export const getPlayoffSeriesMVP = (
	players: PlayerFiltered[],
	games: Game[],
) => {
	if (games.length === 0) {
		return;
	}

	// Champ is winner of the last game in the series
	const wonSeriesTid = games.at(-1)!.won.tid;

	// Calculate sum of game scores for each player
	const playerInfos: Map<
		number,
		{
			pid: number;
			score: number;
			pts: number;
			trb: number;
			ast: number;
			gp: number;
		}
	> = new Map();

	for (const game of games) {
		for (const t of game.teams) {
			for (const p of t.players) {
				const info = playerInfos.get(p.pid) ?? {
					pid: p.pid,
					score: 0,
					pts: 0,
					trb: 0,
					ast: 0,
					gp: 0,
				};

				// 75% bonus for the winning team
				const factor = t.tid === wonSeriesTid ? 1.75 : 1;
				info.score += factor * helpers.gameScore(p);
				info.pts += p.pts;
				info.trb += p.drb + p.orb;
				info.ast += p.ast;
				if (p.min > 0) {
					info.gp += 1;
				}
				playerInfos.set(p.pid, info);
			}
		}
	}

	const playerArray = orderBy(
		Array.from(playerInfos.values()),
		"score",
		"desc",
	);

	if (!playerArray[0]) {
		return;
	}

	const { pid } = playerArray[0];
	const p = players.find((p2) => p2.pid === pid);

	if (p) {
		return {
			pid: p.pid,
			name: p.name,
			tid: p.tid,
			pts: playerArray[0].pts / playerArray[0].gp,
			trb: playerArray[0].trb / playerArray[0].gp,
			ast: playerArray[0].ast / playerArray[0].gp,
		};
	}
};

export const getRealFinalsMvp = async (
	players: PlayerFiltered[],
	season: number,
): Promise<AwardPlayer | undefined> => {
	const finalsGames = await getFinalsGames(season);
	return getPlayoffSeriesMVP(players, finalsGames);
};

export const getFinalsStatsForPlayer = async (season: number, pid: number) => {
	const finalsGames = await getFinalsGames(season);
	if (finalsGames.length === 0) {
		return;
	}

	let pts = 0;
	let trb = 0;
	let ast = 0;
	let gp = 0;
	let tid: number | undefined;

	for (const game of finalsGames) {
		for (const team of game.teams) {
			const p = team.players.find((p2) => p2.pid === pid);
			if (!p || p.min <= 0) {
				continue;
			}

			tid = team.tid;
			pts += p.pts;
			trb += p.orb + p.drb;
			ast += p.ast;
			gp += 1;
		}
	}

	if (gp === 0 || tid === undefined) {
		return;
	}

	return {
		tid,
		pts: pts / gp,
		trb: trb / gp,
		ast: ast / gp,
	};
};
