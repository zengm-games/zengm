import { season, team } from "../core/index.ts";
import { idb } from "../db/index.ts";
import { g, getTeamInfoBySeason, helpers } from "../util/index.ts";
import {
	type ByConf,
	type PlayerStatType,
	type UpdateEvents,
	type ViewInput,
} from "../../common/types.ts";
import getPlayoffsByConf from "../core/season/getPlayoffsByConf.ts";
import { processDraftPicks } from "./draftPicks.ts";
import getWinner from "../../common/getWinner.ts";
import formatScoreWithShootout from "../../common/formatScoreWithShootout.ts";
import { formatPlayersWatchList } from "./watchList.ts";
import { bySport } from "../../common/index.ts";

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
				draftType: g.get("draftType"),
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
				const home = await getTeamInfo(game.teams[0].tid, game.season);
				const away = await getTeamInfo(game.teams[1].tid, game.season);

				const winner = getWinner(game.teams);

				games.push({
					gid: game.gid,
					note: game.note,
					playoffs: game.playoffs,
					season: game.season,
					score: formatScoreWithShootout(game.teams[0], game.teams[1]),
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
			const playersRaw = await idb.getCopies.players(
				{ note: true },
				"noCopyCache",
			);

			const playoffs = "regularSeason" as const;
			const statType = bySport<PlayerStatType>({
				baseball: "totals",
				basketball: "perGame",
				football: "totals",
				hockey: "totals",
			});

			const { players, stats } = await formatPlayersWatchList(playersRaw, {
				playoffs,
				statType,
			});

			return {
				type,
				challengeNoRatings: g.get("challengeNoRatings"),
				currentSeason: g.get("season"),
				phase: g.get("phase"),
				players,
				playoffs,
				statType,
				stats,
			};
		} else if (type === "teamSeason") {
			const teamSeasons = await idb.getCopies.teamSeasons(
				{ note: true },
				"noCopyCache",
			);

			const pointsFormula = g.get("pointsFormula");
			const usePts = pointsFormula !== "";

			const playoffsByConfBySeason = new Map<number, ByConf>();

			const teams = [];
			for (const ts of teamSeasons) {
				let playoffsByConf = playoffsByConfBySeason.get(ts.season);
				if (playoffsByConf === undefined) {
					playoffsByConf = await getPlayoffsByConf(ts.season);
					playoffsByConfBySeason.set(ts.season, playoffsByConf);
				}

				const numPlayoffRounds = g.get(
					"numGamesPlayoffSeries",
					ts.season,
				).length;

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
					roundsWonText: helpers.upperCaseFirstLetter(
						helpers.roundsWonText({
							playoffRoundsWon: ts.playoffRoundsWon,
							numPlayoffRounds,
							playoffsByConf,
							showMissedPlayoffs: true,
						}),
					),
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
