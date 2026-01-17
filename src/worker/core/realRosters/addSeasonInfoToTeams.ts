import { PLAYER, unwrapGameAttribute } from "../../../common/index.ts";
import { groupBy } from "../../../common/utils.ts";
import type {
	GameAttributesLeague,
	GetLeagueOptions,
	Player,
} from "../../../common/types.ts";
import { defaultGameAttributes, g, helpers, local } from "../../util/index.ts";
import player from "../player/index.ts";
import formatPlayerFactory from "./formatPlayerFactory.ts";
import getInjury from "./getInjury.ts";
import type { Basketball } from "./loadData.basketball.ts";
import oldAbbrevTo2020BBGMAbbrev from "./oldAbbrevTo2020BBGMAbbrev.ts";

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
		(row) => row.season === options.season,
	);
	const players = ratings
		.map((row) => formatPlayer(row))
		.filter((p) => p.tid >= 0)
		.map((p) => {
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
			p2.firstName = parts[0]!;
			p2.lastName = parts.slice(1).join(" ");

			if (!p2.stats) {
				p2.stats = [];
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
		await player.develop(p, 0);
		await player.updateValues(p);
	}

	const playersByTid = groupBy(players, "tid");

	const teamsAugmented = teams
		.map((t) => {
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
						const index = round.abbrevs.indexOf(abbrev) as 0 | 1;
						if (index >= 0) {
							playoffRoundsWon = round.round;
							const otherIndex = index === 0 ? 1 : 0;
							if (round.wons[index] > round.wons[otherIndex]) {
								playoffRoundsWon += 1;
							}
						}
					}

					roundsWonText = helpers.roundsWonText({
						playoffRoundsWon,
						numPlayoffRounds: gameAttributes.numGamesPlayoffSeries!.length,
						playoffsByConf: gameAttributes.confs.length === 2 ? 2 : false,
						showMissedPlayoffs: true,
					});
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
		.map((t) => {
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
