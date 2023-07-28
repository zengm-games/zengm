import type { Face } from "facesjs";
import type { MouseEvent, ReactNode } from "react";
import type processInputs from "../worker/api/processInputs";
import type views from "../worker/views";

export type Env = {
	enableLogging: boolean;
	heartbeatID: string;
	mobile: boolean;
	useSharedWorker: boolean;
};

declare global {
	interface Window {
		bbgm: any; // Just for debugging
		bbgmVersion: string;
		bugsnagKey: string;
		enableLogging: boolean;
		freestar: any;
		getTheme: () => string;
		googletag: any;
		heartbeatID: string;
		mobile: boolean;
		releaseStage: string;
		_qevents: any;
		themeCSSLink: HTMLLinkElement;
		useSharedWorker: boolean;
		withGoodUI: () => void;
		withGoodWorker: () => void;
	}

	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace NodeJS {
		interface ProcessEnv {
			NODE_ENV: "development" | "production" | "test";
			SPORT: "basketball" | "football" | "baseball" | "hockey";
		}
	}
}

type ViewsKeys = keyof typeof views;

export type View<Name extends ViewsKeys> = Exclude<
	Awaited<
		Name extends ViewsKeys
			? ReturnType<(typeof views)[Name]>
			: Record<string, unknown>
	>,
	void | { redirectUrl: string } | { errorMessage: string }
>;

export type ViewInput<T extends keyof typeof processInputs> = Exclude<
	ReturnType<(typeof processInputs)[T]>,
	{ redirectUrl: string }
>;

export type AchievementWhen =
	| "afterAwards"
	| "afterFired"
	| "afterPlayoffs"
	| "afterRegularSeason";

export type Achievement = {
	slug: string;
	name: string;
	category: string;
	desc: string;
	check?: () => Promise<boolean>;
	when?: AchievementWhen;
};

export type AllStarPlayer = {
	injured?: true;
	pid: number;
	tid: number;
	name: string;
};

export type DunkAttempt = {
	toss: string;
	distance: string;
	move1: string;
	move2: string;
};

type DunkResult = {
	// Index of dunk.players
	index: number;

	// Last attempt is the first successful one
	attempts: DunkAttempt[];

	// Undefind until a successful dunk or LOWEST_POSSIBLE_SCORE
	score?: number;
	made: boolean;
};

// Done rack when there are 5 entries here
type ThreeRack = boolean[];

export type ThreeResult = {
	index: number;
	racks: ThreeRack[];
};

export type AllStars = {
	season: number;
	teamNames: [string, string];
	teams: [AllStarPlayer[], AllStarPlayer[]];
	remaining: AllStarPlayer[];
	finalized: boolean; // Refers to if draft is complete or not
	type: GameAttributesLeague["allStarType"];

	// After game is complete
	gid?: number;
	score?: [number, number];
	overtimes?: number;
	mvp?: {
		pid: number;
		tid: number;
		name: string;
	};

	dunk?: {
		players: AllStarPlayer[];

		// 2 rounds, plus tiebreaker rounds
		rounds: {
			tiebreaker?: true;
			dunkers: number[]; // Index of dunk.players

			// Default is 2 dunks per player per round, but tiebreaker rounds are 1 dunk per round
			dunks: DunkResult[];
		}[];

		controlling: number[]; // Indexes of dunk.players

		// Index of players array above. Undefined if still in progress
		winner?: number;

		// 2 players each because you can't jump over yourself, but the tallest/shortest player might be a contestant
		pidsTall: [number, number];
		pidsShort: [number, number];
	};

	three?: {
		players: AllStarPlayer[];

		rounds: {
			tiebreaker?: true;
			indexes: number[]; // Index of three.players

			results: ThreeResult[];
		}[];

		// Index of players array above. Undefined if still in progress
		winner?: number;
	};
};

export type CompositeWeights<RatingKey = string> = {
	[key: string]: {
		ratings: (RatingKey | number)[];
		weights?: number[];
		skill?: {
			label: string;
			cutoff?: number;
		};
	};
};

// Not exact because https://github.com/facebook/flow/issues/2386 - same thing elsewhere
export type Conditions = {
	hostID?: number;
};

export type DraftLotteryResultArray = {
	tid: number;
	originalTid: number;
	chances: number;
	pick?: number;
	won: number;
	lost: number;
	tied: number;
	otl: number;
	pts?: number;
	dpid: number;
}[];

export type DraftLotteryResult = {
	season: number;
	draftType?:
		| Exclude<
				DraftType,
				"random" | "noLottery" | "freeAgents" | "noLotteryReverse"
		  >
		| "dummy";
	rigged?: GameAttributesLeague["riggedLottery"];
	result: DraftLotteryResultArray;
};

export type DraftPickSeason = number | "fantasy" | "expansion";

export type DraftPickWithoutKey = {
	dpid?: number;
	tid: number;
	originalTid: number;
	round: number;
	pick: number;
	// 0 if not set
	season: DraftPickSeason;
};

export type DraftPick = {
	dpid: number;
} & DraftPickWithoutKey;

export type DraftType =
	| "nba1994"
	| "nba2019"
	| "noLottery"
	| "noLotteryReverse"
	| "random"
	| "coinFlip"
	| "randomLottery"
	| "randomLotteryFirst3"
	| "nba1990"
	| "freeAgents"
	| "nhl2017"
	| "nhl2021"
	| "mlb2022"
	| "custom";

// Key is team ID receiving this asset
// Why store name and extra draft pick info? For performance a bit, but mostly in case old players are deleted in a league, the trade event will still show something reasonable
type TradeEventAsset =
	| {
			pid: number;
			name: string;
			contract: PlayerContract;
			ratingsIndex: number;
			statsIndex: number;
	  }
	| {
			dpid: number;
			season: DraftPickSeason;
			round: number;
			originalTid: number;
	  };

