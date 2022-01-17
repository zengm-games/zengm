import { defaultInjuries, defaultTragicDeaths, g } from "../util";
import type {
	Conf,
	GameAttributesLeague,
	GetLeagueOptionsReal,
	InjuriesSetting,
	TragicDeaths,
	UpdateEvents,
} from "../../common/types";
import goatFormula from "../util/goatFormula";

const keys = [
	"godMode",
	"godModeInPast",
	"numGames",
	"numGamesDiv",
	"numGamesConf",
	"numActiveTeams",
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
	"hardCap",
	"numGamesPlayoffSeries",
	"numPlayoffByes",
	"draftType",
	"draftAges",
	"playersRefuseToNegotiate",
	"allStarGame",
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
	"challengeThanosMode",
	"realPlayerDeterminism",
	"repeatSeason",
	"ties",
	"otl",
	"spectator",
	"elam",
	"elamASG",
	"elamMinutes",
	"elamPoints",
	"playerMoodTraits",
	"numPlayersOnCourt",
	"numDraftRounds",
	"tradeDeadline",
	"autoDeleteOldBoxScores",
	"difficulty",
	"stopOnInjury",
	"stopOnInjuryGames",
	"aiJerseyRetirement",
	"numPeriods",
	"tiebreakers",
	"pointsFormula",
	"equalizeRegions",
	"realDraftRatings",
	"hideDisabledTeams",
	"hofFactor",
	"injuries",
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
	"goatFormula",
] as const;

export type Settings = Pick<
	GameAttributesLeague,
	Exclude<
		typeof keys[number],
		| "repeatSeason"
		| "realDraftRatings"
		| "injuries"
		| "tragicDeaths"
		| "goatFormula"
		| "numActiveTeams"
	>
> & {
	repeatSeason: boolean;
	noStartingInjuries: boolean;
	realDraftRatings: Exclude<
		GameAttributesLeague["realDraftRatings"],
		undefined
	>;
	randomization: "none" | "shuffle" | "debuts" | "debutsForever";
	realStats: GetLeagueOptionsReal["realStats"];
	injuries: InjuriesSetting;
	tragicDeaths: TragicDeaths;
	goatFormula: string;
	confs?: Conf[];

	// undefined in DefaultNewLeagueSettings - then it is not possible to validate some settings that depend on it
	numActiveTeams: number | undefined;
};

