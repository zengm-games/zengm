import { DIFFICULTY, PHASE } from "../../../common";
import type { GameAttributesLeagueWithHistory } from "../../../common/types";
import { defaultGameAttributes, helpers } from "../../util";
import { gameAttributeHasHistory, unwrap, wrap } from "../../util/g";
import type { LeagueFile, TeamInfo } from "./create";
import getValidNumGamesPlayoffSeries from "./getValidNumGamesPlayoffSeries";

const createGameAttributes = ({
	difficulty,
	leagueFile,
	leagueName,
	teamInfos,
	userTid,
}: {
	difficulty: number;
	leagueFile: LeagueFile;
	leagueName: string;
	teamInfos: TeamInfo[];
	userTid: number;
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
		leagueName,
		teamInfoCache: teamInfos.map(t => ({
			abbrev: t.abbrev,
			disabled: t.disabled,
			imgURL: t.imgURL,
			name: t.name,
			region: t.region,
		})),
		gracePeriodEnd: startingSeason + 2, // Can't get fired for the first two seasons
		numTeams: teamInfos.length,
		numActiveTeams: teamInfos.filter(t => !t.disabled).length,
		difficulty,
	};

	if (leagueFile.gameAttributes) {
		for (const gameAttribute of leagueFile.gameAttributes) {
			// Set default for anything except these, since they can be overwritten by form input.
			if (
				gameAttribute.key !== "leagueName" &&
				gameAttribute.key !== "difficulty"
			) {
				// userTid is handled special below
				if (gameAttribute.key !== "userTid") {
					(gameAttributes as any)[gameAttribute.key] = gameAttribute.value;
				}

				// Hack to replace null with -Infinity, cause Infinity is not in JSON spec
				if (
					Array.isArray(gameAttribute.value) &&
					gameAttribute.value.length > 0 &&
					gameAttribute.value[0].start === null
				) {
					gameAttribute.value[0].start = -Infinity;
				}
			}
		}

		// 2nd pass, so we know phase/season from league file were applied already
		for (const gameAttribute of leagueFile.gameAttributes) {
			if (gameAttribute.key === "userTid") {
				// Handle league file with userTid history, but user selected a new team maybe
				if (gameAttributeHasHistory(gameAttribute.value)) {
					const last = gameAttribute.value[gameAttribute.value.length - 1];
					if (last.value === userTid) {
						// Bring over history
						gameAttributes.userTid = gameAttribute.value;
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
							gameAttributes.userTid = gameAttribute.value;

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
		}

		// Special case for userTids - don't use saved value if userTid is not in it
		if (!gameAttributes.userTids.includes(userTid)) {
			gameAttributes.userTids = [userTid];
		}
	}

	// Extra check for easyDifficultyInPast, so that it won't be overwritten by a league file if the user selects Easy
	// when creating a new league.
	if (difficulty <= DIFFICULTY.Easy) {
		gameAttributes.easyDifficultyInPast = true;
	}

	// Ensure numGamesPlayoffSeries doesn't have an invalid value, relative to numTeams
	const oldNumGames = unwrap(gameAttributes, "numGamesPlayoffSeries");
	let newNumGames = oldNumGames;
	let legacyPlayoffs = (gameAttributes as any).numPlayoffRounds !== undefined;
	try {
		helpers.validateRoundsByes(
			oldNumGames.length,
			unwrap(gameAttributes, "numPlayoffByes"),
			gameAttributes.numActiveTeams,
		);
	} catch (error) {
		// Would be better to hard error here, but backwards compatibility
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