export type TradeEventTeams = {
	assets: TradeEventAsset[];
}[];

export type DiscriminateUnion<
	T,
	K extends keyof T,
	V extends T[K],
> = T extends Record<K, V> ? T : never;

export type EventBBGMWithoutKey =
	| {
			type: Exclude<LogEventType, "sisyphus" | "trade">;
			text: string;
			pids?: number[];
			dpids?: number[];
			tids?: number[];
			season: number;

			// < 10: not very important
			// < 20: somewhat important
			// >= 20: very important
			score?: number;
	  }
	| {
			type: "sisyphus";
			pids: number[];
			tids: number[];
			season: number;
			wonTitle: boolean;

			// For TypeScript, never actually used
			score?: undefined;
			text?: undefined;
			dpids?: undefined;
	  }
	| {
			type: "trade";
			text?: string; // Only legacy will have text
			pids: number[];
			dpids: number[];
			tids: number[];
			season: number;

			// These three will only be undefind in legacy events
			phase?: Phase;
			score?: number;
			teams?: TradeEventTeams;
	  };

export type EventBBGM = EventBBGMWithoutKey & {
	eid: number;
};

type GameTeam = {
	tid: number;
	players: any[];

	ovr?: number; // Undefined for legacy objects
	won?: number; // Undefined for legacy objects
	lost?: number; // Undefined for legacy objects
	tied?: number; // Undefined for legacy objects or if there are no ties in this sport
	otl?: number; // Undefined for legacy objects or if there are no otls in this sport

	playoffs?: {
		seed: number;
		won: number;
		lost: number;
	};

	// For stats
	[key: string]: any;
};

export type Game = {
	att: number;
	clutchPlays?: string[];
	day?: number; // Only optional for legacy
	forceWin?: number; // If defined, it's the number of iterations that were used to force the win/tie
	gid: number;
	lost: {
		tid: number;
		pts: number;
	};
	numGamesToWinSeries?: number;
	numPeriods?: number; // Optional only for legacy, otherwise it's the number of periods in the game, defined at the start
	numPlayersOnCourt?: number;
	playoffs: boolean;
	overtimes: number;
	scoringSummary?: any;
	season: number;
	teams: [GameTeam, GameTeam];
	won: {
		tid: number;
		pts: number;
	};
};

export type GamePlayer = any;

export type GameResults = any;

export type GameAttributesNonLeague = { lid: undefined };

export type ScheduledEventGameAttributes = {
	type: "gameAttributes";
	season: number;
	phase: Phase;
	info: Partial<GameAttributesLeague>;
};

export type ScheduledEventTeamInfo = {
	type: "teamInfo";
	season: number;
	phase: Phase;
	info: {
		tid: number;
		region?: string;
		srID?: string;
		name?: string;
		pop?: number;
		did?: number;
		abbrev?: string;
		imgURL?: string;
		imgURLSmall?: string;
		colors?: [string, string, string];
		jersey?: string;
	};
};

export type ScheduledEventWithoutKey =
	| ScheduledEventTeamInfo
	| ScheduledEventGameAttributes
	| {
			type: "expansionDraft";
			season: number;
			phase: Phase;
			info: {
				// Actually stadiumCapacity is optional
				teams: (ExpansionDraftSetupTeam & {
					tid: number;
					srID?: string;
				})[];
				numProtectedPlayers?: number;
			};
	  }
	| {
			type: "contraction";
			season: number;
			phase: Phase;
			info: {
				tid: number;
			};
	  }
	| {
			type: "unretirePlayer";
			season: number;
			phase: Phase;
			info: {
				pid: number;
			};
	  };

export type ScheduledEvent = ScheduledEventWithoutKey & { id: number };

type GameAttributeWithHistory<T> = {
	start: number;
	value: T;
}[];

export type ExpansionDraftSetupTeam = {
	abbrev: string;
	region: string;
	name: string;
	imgURL: string | undefined;
	imgURLSmall?: string;
	colors: [string, string, string];
	jersey?: string;
	pop: string;
	stadiumCapacity: string;
	did: string;
	takeControl: boolean;

	// tid is for referencing a disabled current team
	tid?: number;
};

export type NamesLegacy = {
	first: {
		[key: string]: [string, number][];
	};
	last: {
		[key: string]: [string, number][];
	};
};

export type Conf = { cid: number; name: string };
export type Div = { cid: number; did: number; name: string };

export type InjuriesSetting = {
	name: string;
	frequency: number;
	games: number;
}[];

export type TragicDeaths = {
	reason: string;
	frequency: number;
}[];