const updateSettings = async (inputs: unknown, updateEvents: UpdateEvents) => {
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("gameAttributes")
	) {
		const initialSettings: Settings = {
			godMode: g.get("godMode"),
			godModeInPast: g.get("godModeInPast"),
			numGames: g.get("numGames"),
			numGamesDiv: g.get("numGamesDiv"),
			numGamesConf: g.get("numGamesConf"),
			numActiveTeams: g.get("numActiveTeams"),
			quarterLength: g.get("quarterLength"),
			maxRosterSize: g.get("maxRosterSize"),
			minRosterSize: g.get("minRosterSize"),
			salaryCap: g.get("salaryCap"),
			minPayroll: g.get("minPayroll"),
			luxuryPayroll: g.get("luxuryPayroll"),
			luxuryTax: g.get("luxuryTax"),
			minContract: g.get("minContract"),
			maxContract: g.get("maxContract"),
			minContractLength: g.get("minContractLength"),
			maxContractLength: g.get("maxContractLength"),
			aiTradesFactor: g.get("aiTradesFactor"),
			injuryRate: g.get("injuryRate"),
			homeCourtAdvantage: g.get("homeCourtAdvantage"),
			rookieContractLengths: g.get("rookieContractLengths"),
			rookiesCanRefuse: g.get("rookiesCanRefuse"),
			tragicDeathRate: g.get("tragicDeathRate"),
			brotherRate: g.get("brotherRate"),
			sonRate: g.get("sonRate"),
			forceRetireAge: g.get("forceRetireAge"),
			hardCap: g.get("hardCap"),
			numGamesPlayoffSeries: g.get("numGamesPlayoffSeries"),
			numPlayoffByes: g.get("numPlayoffByes"),
			draftType: g.get("draftType"),
			draftAges: g.get("draftAges"),
			playersRefuseToNegotiate: g.get("playersRefuseToNegotiate"),
			allStarGame: g.get("allStarGame"),
			budget: g.get("budget"),
			numSeasonsFutureDraftPicks: g.get("numSeasonsFutureDraftPicks"),
			foulRateFactor: g.get("foulRateFactor"),
			foulsNeededToFoulOut: g.get("foulsNeededToFoulOut"),
			foulsUntilBonus: g.get("foulsUntilBonus"),
			threePointers: g.get("threePointers"),
			pace: g.get("pace"),
			threePointTendencyFactor: g.get("threePointTendencyFactor"),
			threePointAccuracyFactor: g.get("threePointAccuracyFactor"),
			twoPointAccuracyFactor: g.get("twoPointAccuracyFactor"),
			blockFactor: g.get("blockFactor"),
			stealFactor: g.get("stealFactor"),
			turnoverFactor: g.get("turnoverFactor"),
			orbFactor: g.get("orbFactor"),
			challengeNoDraftPicks: g.get("challengeNoDraftPicks"),
			challengeNoFreeAgents: g.get("challengeNoFreeAgents"),
			challengeNoTrades: g.get("challengeNoTrades"),
			challengeLoseBestPlayer: g.get("challengeLoseBestPlayer"),
			challengeNoRatings: g.get("challengeNoRatings"),
			challengeFiredLuxuryTax: g.get("challengeFiredLuxuryTax"),
			challengeFiredMissPlayoffs: g.get("challengeFiredMissPlayoffs"),
			challengeThanosMode: g.get("challengeThanosMode"),
			realPlayerDeterminism: g.get("realPlayerDeterminism"),
			repeatSeason: !!g.get("repeatSeason"),
			ties: g.get("ties"),
			otl: g.get("otl"),
			spectator: g.get("spectator"),
			elam: g.get("elam"),
			elamASG: g.get("elamASG"),
			elamMinutes: g.get("elamMinutes"),
			elamPoints: g.get("elamPoints"),
			playerMoodTraits: g.get("playerMoodTraits"),
			numPlayersOnCourt: g.get("numPlayersOnCourt"),
			numDraftRounds: g.get("numDraftRounds"),
			tradeDeadline: g.get("tradeDeadline"),
			autoDeleteOldBoxScores: g.get("autoDeleteOldBoxScores"),
			difficulty: g.get("difficulty"),
			stopOnInjury: g.get("stopOnInjury"),
			stopOnInjuryGames: g.get("stopOnInjuryGames"),
			aiJerseyRetirement: g.get("aiJerseyRetirement"),
			numPeriods: g.get("numPeriods"),
			tiebreakers: g.get("tiebreakers"),
			pointsFormula: g.get("pointsFormula"),
			equalizeRegions: g.get("equalizeRegions"),
			hideDisabledTeams: g.get("hideDisabledTeams"),
			noStartingInjuries: false,
			hofFactor: g.get("hofFactor"),
			injuries: g.get("injuries") ?? defaultInjuries,
			inflationAvg: g.get("inflationAvg"),
			inflationMax: g.get("inflationMax"),
			inflationMin: g.get("inflationMin"),
			inflationStd: g.get("inflationStd"),
			playoffsByConf: g.get("playoffsByConf"),
			playoffsNumTeamsDiv: g.get("playoffsNumTeamsDiv"),
			playoffsReseed: g.get("playoffsReseed"),
			playerBioInfo: g.get("playerBioInfo"),
			playIn: g.get("playIn"),
			confs: g.get("confs"),
			numPlayersDunk: g.get("numPlayersDunk"),
			numPlayersThree: g.get("numPlayersThree"),
			fantasyPoints: g.get("fantasyPoints"),
			tragicDeaths: g.get("tragicDeaths") ?? defaultTragicDeaths,
			goatFormula: g.get("goatFormula") ?? goatFormula.DEFAULT_FORMULA,

			// Might as well be undefined, because it will never be saved from this form, only the new league form
			realDraftRatings: g.get("realDraftRatings") ?? "rookie",
			randomization: "none",
			realStats: "none",
		};

		return {
			initialSettings,
		};
	}
};

export default updateSettings;
