import { g } from "../util/index.ts";
import type {
	GameAttributesLeague,
	GetLeagueOptionsReal,
	InjuriesSetting,
	TragicDeaths,
} from "../../common/types.ts";
import goatFormula from "../util/goatFormula.ts";
import { defaultTragicDeaths } from "../util/defaultTragicDeaths.ts";
import { defaultInjuries } from "../util/defaultInjuries.ts";
import { defineView } from "../util/defineView.ts";
import { DEFAULT_REAL_DRAFT_RATINGS } from "../../common/constants.ts";

// Settings that are game attributes with the same value in the settings form
const gameAttributeKeys = [
	"godMode",
	"godModeInPast",
	"numGames",
	"numGamesDiv",
	"numGamesConf",
	"quarterLength",
	"maxRosterSize",
	"minRosterSize",
	"salaryCap",
	"minPayroll",
	"luxuryPayroll",
	"luxuryTax",
	"minContract",
	"maxContract",
	"minContractLength",
	"maxContractLength",
	"aiTradesFactor",
	"injuryRate",
	"homeCourtAdvantage",
	"rookieContractLengths",
	"rookiesCanRefuse",
	"tragicDeathRate",
	"brotherRate",
	"sonRate",
	"forceRetireAge",
	"forceRetireSeasons",
	"salaryCapType",
	"numGamesPlayoffSeries",
	"numPlayoffByes",
	"draftType",
	"draftAges",
	"playersRefuseToNegotiate",
	"allStarGame",
	"allStarNum",
	"allStarType",
	"budget",
	"numSeasonsFutureDraftPicks",
	"foulRateFactor",
	"foulsNeededToFoulOut",
	"foulsUntilBonus",
	"threePointers",
	"pace",
	"threePointTendencyFactor",
	"threePointAccuracyFactor",
	"twoPointAccuracyFactor",
	"ftAccuracyFactor",
	"blockFactor",
	"stealFactor",
	"turnoverFactor",
	"orbFactor",
	"challengeNoDraftPicks",
	"challengeNoFreeAgents",
	"challengeNoTrades",
	"challengeLoseBestPlayer",
	"challengeNoRatings",
	"challengeFiredLuxuryTax",
	"challengeFiredMissPlayoffs",
	"challengeSisyphusMode",
	"challengeThanosMode",
	"realPlayerDeterminism",
	"maxOvertimes",
	"maxOvertimesPlayoffs",
	"shootoutRounds",
	"shootoutRoundsPlayoffs",
	"otl",
	"spectator",
	"elam",
	"elamASG",
	"elamMinutes",
	"elamOvertime",
	"elamPoints",
	"playerMoodTraits",
	"numPlayersOnCourt",
	"numDraftRounds",
	"tradeDeadline",
	"difficulty",
	"stopOnInjury",
	"stopOnInjuryGames",
	"aiJerseyRetirement",
	"numPeriods",
	"tiebreakers",
	"pointsFormula",
	"equalizeRegions",
	"hideDisabledTeams",
	"hofFactor",
	"inflationAvg",
	"inflationMax",
	"inflationMin",
	"inflationStd",
	"playoffsByConf",
	"playoffsNumTeamsDiv",
	"playoffsReseed",
	"playerBioInfo",
	"playIn",
	"numPlayersDunk",
	"numPlayersThree",
	"fantasyPoints",
	"draftPickAutoContract",
	"draftPickAutoContractPercent",
	"draftPickAutoContractRounds",
	"dh",
	"draftLotteryCustomNumPicks",
	"draftLotteryCustomChances",
	"passFactor",
	"rushYdsFactor",
	"passYdsFactor",
	"completionFactor",
	"scrambleFactor",
	"sackFactor",
	"fumbleFactor",
	"intFactor",
	"fgAccuracyFactor",
	"fourthDownFactor",
	"onsideFactor",
	"onsideRecoveryFactor",
	"hitFactor",
	"giveawayFactor",
	"takeawayFactor",
	"deflectionFactor",
	"saveFactor",
	"assistFactor",
	"foulFactor",
	"groundFactor",
	"lineFactor",
	"flyFactor",
	"powerFactor",
	"throwOutFactor",
	"strikeFactor",
	"balkFactor",
	"wildPitchFactor",
	"passedBallFactor",
	"hitByPitchFactor",
	"swingFactor",
	"contactFactor",
	"errorFactor",
	"softCapTradeSalaryMatch",
	"gender",
	"heightFactor",
	"weightFactor",
	"allStarDunk",
	"allStarThree",
	"minRetireAge",
	"numWatchColors",
	"groupScheduleSeries",
	"autoExpandProb",
	"autoExpandNumTeams",
	"autoExpandMaxNumTeams",
	"autoExpandGeo",
	"autoRelocateProb",
	"autoRelocateGeo",
	"autoRelocateRealign",
	"autoRelocateRebrand",
	"alwaysShowCountry",
	"neutralSite",
	"rpdPot",
	"saveOldBoxScores",
	"currencyFormat",
	"overtimeLength",
	"overtimeLengthPlayoffs",
	"forceRetireRealPlayers",
	"forceHistoricalRosters",
	"scrimmageTouchbackKickoff",
	"twoPointConversions",
	"footballOvertime",
	"footballOvertimePlayoffs",
	"easterEggPlayers",
	"fakeAgeProb",
] as const satisfies readonly (keyof GameAttributesLeague)[];