export type GameAttributesLeague = {
	aiJerseyRetirement: boolean;
	aiTradesFactor: number;
	allStarGame: number | null;
	allStarNum: number;
	allStarType: "draft" | "byConf" | "top";
	allStarDunk: boolean;
	allStarThree: boolean;
	autoDeleteOldBoxScores: boolean;
	/*autoExpandProb: number;
	autoExpandNumTeams: number;
	autoExpandGeo: "naFirst" | "naOnly" | "any";*/
	autoRelocate:
		| {
				phase: "vote";
				tid: number;
				abbrev: string;
				realigned?: number[][];
		  }
		| undefined;
	autoRelocateProb: number;
	autoRelocateGeo: "naFirst" | "naOnly" | "any";
	autoRelocateRealign: boolean;
	autoRelocateRebrand: boolean;
	brotherRate: number;
	budget: boolean;
	challengeNoDraftPicks: boolean;
	challengeNoFreeAgents: boolean;
	challengeNoRatings: boolean;
	challengeNoTrades: boolean;
	challengeLoseBestPlayer: boolean;
	challengeFiredLuxuryTax: boolean;
	challengeFiredMissPlayoffs: boolean;
	challengeSisyphusMode: boolean;
	challengeThanosMode: number;
	thanosCooldownEnd: number | undefined;
	confs: Conf[];
	daysLeft: number;
	defaultStadiumCapacity: number;
	dh: "all" | "none" | number[];
	difficulty: number;
	divs: Div[];
	draftAges: [number, number];
	draftPickAutoContract: boolean;
	draftPickAutoContractPercent: number;
	draftPickAutoContractRounds: number;
	draftType: DraftType;
	draftLotteryCustomChances: number[];
	draftLotteryCustomNumPicks: number;
	elam: boolean;
	elamASG: boolean;
	elamMinutes: number;
	elamOvertime: boolean;
	elamPoints: number;
	equalizeRegions: boolean;
	fantasyPoints?: "standard" | "ppr" | "halfPpr";
	forceRetireAge: number;
	foulsNeededToFoulOut: number;
	foulsUntilBonus: number[];
	foulRateFactor: number;
	gameOver: boolean;
	gender: "female" | "male";
	goatFormula?: string;
	goatSeasonFormula?: string;
	godMode: boolean;
	godModeInPast: boolean;
	gracePeriodEnd: number;
	groupScheduleSeries: boolean;
	heightFactor: number;
	hideDisabledTeams: boolean;
	hofFactor: number;
	homeCourtAdvantage: number;
	inflationAvg: number;
	inflationMax: number;
	inflationMin: number;
	inflationStd: number;
	injuries?: InjuriesSetting;
	injuryRate: number;
	lid: number;
	lowestDifficulty: number;
	luxuryPayroll: number;
	luxuryTax: number;
	maxContract: number;
	maxContractLength: number;
	maxRosterSize: number;
	minContract: number;
	minContractLength: number;
	minPayroll: number;
	minRetireAge: number;
	minRosterSize: number;
	names?: NamesLegacy;
	nextPhase?: Phase;
	numActiveTeams: number;
	numDraftPicksCurrent?: number;
	numDraftRounds: number;
	numGames: number;
	numGamesDiv: number | null;
	numGamesConf: number | null;
	numGamesPlayoffSeries: number[];
	numPeriods: number;
	numPlayersDunk: number;
	numPlayersOnCourt: number;
	numPlayersThree: number;
	numPlayoffByes: number;
	numSeasonsFutureDraftPicks: number;
	numTeams: number;
	numWatchColors: number;
	playIn: boolean;
	playerMoodTraits: boolean;
	pointsFormula: string;
	spectator: boolean;
	otl: boolean;
	otherTeamsWantToHire: boolean;
	phase: Phase;
	playerBioInfo?: PlayerBioInfo;
	playersRefuseToNegotiate: boolean;
	playoffsByConf: boolean;
	playoffsNumTeamsDiv: number;
	playoffsReseed: boolean;
	quarterLength: number;
	randomDebutsForever?: number;
	realDraftRatings?: "draft" | "rookie";
	realPlayerDeterminism: number;
	repeatSeason:
		| undefined
		| {
				startingSeason: number;
				players: Record<
					number,
					{
						tid: number;
						contract: PlayerContract;
						injury: PlayerInjury;
					}
				>;
		  };
	riggedLottery?: (number | null)[];
	rookieContractLengths: number[];
	rookiesCanRefuse: boolean;
	salaryCap: number;
	salaryCapType: "hard" | "none" | "soft";
	season: number;
	softCapTradeSalaryMatch: number;
	sonRate: number;
	startingSeason: number;
	stopOnInjury: boolean;
	stopOnInjuryGames: number;
	tiebreakers: (keyof typeof TIEBREAKERS)[];
	teamInfoCache: {
		abbrev: string;
		region: string;
		name: string;
		imgURL: string | undefined;
		imgURLSmall: string | undefined;
		disabled: boolean | undefined;
	}[];
	ties: boolean;
	tradeDeadline: number;
	tragicDeathRate: number;
	tragicDeaths?: TragicDeaths;
	userTid: number;
	userTids: number[];
	weightFactor: number;

	threePointers: boolean;
	threePointTendencyFactor: number;
	threePointAccuracyFactor: number;
	twoPointAccuracyFactor: number;
	blockFactor: number;
	stealFactor: number;
	turnoverFactor: number;
	orbFactor: number;
	pace: number;
	expansionDraft:
		| {
				phase: "setup";
				numPerTeam?: string;
				numProtectedPlayers?: string;
				teams?: ExpansionDraftSetupTeam[];
		  }
		| {
				phase: "protection";
				numPerTeam: number;
				numProtectedPlayers: number;
				expansionTids: number[];
				protectedPids: { [key: number]: number[] };
				allowSwitchTeam: boolean;
		  }
		| {
				phase: "draft";
				numPerTeam: number;
				numPerTeamDrafted: Record<number, number>;
				expansionTids: number[];
				availablePids: number[];
		  };

	passFactor: number;
	rushYdsFactor: number;
	passYdsFactor: number;
	completionFactor: number;
	scrambleFactor: number;
	sackFactor: number;
	fumbleFactor: number;
	intFactor: number;
	fgAccuracyFactor: number;
	fourthDownFactor: number;
	onsideFactor: number;
	onsideRecoveryFactor: number;
	hitFactor: number;
	giveawayFactor: number;
	takeawayFactor: number;
	deflectionFactor: number;
	saveFactor: number;
	assistFactor: number;
	foulFactor: number;
	groundFactor: number;
	lineFactor: number;
	flyFactor: number;
	powerFactor: number;
	throwOutFactor: number;
	strikeFactor: number;
	balkFactor: number;
	wildPitchFactor: number;
	passedBallFactor: number;
	hitByPitchFactor: number;
	swingFactor: number;
	contactFactor: number;
};

export type GameAttributesLeagueWithHistory = Omit<
	GameAttributesLeague,
	| "confs"
	| "divs"
	| "numGamesPlayoffSeries"
	| "numPlayoffByes"
	| "otl"
	| "playoffsNumTeamsDiv"
	| "pointsFormula"
	| "tiebreakers"
	| "ties"
	| "userTid"
