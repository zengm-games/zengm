import {
	DEFAULT_PLAY_THROUGH_INJURIES,
	DEFAULT_STADIUM_CAPACITY,
	EXHIBITION_GAME_SETTINGS,
	PHASE,
	unwrapGameAttribute,
} from "../../common";
import type { Conditions, GameAttributesLeague } from "../../common/types";
import type {
	ExhibitionGameAttributes,
	ExhibitionTeam,
} from "../../ui/views/Exhibition";
import { GameSim, realRosters } from "../core";
import { processTeam } from "../core/game/loadTeams";
import { gameSimToBoxScore } from "../core/game/writeGameStats";
import { connectLeague, getAll, idb } from "../db";
import { defaultGameAttributes, g, helpers, toUI } from "../util";
import { boxScoreToLiveSim } from "../views/liveGame";

export const getLeagues = async () => {
	const leagues = await idb.meta.getAll("leagues");
	return leagues
		.map(league => ({
			lid: league.lid,
			name: league.name,
		}))
		.reverse();
};

export const getSeasons = async (lid: number) => {
	const league = await connectLeague(lid);
	const store = league.transaction("gameAttributes").store;
	const season = await store.get("season");
	const startingSeason = await store.get("startingSeason");

	league.close();

	if (!season) {
		throw new Error("Invalid season");
	}
	if (!startingSeason) {
		throw new Error("Invalid startingSeason");
	}

	return {
		seasonStart: startingSeason.value as number,
		seasonEnd: season.value as number,
	};
};

const getSeasonInfoLeague = async ({
	lid,
	season,
	pidOffset,
}: {
	lid: number;
	season: number;
	pidOffset: number;
}) => {
	const league = await connectLeague(lid);

	const getGameAttribute = async <T extends keyof GameAttributesLeague>(
		key: T,
	): Promise<GameAttributesLeague[T]> => {
		const value =
			(await gameAttributesStore.get(key))?.value ?? defaultGameAttributes[key];
		return unwrapGameAttribute(
			{
				[key]: value,
			},
			key,
		) as any;
	};

	const gameAttributes: Partial<GameAttributesLeague> = {};
	const gameAttributesStore = league.transaction("gameAttributes").store;
	for (const key of EXHIBITION_GAME_SETTINGS) {
		const value = await getGameAttribute(key);
		gameAttributes[key] = value as any;
	}

	const numGamesPlayoffSeries = await getGameAttribute("numGamesPlayoffSeries");
	const confs = await getGameAttribute("confs");

	const teams = await league.transaction("teams").store.getAll();
	const teamSeasons = await league
		.transaction("teamSeasons")
		.store.index("season, tid")
		.getAll(IDBKeyRange.bound([season], [season, ""]));

	let pid = pidOffset;
	const exhibitionTeams: ExhibitionTeam[] = await Promise.all(
		teamSeasons.map(async teamSeason => {
			const tid = teamSeason.tid;
			const t = teams[tid];

			const roundsWonText = helpers.roundsWonText(
				teamSeason.playoffRoundsWon,
				numGamesPlayoffSeries.length,
				confs.length,
				true,
			);

			const players = (
				await getAll(
					league.transaction("players").store.index("statsTids"),
					tid,
				)
			).filter(p => {
				// Keep players who ended the season on this team. Not perfect, will miss released players
				const seasonStats = p.stats.filter(row => row.season === season).at(-1);
				if (!seasonStats || seasonStats.tid !== tid) {
					return false;
				}
				p.stats = [seasonStats];

				// Also filter ratings here, why  not
				const seasonRatings = p.ratings
					.filter(row => row.season === season)
					.at(-1);
				if (!seasonRatings) {
					return false;
				}
				p.ratings = [seasonRatings];

				p.pid = pid;
				pid += 1;

				return true;
			});

			return {
				abbrev: teamSeason.abbrev ?? t.abbrev,
				imgURL: teamSeason.imgURL ?? t.imgURL,
				region: teamSeason.region ?? t.region,
				name: teamSeason.name ?? t.name,
				tid,
				season,
				seasonInfo: {
					won: teamSeason.won ?? 0,
					lost: teamSeason.lost ?? 0,
					tied: teamSeason.tied ?? 0,
					otl: teamSeason.otl ?? 0,
					roundsWonText,
				},
				players,
				ovr: 50,
			};
		}),
	);

	league.close();

	return {
		gameAttributes,
		teams: exhibitionTeams,
	};
};