type GameAttributeKey = (typeof gameAttributeKeys)[number];

export type NewLeagueSettings = Pick<GameAttributesLeague, GameAttributeKey> & {
	repeatSeason:
		| NonNullable<GameAttributesLeague["repeatSeason"]>["type"]
		| "disabled";
	realDraftRatings: Exclude<
		GameAttributesLeague["realDraftRatings"],
		undefined
	>;
	injuries: InjuriesSetting;
	tragicDeaths: TragicDeaths;
	goatFormula: string;
	goatSeasonFormula: string;

	// Not game attributes, these only affect how a new league is created
	noStartingInjuries: boolean;
	randomization:
		| "none"
		| "shuffle"
		| "debuts"
		| "debutsKeepCurrent"
		| "debutsForever"
		| "debutsForeverKeepCurrent";
	realStats: GetLeagueOptionsReal["realStats"];
	giveMeWorstRoster: boolean;
};

export type Settings = NewLeagueSettings & {
	confs: GameAttributesLeague["confs"];

	// undefined in DefaultNewLeagueSettings - then it is not possible to validate some settings that depend on it
	numActiveTeams: number | undefined;
};

// getGameAttribute returns the current value of a game attribute, either in an existing league or the default for a new league
export const getSettingsFromGameAttributes = (
	getGameAttribute: <T extends keyof GameAttributesLeague>(
		key: T,
	) => GameAttributesLeague[T],
): NewLeagueSettings => {
	const settings = {} as Pick<GameAttributesLeague, GameAttributeKey>;
	for (const key of gameAttributeKeys) {
		(settings as Record<GameAttributeKey, unknown>)[key] =
			getGameAttribute(key);
	}

	return {
		...settings,
		repeatSeason: getGameAttribute("repeatSeason")?.type ?? "disabled",
		realDraftRatings:
			getGameAttribute("realDraftRatings") ?? DEFAULT_REAL_DRAFT_RATINGS,
		injuries: getGameAttribute("injuries") ?? defaultInjuries,
		tragicDeaths: getGameAttribute("tragicDeaths") ?? defaultTragicDeaths,
		goatFormula: getGameAttribute("goatFormula") ?? goatFormula.DEFAULT_FORMULA,
		goatSeasonFormula:
			getGameAttribute("goatSeasonFormula") ??
			goatFormula.DEFAULT_FORMULA_SEASON,
		noStartingInjuries: false,
		randomization: "none",
		realStats: "none",
		giveMeWorstRoster: false,
	};
};

export const getInitialSettings = (): Settings => {
	return {
		...getSettingsFromGameAttributes((key) => g.get(key)),
		confs: g.get("confs"),
		numActiveTeams: g.get("numActiveTeams"),
	};
};

export default defineView({
	id: "settings",
	load: ({ updateEvents }) => {
		if (updateEvents.has("firstRun") || updateEvents.has("gameAttributes")) {
			return {
				initialSettings: getInitialSettings(),
			};
		}
	},
});