> & {
	confs: GameAttributeWithHistory<GameAttributesLeague["confs"]>;
	divs: GameAttributeWithHistory<GameAttributesLeague["divs"]>;
	numGamesPlayoffSeries: GameAttributeWithHistory<
		GameAttributesLeague["numGamesPlayoffSeries"]
	>;
	numPlayoffByes: GameAttributeWithHistory<
		GameAttributesLeague["numPlayoffByes"]
	>;
	otl: GameAttributeWithHistory<GameAttributesLeague["otl"]>;
	playoffsNumTeamsDiv: GameAttributeWithHistory<
		GameAttributesLeague["playoffsNumTeamsDiv"]
	>;
	pointsFormula: GameAttributeWithHistory<
		GameAttributesLeague["pointsFormula"]
	>;
	tiebreakers: GameAttributeWithHistory<GameAttributesLeague["tiebreakers"]>;
	ties: GameAttributeWithHistory<GameAttributesLeague["ties"]>;
	userTid: GameAttributeWithHistory<GameAttributesLeague["userTid"]>;
};

export type GameAttributes =
	| GameAttributesNonLeague
	| GameAttributesLeagueWithHistory;

export type GameAttributeKey = keyof GameAttributesLeague;

export type GameAttribute<T extends GameAttributeKey> = {
	key: T;
	value: GameAttributesLeagueWithHistory[T];
};

export type GameProcessed = {
	gid: number;
	home: boolean;
	oppPts: number;
	oppTid: number;
	oppAbbrev: string;
	overtime: string;
	result: "W" | "L" | "T";
	tid?: number;
	pts: number;
};

export type GameProcessedCompleted = {
	gid: number;
	overtime: string;
	result: "W" | "L" | "T";
	score: string;
	teams: [any, any];
};

export type League = {
	lid: number;
	name: string;
	tid: number;
	phaseText: string;
	teamName: string;
	teamRegion: string;
	heartbeatID?: string;
	heartbeatTimestamp?: number;
	difficulty?: number;
	starred?: boolean;
	created?: Date;
	lastPlayed?: Date;
	startingSeason?: number;
	season?: number;
	imgURL?: string; // Should contain imgURLSmall if it exists
};

export type Locks = {
	drafting: boolean;
	gameSim: boolean;
	newPhase: boolean;
	stopGameSim: boolean;
};

export type LockName = "drafting" | "newPhase" | "gameSim" | "stopGameSim";

export type LogEventType =
	| "achievement"
	| "ageFraud"
	| "award"
	| "changes"
	| "draft"
	| "draftLottery"
	| "error"
	| "freeAgent"
	| "gameAttribute"
	| "gameLost"
	| "gameTied"
	| "gameWon"
	| "hallOfFame"
	| "healed"
	| "healedList"
	| "info"
	| "injured"
	| "injuredList"
	| "madePlayoffs"
	| "newLeague"
	| "newTeam"
	| "playerFeat"
	| "playoffs"
	| "reSigned"
	| "refuseToSign"
	| "release"
	| "retired"
	| "retiredList"
	| "retiredJersey"
	| "screenshot"
	| "sisyphus"
	| "sisyphusTeam"
	| "success"
	| "teamContraction"
	| "teamExpansion"
	| "teamLogo"
	| "teamRelocation"
	| "teamRename"
	| "trade"
	| "tragedy"
	| "upgrade"
	| "luxuryTax"
	| "luxuryTaxDist"
	| "minPayroll";

// https://stackoverflow.com/a/57103940/786644
export type DistributiveOmit<T, K extends keyof T> = T extends any
	? Omit<T, K>
	: never;
export type LogEventSaveOptions = DistributiveOmit<
	EventBBGMWithoutKey,
	"season"
>;

export type LogEventShowOptions = {
	extraClass?: string;
	hideInLiveGame?: boolean;
	htmlIsSafe?: boolean;
	onClose?: () => void;
	persistent: boolean;
	text: string;
	type: string;
};

export type OwnerMood = {
	money: number;
	playoffs: number;
	wins: number;
};

export type MessageWithoutKey = {
	mid?: number;
	from: string;
	read: boolean;
	text: string;
	year: number;
	subject?: string;
	ownerMoods?: OwnerMood[];
};

export type Message = {
	mid: number;
} & MessageWithoutKey;

export type MenuItemLink = {
	type: "link";
	active?: (pageID?: string, pathname?: string) => boolean;
	league?: true;
	godMode?: true;
	nonLeague?: true;
	commandPalette?: true;
	commandPaletteOnly?: true;
	onClick?: (
		a: MouseEvent<any>,
	) => undefined | void | false | Promise<undefined | void | false>; // Return false to leave sidebar open
	path?: string | (number | string)[];
	text:
		| Exclude<ReactNode, null | undefined | number | boolean>
		| {
				side: Exclude<ReactNode, null | undefined | number | boolean>;
				top: Exclude<ReactNode, null | undefined | number | boolean>;
		  };
};

export type MenuItemHeader = {
	type: "header";
	long: string;
	short: string;
	league?: true;
	nonLeague?: true;
	commandPalette?: true;
	commandPaletteOnly?: true;
	children: (MenuItemLink | MenuItemText)[];
};

export type MenuItemText = {
	type: "text";
	text: string;
};

export type MoodComponents = {
	marketSize: number;
	facilities: number;
	teamPerformance: number;
	hype: number;
	loyalty: number;
	trades: number;
	playingTime: number;
	rookieContract: number;
};

export type MoodTrait = "F" | "L" | "$" | "W";

export type Negotiation = {
	pid: number;
	tid: number;
	resigning: boolean;
};

export type Option = {
	id: string;
	label: string;
	url?: string;
	key?: string;
	code?: string;
};