export const getSeasonInfo = async (
	options:
		| {
				type: "real";
				season: number;
				pidOffset: number;
		  }
		| {
				type: "league";
				lid: number;
				season: number;
				pidOffset: number;
		  },
): Promise<{
	gameAttributes: Partial<GameAttributesLeague>;
	teams: ExhibitionTeam[];
}> => {
	if (options.type === "real") {
		const info = await realRosters.getLeagueInfo({
			phase: PHASE.PLAYOFFS,
			randomDebuts: false,
			realDraftRatings: "draft",
			realStats: "lastSeason",
			includeSeasonInfo: true,
			...options,
		});

		return {
			gameAttributes: info.gameAttributes,
			teams: info.teams as any,
		};
	} else {
		return getSeasonInfoLeague(options);
	}
};

type ExhibitionGamePhase =
	| typeof PHASE["REGULAR_SEASON"]
	| typeof PHASE["PLAYOFFS"];

export const simExhibitionGame = async (
	{
		disableHomeCourtAdvantage,
		gameAttributes,
		phase,
		teams,
	}: {
		disableHomeCourtAdvantage: boolean;
		gameAttributes: ExhibitionGameAttributes;
		phase: ExhibitionGamePhase;
		teams: [ExhibitionTeam, ExhibitionTeam];
	},
	conditions: Conditions,
) => {
	g.setWithoutSavingToDB("phase", phase);
	g.setWithoutSavingToDB("userTids", [0, 1]);
	g.setWithoutSavingToDB("userTid", 0);

	const settingsCannotChange = [
		"budget",
		"spectator",
		"otl",
		"elamASG",
	] as const;

	for (const key of settingsCannotChange) {
		g.setWithoutSavingToDB(key, defaultGameAttributes[key]);
	}
	for (const key of EXHIBITION_GAME_SETTINGS) {
		g.setWithoutSavingToDB(key, gameAttributes[key]);
	}

	const teamsProcessed = teams.map((t, tid) =>
		processTeam(
			{
				tid,
				playThroughInjuries: DEFAULT_PLAY_THROUGH_INJURIES,
			},
			{
				won: t.seasonInfo?.won ?? 0,
				lost: t.seasonInfo?.lost ?? 0,
				tied: t.seasonInfo?.tied ?? 0,
				otl: t.seasonInfo?.otl ?? 0,
				cid: 0,
				did: 0,
				expenses: {
					health: {
						rank: 1,
					},
				},
			},
			t.players,
		),
	) as [any, any];

	const result = new GameSim({
		gid: 0,
		day: -1,
		teams: teamsProcessed,
		doPlayByPlay: true,
		homeCourtFactor: 1,
		disableHomeCourtAdvantage,
		allStarGame: false,
		baseInjuryRate: defaultGameAttributes.injuryRate,
		dh: false,
	}).run();

	// Hacky way to skip playoff database access in gameSimToBoxScore
	g.setWithoutSavingToDB("phase", PHASE.REGULAR_SEASON);

	const { gameStats: boxScore } = await gameSimToBoxScore(
		result,
		DEFAULT_STADIUM_CAPACITY,
	);

	const liveSim = await boxScoreToLiveSim({
		allStars: undefined,
		confetti: false,
		boxScore,
		playByPlay: result.playByPlay as any,
		teamSeasonOverrides: teams,
	});
	for (let i = 0; i < 2; i++) {
		const j = i === 0 ? 1 : 0;
		liveSim.initialBoxScore.teams[i].season = teams[j].season;
	}

	liveSim.initialBoxScore.exhibition = true;

	await toUI(
		"realtimeUpdate",
		[
			[],
			"/exhibition/game",
			{
				liveSim,
			},
		],
		conditions,
	);
};
