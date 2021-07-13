import {
	DIFFICULTY,
	gameAttributeHasHistory,
	PHASE,
	unwrapGameAttribute,
} from "../../../common";
import type {
	GameAttributesLeague,
	GameAttributesLeagueWithHistory,
} from "../../../common/types";
import { defaultGameAttributes, helpers } from "../../util";
import { wrap } from "../../util/g";
import type { LeagueFile, TeamInfo } from "./create";
import getValidNumGamesPlayoffSeries from "./getValidNumGamesPlayoffSeries";

const createGameAttributes = ({
	leagueFile,
	teamInfos,
	userTid,
	version,
}: {
	leagueFile: LeagueFile;
	teamInfos: TeamInfo[];
	userTid: number;
	version?: number;
}) => {
	const startingSeason = leagueFile.startingSeason;

	const gameAttributes: GameAttributesLeagueWithHistory = {
		...defaultGameAttributes,
		userTid: [
			{
				start: -Infinity,
				value: userTid,
			},
		],
		userTids: [userTid],
		season: startingSeason,
		startingSeason,
		teamInfoCache: teamInfos.map(t => ({
			abbrev: t.abbrev,
			disabled: t.disabled,
			imgURL: t.imgURL,
			imgURLSmall: t.imgURLSmall,
			name: t.name,
			region: t.region,
		})),
		gracePeriodEnd: startingSeason + 2, // Can't get fired for the first two seasons
		numTeams: teamInfos.length,
		numActiveTeams: teamInfos.filter(t => !t.disabled).length,
	};

	if (leagueFile.gameAttributes) {
		for (const [key, value] of Object.entries(leagueFile.gameAttributes)) {
			// userTid is handled special below
			if (key !== "userTid") {
				(gameAttributes as any)[key] = value;
			}

			// Hack to replace null with -Infinity, cause Infinity is not in JSON spec
			if (Array.isArray(value) && value.length > 0 && value[0].start === null) {
				value[0].start = -Infinity;
			}
		}

		// 2nd pass, so we know phase/season from league file were applied already
		if (leagueFile.gameAttributes.userTid !== undefined) {
			const value = leagueFile.gameAttributes.userTid;

			// Handle league file with userTid history, but user selected a new team maybe
			if (gameAttributeHasHistory(value)) {
				const last = value[value.length - 1];
				if (last.value === userTid) {
					// Bring over history
					gameAttributes.userTid = value;
				} else {
					if (gameAttributes.season === gameAttributes.startingSeason) {
						// If this is first year in the file, put at -Infinity
						gameAttributes.userTid = [
							{
								start: -Infinity,
								value: userTid,
							},
						];
					} else {
						// Bring over history
						gameAttributes.userTid = value;

						// Keep in sync with g.wrap
						let currentSeason = gameAttributes.season;
						if (gameAttributes.phase > PHASE.PLAYOFFS) {
							currentSeason += 1;
						}

						if (last.start === currentSeason) {
							// Overwrite entry for this season
							last.value = userTid;
						} else {
							// Add new entry
							gameAttributes.userTid.push({
								start: currentSeason,
								value: userTid,
							});
						}
					}
				}
			}
		}

		// Special case for userTids - don't use saved value if userTid is not in it
		if (!gameAttributes.userTids.includes(userTid)) {
			gameAttributes.userTids = [userTid];
		}
	}

	// Extra check for easyDifficultyInPast, so that it won't be overwritten by a league file if the user selects Easy
	// when creating a new league.
	if (gameAttributes.difficulty <= DIFFICULTY.Easy) {
		gameAttributes.easyDifficultyInPast = true;
	}

	// Ensure numGamesPlayoffSeries doesn't have an invalid value, relative to numTeams
	const oldNumGames = unwrapGameAttribute(
		gameAttributes,
		"numGamesPlayoffSeries",
	);
	let newNumGames = oldNumGames;
	let legacyPlayoffs = (gameAttributes as any).numPlayoffRounds !== undefined;
	try {
		helpers.validateRoundsByes(
			oldNumGames.length,
			unwrapGameAttribute(gameAttributes, "numPlayoffByes"),
			gameAttributes.numActiveTeams,
		);
	} catch (error) {
		legacyPlayoffs = true;
	}
	if (legacyPlayoffs) {
		// Handle legacy case where numPlayoffRounds is set
		newNumGames = getValidNumGamesPlayoffSeries(
			oldNumGames,
			(gameAttributes as any).numPlayoffRounds,
			gameAttributes.numActiveTeams,
		);
		delete (gameAttributes as any).numPlayoffRounds;
	}

	// Don't have too many playoff teams in custom leagues... like in a 16 team league, we don't want 16 teams in the playoffs
	if (
		!leagueFile.gameAttributes ||
		!leagueFile.gameAttributes.numGamesPlayoffSeries
	) {
		while (
			2 ** newNumGames.length > 0.75 * gameAttributes.numTeams &&
			newNumGames.length > 1
		) {
			newNumGames.shift();
		}
	}

	// If tiebreakers aren't specified in league file and this is an old league file, tiebreakers should have been random up to now
	if (
		leagueFile.gameAttributes &&
		!leagueFile.gameAttributes.tiebreakers &&
		(version === undefined || version <= 42)
	) {
		if (
			leagueFile.gameAttributes.season !== undefined &&
			leagueFile.gameAttributes.phase !== undefined
		) {
			const actualPhase =
				leagueFile.gameAttributes.nextPhase ?? leagueFile.gameAttributes.phase;

			let currentSeason = leagueFile.gameAttributes.season;
			if (actualPhase >= PHASE.PLAYOFFS) {
				currentSeason += 1;
			}

			// Apply default tiebreakers, while keeping track of when that happened
			const tiebreakers = [
				{
					start: -Infinity,
					value: ["coinFlip"] as GameAttributesLeague["tiebreakers"],
				},
				{
					start: currentSeason,
					value: defaultGameAttributes.tiebreakers[0].value,
				},
			];

			gameAttributes.tiebreakers = tiebreakers;
		}
	}

	// If we're using some non-default value of numGamesPlayoffSeries, set byes to 0 otherwise it might break for football where the default number of byes is 4
	if (JSON.stringify(oldNumGames) !== JSON.stringify(newNumGames)) {
		gameAttributes.numPlayoffByes = wrap(gameAttributes, "numPlayoffByes", 0);
		gameAttributes.numGamesPlayoffSeries = wrap(
			gameAttributes,
			"numGamesPlayoffSeries",
			newNumGames,
		);
	}

	if (gameAttributes.numDraftRounds < 0) {
		throw new Error("numDraftRounds must be a positive number");
	}

	if (gameAttributes.equalizeRegions) {
		let totalPopulation = 0;
		for (const t of teamInfos) {
			totalPopulation += t.pop;
		}

		// Round to 2 digits
		const averagePopulation =
			Math.round((totalPopulation / teamInfos.length) * 100) / 100;

		for (const t of teamInfos) {
			t.pop = averagePopulation;
		}

		if (leagueFile.scheduledEvents) {
			for (const event of leagueFile.scheduledEvents) {
				if (event.type === "expansionDraft") {
					for (const t of event.info.teams) {
						t.pop = averagePopulation;
					}
				} else if (event.type === "teamInfo" && event.info.pop !== undefined) {
					event.info.pop = averagePopulation;
				}
			}
		}
	}

	return gameAttributes;
};

export default createGameAttributes;