export type Options = {
	fullNames?: boolean;
	phaseChangeRedirects: Phase[];
	units?: "metric" | "us";
};

export type LocalStateUI = {
	challengeNoRatings: boolean;
	customMenu?: MenuItemHeader;
	dirtySettings: boolean;
	flagOverrides: Record<string, string | undefined>;
	gameSimInProgress: boolean;
	games: {
		forceWin?: number; // Number of iterations - defined means result was forced
		gid: number;
		numPeriods?: number;
		overtimes?: number;
		teams: [
			{
				ovr?: number;
				pts?: number;
				tid: number;
				playoffs?: {
					seed: number;
					won: number;
					lost: number;
				};
			},
			{
				ovr?: number;
				pts?: number;
				tid: number;
				playoffs?: {
					seed: number;
					won: number;
					lost: number;
				};
			},
		];
	}[];
	gender: GameAttributesLeague["gender"];
	fantasyPoints: GameAttributesLeague["fantasyPoints"];
	fullNames: boolean;
	gold?: boolean;
	godMode: boolean;
	hasViewedALeague: boolean;
	hideDisabledTeams: boolean;
	homeCourtAdvantage: number;
	leagueCreation?: {
		id: number;
		status: string;
	};
	leagueCreationPercent?: {
		id: number;
		percent: number;
	};
	lid?: number;
	liveGameInProgress: boolean;
	numPeriods: number;
	numWatchColors: number;
	phase: number;
	phaseText: string;
	playMenuOptions: Option[];
	popup: boolean;
	quarterLength: number;
	season: number;
	showNagModal: boolean;
	sidebarOpen: boolean;
	spectator: boolean;
	startingSeason: number;
	statusText: string;
	teamInfoCache: {
		abbrev: string;
		region: string;
		name: string;
		imgURL?: string;
		imgURLSmall?: string;
		disabled?: boolean;
	}[];
	units: "metric" | "us";
	userTid: number;
	userTids: number[];
	username?: string;
	title?: string;
	hideNewWindow: boolean;
	jumpTo: boolean;
	jumpToSeason?: number | "all" | "career";
	dropdownCustomOptions?: Record<string, DropdownOption[]>;
	dropdownCustomURL?: (fields: Record<string, number | string>) => string;
	dropdownView?: string;
	dropdownFields?: {
		[key: string]: number | string;
	};
	moreInfoAbbrev?: string;
	moreInfoSeason?: number;
	moreInfoTid?: number;
	stickyFooterAd: boolean;
	stickyFormButtons: boolean;
};

export type PartialTopMenu = {
	email: string;
	goldCancelled: boolean;
	goldUntil: number;
	mailingList: boolean;
	username: string;
};

export type Phase = -2 | -1 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type PhaseReturn = {
	redirect?: {
		url: string;
		text: string;
	};
	updateEvents?: UpdateEvents;
};

export type PlayerContract = {
	amount: number;
	exp: number;
	rookie?: true; // If present, this is a rookie contract. Could be either a rookie scale auto sign, or negotiated.
	rookieResign?: true; // Should only be present during re-signing phase for guys re-signing after rookie contracts, otherwise can't identify if previous contract was a rookie contract cause it's overwritten!
};

export type PlayerFeatWithoutKey = {
	fid?: number;
	pid: number;
	name: string;
	pos: string;
	season: number;
	tid: number;
	oppTid: number;
	playoffs: boolean;
	gid: number;
	stats: any;
	won: boolean;
	score: string;
	overtimes: number;
	numPeriods: number;
};

export type PlayerFeat = PlayerFeatWithoutKey & {
	fid: number;
};

export type PlayerFiltered = any;

export type PlayerInjury = {
	gamesRemaining: number;
	type: string;
	score?: number;
};

type PlayerSalary = {
	amount: number;
	season: number;
};

// jerseyNumber: string | undefined;
// *Max: [number, number] | null | undefined; - null is for new value, not yet initialized. undefined is for upgraded rows from before this existed
export type PlayerStats = any;

export type RelativeType = "brother" | "father" | "son";

export type Relative = {
	type: RelativeType;
	pid: number;
	name: string;
};

export type MinimalPlayerRatings = {
	ovr: number;
	pot: number;
	fuzz: number;
	pos: string;
	skills: string[];
	season: number;
	ovrs?: any;
	pots?: any;
	injuryIndex?: number;
	hgt: number;
	spd: number;
	endu: number;
	locked?: boolean;
};

export type PlayerWithoutKey<PlayerRatings = any> = {
	awards: {
		season: number;
		type: string;
	}[];
	born: {
		year: number;
		loc: string;
	};
	college: string;
	contract: PlayerContract & {
		temp?: true; // Used only on import
	};
	diedYear?: number;
	draft: {
		round: number;
		pick: number;
		tid: number;
		originalTid: number;
		year: number;
		pot: number;
		ovr: number;
		skills: string[];
		dpid?: number;
	};
	face: Face;
	firstName: string;
	gamesUntilTradable: number;
	hgt: number;
	hof?: 1; // Would rather be boolean, but can't index boolean
	imgURL: string;
	injury: PlayerInjury;
	injuries: {
		season: number;
		games: number;
		type: string;
		ovrDrop?: number;
		potDrop?: number;
	}[];
	jerseyNumber?: string;
	lastName: string;
	moodTraits: MoodTrait[];
	note?: string;
	noteBool?: 1; // Keep in sync with note - for indexing
	numDaysFreeAgent: number;
	pid?: number;
	pos?: string; // Only in players from custom league files
	ptModifier: number;
	ratings: PlayerRatings[];
	real?: boolean;
	relatives: Relative[];
	retiredYear: number;
	rosterOrder: number;
	salaries: PlayerSalary[];
	srID?: string;
	stats: PlayerStats[];
	statsTids: number[];
	tid: number;
	transactions?: (
		| {
				season: number;
				phase: number;
				tid: number;
				type: "draft";
				pickNum: number;
		  }
		| {
				season: number;
				phase: number;
				tid: number;
				type: "freeAgent";
		  }
		| {
				season: number;
				phase: number;
				tid: number;
				type: "trade";
				fromTid: number;
				eid?: number;
		  }
		| {
				season: number;
				phase: number;
				tid: number;
				type: "godMode";
		  }
		| {
				season: number;
				phase: number;
				tid: number;
				type: "import";
		  }
		| {
				season: number;
				phase: number;
				tid: number;
				type: "sisyphus";
				fromTid: number;
		  }
	)[]; // Only optional cause I'm worried about upgrades
	value: number;
	valueNoPot: number;
	valueFuzz: number;
	valueNoPotFuzz: number;
	watch?: number;
	weight: number;
	yearsFreeAgent: number;

	// Only for hockey goalies
	numConsecutiveGamesG?: number;

	// Only for baseball pitchers
	pFatigue?: number;
};

