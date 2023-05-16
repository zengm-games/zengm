import { PLAYER, unwrapGameAttribute } from "../../../common";
import { groupBy } from "../../../common/groupBy";
import type {
	GameAttributesLeague,
	GetLeagueOptions,
	Player,
} from "../../../common/types";
import { defaultGameAttributes, g, helpers, local } from "../../util";
import player from "../player";
import stats from "../player/stats";
import formatPlayerFactory from "./formatPlayerFactory";
import getInjury from "./getInjury";
import type { Basketball } from "./loadData.basketball";
import oldAbbrevTo2020BBGMAbbrev from "./oldAbbrevTo2020BBGMAbbrev";

const addSeasonInfoToTeams = async <
	T extends {
		tid: number;
		srID: string;
	},
>(
	teams: T[],
	basketball: Basketball,
	gameAttributes:
		| Pick<GameAttributesLeague, "confs" | "numGames" | "numGamesPlayoffSeries">
		| undefined,
	options: GetLeagueOptions,
) => {
	if (options.type === "legends") {
		throw new Error("Not supported");
	}

	const teamSeasons = basketball.teamSeasons[options.season];

	const formatPlayer = await formatPlayerFactory(
		basketball,
		options,
		options.season,
		teams,
		-1 + (options.pidOffset ?? 0),
	);

	const getUnwrappedGameAttributeOrDefault = <
		Key extends keyof NonNullable<typeof gameAttributes>,
	>(
		key: Key,
	): GameAttributesLeague[Key] => {
		if (!gameAttributes) {
			return defaultGameAttributes[key] as any;
		}

		return unwrapGameAttribute(gameAttributes, key);
	};

	const commonInjuryOptions = {
		injuries: basketball.injuries,
		season: options.season,
		phase: options.phase,
		numGames: getUnwrappedGameAttributeOrDefault("numGames"),
		numGamesPlayoffSeries: getUnwrappedGameAttributeOrDefault(
			"numGamesPlayoffSeries",
		),
	};

	const ratings = basketball.ratings.filter(
		row => row.season === options.season,
	);
	const players = ratings
		.map(row => formatPlayer(row))
		.filter(p => p.tid >= 0)
		.map(p => {
			const injury = getInjury({
				...commonInjuryOptions,
				slug: p.srID,
				draftProspect: p.tid === PLAYER.UNDRAFTED,
				draftYear: p.draft.year,
			}) ?? {
				gamesRemaining: 0,
				type: "Healthy",
			};

			const p2 = {
				...p,
				firstName: "",
				lastName: "",
				injury,
				ptModifier: 1,
			} as unknown as Player;

			delete (p2 as any).name;
			const parts = p.name.split(" ");
			p2.firstName = parts[0];
			p2.lastName = parts.slice(1, parts.length).join(" ");

			// Handle any missing stats
			if (!p2.stats) {
				p2.stats = [];
			}
			const statKeys = [...stats.derived, ...stats.raw];
			for (const ps of p2.stats) {
				for (const key of statKeys) {
					if (ps[key] === undefined) {
						ps[key] = 0;
					}
				}
			}

			for (const row of p2.ratings) {
				row.fuzz = 0;
			}

			return p2;
		});

	g.setWithoutSavingToDB("season", options.season);
	g.setWithoutSavingToDB("numActiveTeams", 2);
	local.playerOvrMean = 48;
	local.playerOvrStd = 10;
	local.playerOvrMeanStdStale = false;
	for (const p of players) {
		await player.develop(p, 0, false, 1);
		await player.updateValues(p);
	}

	const playersByTid = groupBy(players, "tid");

	const teamsAugmented = teams
		.map(t => {
			const abbrev = oldAbbrevTo2020BBGMAbbrev(t.srID);

			const teamSeason = teamSeasons?.[abbrev];
			if (!teamSeason) {
				return t;
			}

			let roundsWonText;
			if (gameAttributes) {
				const playoffSeries = basketball.playoffSeries[options.season];
				if (playoffSeries) {
					let playoffRoundsWon = -1;
					for (const round of playoffSeries) {
						const index = round.abbrevs.indexOf(abbrev);
						if (index >= 0) {
							playoffRoundsWon = round.round;
							const otherIndex = index === 0 ? 1 : 0;
							if (round.wons[index] > round.wons[otherIndex]) {
								playoffRoundsWon += 1;
							}
						}
					}

					roundsWonText = helpers.roundsWonText(
						playoffRoundsWon,
						gameAttributes.numGamesPlayoffSeries!.length,
						gameAttributes.confs.length,
						true,
					);
				}
			}

			const seasonInfo = {
				won: teamSeason.won,
				lost: teamSeason.lost,
				tied: 0,
				otl: 0,
				roundsWonText,
			};

			return {
				...t,
				seasonInfo,
			};
		})
		.map(t => {
			// Separate map in case seasonInfo one returns early
			return {
				...t,
				ovr: 0,
				players: playersByTid[t.tid],
				season: options.season,
			};
		});

	return teamsAugmented;
};

export default addSeasonInfoToTeams;
