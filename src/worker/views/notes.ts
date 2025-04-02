import { season, team } from "../core";
import { idb } from "../db";
import { g, getTeamInfoBySeason, helpers } from "../util";
import type { UpdateEvents, ViewInput } from "../../common/types";
import getPlayoffsByConf from "../core/season/getPlayoffsByConf";
import { processDraftPicks } from "./draftPicks";
import getWinner from "../../common/getWinner";

const updateNotes = async (
	{ type }: ViewInput<"notes">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("notes") ||
		type !== state.type
	) {
		if (type === "draftPick") {
			const draftPicksRaw = await idb.getCopies.draftPicks(
				{ note: true },
				"noCopyCache",
			);

			const draftPicks = await processDraftPicks(draftPicksRaw);

			return {
				type,
				challengeNoRatings: g.get("challengeNoRatings"),
				draftPicks,
			};
		} else if (type === "game") {
			const gamesRaw = await idb.getCopies.games({ note: true }, "noCopyCache");

			const teamInfoCache: Record<string, { abbrev: string } | undefined> = {};
			const getTeamInfo = async (tid: number, season: number) => {
				const key = `${season}_${tid}`;
				if (Object.hasOwn(teamInfoCache, key)) {
					return teamInfoCache[key];
				}

				const info = await getTeamInfoBySeason(tid, season);
				teamInfoCache[key] = info;
				return info;
			};

			const games = [];
			for (const game of gamesRaw) {
				console.log(game);
				const home = await getTeamInfo(game.teams[0].tid, game.season);
				const away = await getTeamInfo(game.teams[1].tid, game.season);

				const winner = getWinner(game.teams);

				games.push({
					gid: game.gid,
					note: game.note,
					season: game.season,
					winner,
					home: {
						tid: game.teams[0].tid,
						abbrev: home?.abbrev ?? "???",
					},
					away: {
						tid: game.teams[1].tid,
						abbrev: away?.abbrev ?? "???",
					},
				});
			}

			return {
				type,
				games,
			};
		} else if (type === "player") {
			return {
				type,
			};
		} else if (type === "teamSeason") {
			const teamSeasons = await idb.getCopies.teamSeasons(
				{ note: true },
				"noCopyCache",
			);

			const pointsFormula = g.get("pointsFormula");
			const usePts = pointsFormula !== "";

			const playoffsByConfBySeason = new Map<number, boolean>();

			const teams = [];
			for (const ts of teamSeasons) {
				let playoffsByConf = playoffsByConfBySeason.get(ts.season);
				if (playoffsByConf === undefined) {
					playoffsByConf = await getPlayoffsByConf(ts.season);
					playoffsByConfBySeason.set(ts.season, playoffsByConf);
				}

				teams.push({
					tid: ts.tid,
					abbrev: ts.abbrev,
					region: ts.region,
					name: ts.name,
					season: ts.season,
					imgURL: ts.imgURL,
					imgURLSmall: ts.imgURLSmall,
					won: ts.won,
					lost: ts.lost,
					tied: ts.tied,
					otl: ts.otl,
					pts: team.evaluatePointsFormula(ts, {
						season: ts.season,
					}),
					ptsPct: team.ptsPct(ts),
					winp: helpers.calcWinp(ts),
					note: ts.note,
					playoffRoundsWon: ts.playoffRoundsWon,
					numPlayoffRounds: g.get("numGamesPlayoffSeries", ts.season).length,
					playoffsByConf,
				});
			}

			return {
				teams,
				ties: season.hasTies(Infinity),
				type,
				otl: g.get("otl"),
				usePts,
				userTid: g.get("userTid"),
			};
		}
	}
};

export default updateNotes;