export type Player<PlayerRatings = any> = {
	pid: number;
} & PlayerWithoutKey<PlayerRatings>;

export type PlayerStatType = "per36" | "perGame" | "totals";

export type PlayersPlusOptions = {
	season?: number;
	tid?: number;
	attrs?: string[];
	ratings?: string[];
	stats?: string[];
	playoffs?: boolean;
	regularSeason?: boolean;
	showNoStats?: boolean;
	showRookies?: boolean;
	showDraftProspectRookieRatings?: boolean;
	showRetired?: boolean;
	fuzz?: boolean;
	oldStats?: boolean;
	numGamesRemaining?: number;
	statType?: PlayerStatType;
	mergeStats?: "none" | "totOnly" | "totAndTeams";
};

export type Race = "asian" | "black" | "brown" | "white";

export type PlayerBioInfo = {
	// This either overwrites a built-in country, or adds a new country
	countries?: Record<
		string,
		{
			// If any of these properties is undefined, fall back to default, then whatever the built-in value is (if it exists)
			first?: Record<string, number>;
			last?: Record<string, number>;
			colleges?: Record<string, number>;
			fractionSkipCollege?: number;
			races?: Record<Race, number>;
			flag?: string;
		}
	>;

	default?: {
		// Applies to all built-in countries, since there is just one global country list to override
		colleges?: Record<string, number>;

		// Applies to all built-in countries except US and Canada, where it's overridden to 0.02 by default
		fractionSkipCollege?: number;

		// Applies to no built-in countries, since they all have built-in defaults
		races?: Record<Race, number>;
	};

	// This specifies which countries (from the built-in database, and supplemented by "data" above)
	frequencies?: Record<string, number>;
};

export type PlayerBioInfoProcessed = {
	countries: Record<
		string,
		{
			first: [string, number][];
			last: [string, number][];
			colleges?: [string, number][];
			fractionSkipCollege?: number;
			races?: [Race, number][];
		}
	>;

	default: {
		colleges: [string, number][];
		fractionSkipCollege: number;
		races: [Race, number][];
	};

	// This specifies which countries (from the built-in database, and supplemented by "data" above)
	frequencies: [string, number][];
};

export type Local = {
	autoPlayUntil?: {
		season: number;
		phase: number;

		// Time in milliseconds of the start of auto play
		start: number;
	};
	autoSave: boolean;
	exhibitionGamePlayers?: Record<number, Player>;
	fantasyDraftResults: (Player<any> & {
		prevAbbrev: string;
		prevTid: number;
	})[];
	goldUntil: number;
	leagueLoaded: boolean;
	mailingList: boolean;
	minFractionDiffs:
		| Record<
				number,
				| {
						tid: number;
						diff: number;
				  }
				| undefined
		  >
		| undefined;
	phaseText: string;
	playerBioInfo?: PlayerBioInfoProcessed;
	playerOvrMean: number;
	playerOvrStd: number;
	playerOvrMeanStdStale: boolean;
	seasonLeaders: SeasonLeaders | undefined;
	playingUntilEndOfRound: boolean;
	statusText: string;
	unviewedSeasonSummary: boolean;
	username: string | undefined;
};

export type PlayoffSeriesTeam = {
	abbrev?: string;
	cid: number;
	imgURL?: string;
	imgURLSmall?: string;
	pendingPlayIn?: true;
	pts?: number; // undefined means game hasn't happened yet
	region?: string;
	regularSeason?: {
		won: number;
		lost: number;
		tied?: number;
		otl?: number;
	};
	seed: number;
	tid: number;
	won: number;
};

type PlayInMatchup = {
	home: PlayoffSeriesTeam;
	away: PlayoffSeriesTeam;
	gids?: number[];
};

// Each entry is the 2 first round games (7/8 and 9/10) and the 1 game between the loser of the 7/8 game and the winner of the 9/10 game
export type PlayInTournament =
	| [PlayInMatchup, PlayInMatchup]
	| [PlayInMatchup, PlayInMatchup, PlayInMatchup];

export type PlayoffSeries = {
	byConf?: boolean; // undefined is for upgraded leagues and real players leagues
	currentRound: number;
	season: number;
	series: {
		home: PlayoffSeriesTeam;
		away?: PlayoffSeriesTeam;
		gids?: number[];
	}[][];

	// undefined means no play-in tournament
	playIns?: PlayInTournament[];
};

export type ContractInfo = {
	pid: number;
	firstName: string;
	lastName: string;
	skills: string[];
	pos: string;
	injury: PlayerInjury;
	jerseyNumber: string | undefined;
	amount: number;
	exp: number;
	released: boolean;
	watch: number;
};

export type ReleasedPlayerWithoutKey = {
	rid?: number;
	pid: number;
	tid: number;
	contract: {
		amount: number;
		exp: number;
	};
};

export type ReleasedPlayer = ReleasedPlayerWithoutKey & {
	rid: number;
};

export type ScheduleGameWithoutKey = {
	gid?: number;
	awayTid: number;
	homeTid: number;
	forceWin?: number | "tie"; // either awayTid or homeTid, if defined

	// Just used to enable multiple live sims per day. Besides that, not used for anything, not persisted anywhere, and in the playoffs the values are kind of weird.
	day: number;
};

export type ScheduleGame = ScheduleGameWithoutKey & {
	gid: number;
};

export type SortOrder = "asc" | "desc";

export type SortType =
	| "currency"
	| "draftPick"
	| "lastTen"
	| "name"
	| "number"
	| "record"
	| "string";

export type Team = {
	tid: number;
	cid: number;
	did: number;
	region: string;
	name: string;
	abbrev: string;
	imgURL?: string;
	imgURLSmall?: string;
	colors: [string, string, string];
	jersey?: string;
	budget: Record<
		// ticketPrice is in dollars, others are levels
		"ticketPrice" | "scouting" | "coaching" | "health" | "facilities",
		number
	>;
	// initialBudget is for when starting a new league, it can use initialBudget as values for the past 2 seasons when no data exists
	initialBudget: Record<
		"scouting" | "coaching" | "health" | "facilities",
		number
	>;
	strategy: "contending" | "rebuilding";
	depth?:
		| {
				QB: number[];
				RB: number[];
				WR: number[];
				TE: number[];
				OL: number[];
				DL: number[];
				LB: number[];
				CB: number[];
				S: number[];
				K: number[];
				P: number[];
				KR: number[];
				PR: number[];
		  }
		| {
				F: number[];
				D: number[];
				G: number[];
		  }
		| {
				L: number[]; // Lineup
				LP: number[]; // Lineup (no DH)
				D: number[]; // Defense
				DP: number[]; // Defense (no DH)
				P: number[]; // Pitching
		  };
	firstSeasonAfterExpansion?: number;
	srID?: string;

	// Optional because upgrade code was not written on 2020-05-04. Ideally should have populated these with the most recent value of teamSeason.
	pop?: number;
	stadiumCapacity?: number;

	adjustForInflation: boolean;
	disabled: boolean;
	keepRosterSorted: boolean;

	// [regular season, playoffs]
	playThroughInjuries: [number, number];

	// Optional because no upgrade
	autoTicketPrice?: boolean;

	// Optional because no upgrade. Otherwise, would make this empty array by default
	retiredJerseyNumbers?: {
		number: string;
		seasonRetired: number;
		seasonTeamInfo: number;
		pid?: number;
		score?: number;
		text: string;
	}[];
};

export type TeamAttr = keyof Team;

type TeamSeasonPlus = TeamSeason & {
	winp: number;
	revenue: number;
	profit: number;
	salaryPaid: number;
	payroll: number;
	lastTen: string;
	streak: string;
	pts: number;
	ptsDefault: number;
	ptsMax: number;
	ptsPct: number;
	avgAge: number | undefined;
};
export type TeamSeasonAttr = keyof TeamSeasonPlus;

import type {
	TeamStatAttr as TeamStatAttrBaseball,
	TeamStatAttrByPos as TeamStatAttrByPosBaseball,
} from "./types.baseball";
import type { TeamStatAttr as TeamStatAttrBasketball } from "./types.basketball";
import type { TeamStatAttr as TeamStatAttrFootball } from "./types.football";
import type { TeamStatAttr as TeamStatAttrHockey } from "./types.hockey";
import type { TIEBREAKERS } from "./constants";
import type { DropdownOption } from "../ui/hooks/useDropdownOptions";
type TeamStatsPlus = Record<TeamStatAttrBaseball, number> &
	Record<TeamStatAttrByPosBaseball, number[]> &
	Record<TeamStatAttrBasketball, number> &
	Record<TeamStatAttrFootball, number> &
	Record<TeamStatAttrHockey, number> & {
		season: number;
		playoffs: boolean;
	};
export type TeamStatAttr = keyof TeamStatsPlus;

export type TeamFiltered<
	Attrs extends Readonly<TeamAttr[]> | undefined = undefined,
	SeasonAttrs extends Readonly<TeamSeasonAttr[]> | undefined = undefined,
	StatAttrs extends Readonly<TeamStatAttr[]> | undefined = undefined,
	Season extends number | undefined = undefined,
> = (Attrs extends Readonly<TeamAttr[]>
	? Pick<Team, Attrs[number]>
	: Record<string, unknown>) &
	(SeasonAttrs extends Readonly<TeamSeasonAttr[]>
		? {
				seasonAttrs: Season extends number
					? Pick<TeamSeasonPlus, SeasonAttrs[number]>
					: Pick<TeamSeasonPlus, SeasonAttrs[number]>[];
		  }
		: Record<string, unknown>) &
	(StatAttrs extends Readonly<TeamStatAttr[]>
		? {
				stats: Season extends number
					? Pick<TeamStatsPlus, StatAttrs[number]> & { playoffs: boolean }
					: (Pick<TeamStatsPlus, StatAttrs[number]> & { playoffs: boolean })[];
		  }
		: Record<string, unknown>);

export type TeamBasic = {
	tid: number;
	cid: number;
	did: number;
	region: string;
	name: string;
	abbrev: string;
	pop: number;
	imgURL?: string;
	imgURLSmall?: string;
	colors: [string, string, string];
	jersey?: string;
};

export type TeamStatType = "perGame" | "totals";

export type TeamSeasonWithoutKey = {
	rid?: number;
	tid: number;
	season: number;
	gpHome: number; // Includes playoff games! Used for attendance average
	att: number;
	cash: number;
	won: number;
	lost: number;
	tied: number;
	otl: number;
	wonHome: number;
	lostHome: number;
	tiedHome: number;
	otlHome: number;
	wonAway: number;
	lostAway: number;
	tiedAway: number;
	otlAway: number;
	wonDiv: number;
	lostDiv: number;
	tiedDiv: number;
	otlDiv: number;
	wonConf: number;
	lostConf: number;
	tiedConf: number;
	otlConf: number;
	lastTen: (-1 | 0 | 1 | "OTL")[];
	streak: number;
	playoffRoundsWon: number;
	// -1: didn't make playoffs. 0: lost in first round. ... N: won championship
	hype: number;
	pop: number;
	stadiumCapacity: number;
	revenues: {
		luxuryTaxShare: number;
		merch: number;
		sponsor: number;
		ticket: number;
		nationalTv: number;
		localTv: number;
	};
	expenses: {
		luxuryTax: number;
		minTax: number;
		salary: number;
		coaching: number;
		health: number;
		facilities: number;
		scouting: number;
	};
	// These are cumsums per game, divide by gp for the average
	expenseLevels: {
		coaching: number;
		facilities: number;
		health: number;
		scouting: number;
	};
	payrollEndOfSeason: number;
	ownerMood?: OwnerMood;
	numPlayersTradedAway: number;

	// w - clinched play-in tournament
	// x - clinched playoffs
	// y - if byes exist - clinched bye
	// z - clinched #1 seed advantage
	// o - eliminated
	clinchedPlayoffs?: "w" | "x" | "y" | "z" | "o";

	// Value only written here after the end of the season
	avgAge?: number;

	// Start of first game, and end of regular season
	ovrStart?: number;
	ovrEnd?: number;

	// Copied over from Team
	cid: number;
	did: number;
	region: string;
	name: string;
	abbrev: string;
	imgURL?: string;
	imgURLSmall?: string;
	colors: [string, string, string];
	jersey?: string;

	// Only used in historical leagues when realStats="all"
	srID?: string;
};

export type TeamSeason = TeamSeasonWithoutKey & {
	rid: number;
};

// opp stats (except Blk) can be undefined
export type TeamStatsWithoutKey = any;

export type TeamStats = TeamStatsWithoutKey & {
	rid: number;
};

export type TradePickValues = {
	[key: string]: number[] | undefined;
	default: number[];
};
type TradeSummaryTeam = {
	name: string;
	ovrAfter: number;
	ovrBefore: number;
	payrollAfterTrade: number;
	payrollBeforeTrade: number;
	picks: {
		dpid: number;
		desc: string;
	}[];
	total: number;
	trade: PlayerFiltered[];
};

export type TradeSummary = {
	teams: [TradeSummaryTeam, TradeSummaryTeam];
	warning: null | string;
	warningAmount?: number;
};

export type TradeTeam = {
	dpids: number[];
	dpidsExcluded: number[];
	pids: number[];
	pidsExcluded: number[];
	tid: number;
	warning?: string | null;
	warningAmount?: number;
};

export type TradeTeams = [TradeTeam, TradeTeam];

export type Trade = {
	rid: 0;
	teams: TradeTeams;
};

export type UpdateEvents = (
	| "account"
	| "allStarDunk"
	| "allStarThree"
	| "firstRun"
	| "g.goatFormula"
	| "g.goatSeasonFormula"
	| "gameAttributes"
	| "gameSim"
	| "leagues"
	| "newPhase"
	| "options"
	| "playerMovement"
	| "playoffs"
	| "scheduledEvents"
	| "retiredJerseys"
	| "team"
	| "teamFinances"
	| "watchList"
)[];

export type RealPlayerPhotos = Record<string, string>;

export type IndividualRealTeamInfo = {
	abbrev?: string;
	region?: string;
	name?: string;
	pop?: number;
	colors?: [string, string, string];
	imgURL?: string;
	imgURLSmall?: string;
	jersey?: string;
};
export type RealTeamInfo = Record<
	string,
	IndividualRealTeamInfo & {
		seasons?: Record<number, IndividualRealTeamInfo>;
	}
>;

export type GetLeagueOptionsReal = {
	type: "real";
	season: number;
	phase: number;
	randomDebuts: boolean;
	randomDebutsKeepCurrent: boolean;
	realDraftRatings: "draft" | "rookie";
	realStats: "none" | "lastSeason" | "allActive" | "allActiveHOF" | "all";

	// For exhibition game only
	includeSeasonInfo?: boolean;
	pidOffset?: number;
};

export type GetLeagueOptions =
	| GetLeagueOptionsReal
	| {
			type: "legends";
			decade:
				| "1950s"
				| "1960s"
				| "1970s"
				| "1980s"
				| "1990s"
				| "2000s"
				| "2010s"
				| "all";
	  };

// Would probably be better to have this all at the root, and store one object per (season, t0, t1) but it's awkward to separate t0 and t1 and IndexedDB does not let you make a compound index that includes a multiEntry index, so maybe this is better?
export type HeadToHead = {
	season: number;

	// The keys are team IDs. First should be the lowest of the pair
	regularSeason: Record<
		number,
		Record<
			number,
			{
				won: number;
				lost: number;
				tied: number;
				otl: number;
				pts: number;
				oppPts: number;

				// Needed because we're only storing one record per (tid, tid) pair, and we swap the results when returning the other
				otw: number;
			}
		>
	>;

	playoffs: Record<
		number,
		Record<
			number,
			// This assumes you can only play one playoff series against a given team in a season
			{
				round: number;
				result: "won" | "lost" | undefined;
				won: number;
				lost: number;
				pts: number;
				oppPts: number;
			}
		>
	>;
};

export type GetCopyType = "noCopyCache";

export type SeasonLeaders = {
	season: number;
	age: number;
	regularSeason: Record<string, unknown>;
	playoffs: Record<string, unknown>;
	ratings: Record<string, unknown>;
	ratingsFuzz: Record<string, unknown>;
};
