import type { Face } from "facesjs";
import type { MouseEvent } from "react";
import type { Context } from "../ui/router";
import type processInputs from "../worker/api/processInputs";
import type views from "../worker/views";
import type { Bugsnag } from "@bugsnag/browser";

export type Env = {
	enableLogging: boolean;
	heartbeatID: string;
	useSharedWorker: boolean;
};

declare global {
	interface Window {
		TriggerPrompt: (a: string, b: string | number | undefined) => void;
		bbgm: any; // Just for debugging
		bbgmVersion: string;
		bbgmVersionUI: string;
		bbgmVersionWorker: string;
		bugsnagClient?: Bugsnag.Client;
		enableLogging: boolean;
		freestar: any;
		getTheme: () => string;
		googleAnalyticsID: string;
		heartbeatID: string;
		leagueFileHashes: Record<string, string>;
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
			SPORT: "basketball" | "football";
		}
	}
}

export type ThenArg<T> = T extends PromiseLike<infer U> ? U : T;

type ViewsKeys = keyof typeof views;

export type View<Name extends ViewsKeys> = Exclude<
	ThenArg<
		Name extends ViewsKeys
			? ReturnType<typeof views[Name]>
			: Record<string, unknown>
	>,
	void | { redirectUrl: string } | { errorMessage: string }
>;

export type ViewInput<T extends keyof typeof processInputs> = Exclude<
	ReturnType<typeof processInputs[T]>,
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

export type AllStars = {
	season: number;
	teamNames: [string, string];
	teams: [AllStarPlayer[], AllStarPlayer[]];
	remaining: AllStarPlayer[];
	finalized: boolean;

	// After game is complete
	gid?: number;
	score?: [number, number];
	overtimes?: number;
	mvp?: {
		pid: number;
		tid: number;
		name: string;
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
}[];

export type DraftLotteryResult = {
	season: number;
	draftType?:
		| Exclude<
				DraftType,
				"random" | "noLottery" | "freeAgents" | "noLotteryReverse"
		  >
		| "dummy";
	result: DraftLotteryResultArray;
};

export type DraftPickWithoutKey = {
	dpid?: number;
	tid: number;
	originalTid: number;
	round: number;
	pick: number;
	// 0 if not set
	season: number | "fantasy" | "expansion";
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
	| "freeAgents";

// Key is team ID receiving this asset. from is team ID that traded this asset away
// Why store name and full DraftPick info? For performance a bit, but mostly in case old players are deleted in a league, the trade event will still show something reasonable
type TradeEventAsset =
	| {
			pid: number;
			tid: number; // tid the player was originally on
			name: string;
			contract: PlayerContract;
			ratingsIndex: number;
			statsIndex: number;
	  }
	| DraftPick;

export type TradeEventTeams = {
	assets: TradeEventAsset[];
}[];

export type DiscriminateUnion<
	T,
	K extends keyof T,
	V extends T[K]
> = T extends Record<K, V> ? T : never;

export type EventBBGMWithoutKey =
	| {
			type: Exclude<LogEventType, "trade">;
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
	gid: number;
	forceWin?: number; // If defined, it's the number of iterations that were used to force the win
	lost: {
		tid: number;
		pts: number;
	};
	numGamesToWinSeries?: number;
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
		cid?: number;
		did?: number;
		abbrev?: string;
		imgURL?: string;
		colors?: [string, string, string];
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
	colors: [string, string, string];
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

export type GameAttributesLeague = {
	aiJerseyRetirement: boolean;
	keepRosterSorted: boolean;
	aiTradesFactor: number;
	allStarGame: boolean;
	autoDeleteOldBoxScores: boolean;
	brotherRate: number;
	budget: boolean;
	challengeNoDraftPicks: boolean;
	challengeNoFreeAgents: boolean;
	challengeNoRatings: boolean;
	challengeNoTrades: boolean;
	challengeLoseBestPlayer: boolean;
	challengeFiredLuxuryTax: boolean;
	challengeFiredMissPlayoffs: boolean;
	confs: { cid: number; name: string }[];
	daysLeft: number;
	defaultStadiumCapacity: number;
	difficulty: number;
	divs: { cid: number; did: number; name: string }[];
	draftType: DraftType;
	easyDifficultyInPast: boolean;
	elam: boolean;
	elamASG: boolean;
	elamMinutes: number;
	elamPoints: number;
	equalizeRegions: boolean;
	foulsNeededToFoulOut: number;
	foulRateFactor: number;
	gameOver: boolean;
	godMode: boolean;
	godModeInPast: boolean;
	gracePeriodEnd: number;
	hardCap: boolean;
	homeCourtAdvantage: number;
	injuryRate: number;
	leagueName: string;
	lid: number;
	luxuryPayroll: number;
	luxuryTax: number;
	maxContract: number;
	maxContractLength: number;
	maxRosterSize: number;
	minContract: number;
	minContractLength: number;
	minPayroll: number;
	minRosterSize: number;
	names?: NamesLegacy;
	nextPhase?: Phase;
	numActiveTeams: number;
	numDraftRounds: number;
	numGames: number;
	numGamesPlayoffSeries: number[];
	numPlayersOnCourt: number;
	numPlayoffByes: number;
	numSeasonsFutureDraftPicks: number;
	numTeams: number;
	playerMoodTraits: boolean;
	spectator: boolean;
	otherTeamsWantToHire: boolean;
	phase: Phase;
	playerBioInfo?: PlayerBioInfo;
	playersRefuseToNegotiate: boolean;
	quarterLength: number;
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
	rookieContractLengths: number[];
	rookiesCanRefuse: boolean;
	salaryCap: number;
	season: number;
	sonRate: number;
	startingSeason: number;
	stopOnInjury: boolean;
	stopOnInjuryGames: number;
	teamInfoCache: {
		abbrev: string;
		region: string;
		name: string;
		imgURL?: string;
		disabled?: boolean;
	}[];
	ties: boolean;
	tradeDeadline: number;
	tragicDeathRate: number;
	userTid: number;
	userTids: number[];

	threePointers: boolean;
	threePointTendencyFactor: number;
	threePointAccuracyFactor: number;
	twoPointAccuracyFactor: number;
	pace: number;
	expansionDraft:
		| {
				phase: "setup";
				numProtectedPlayers?: string;
				teams?: ExpansionDraftSetupTeam[];
		  }
		| {
				phase: "protection";
				numProtectedPlayers: number;
				expansionTids: number[];
				protectedPids: { [key: number]: number[] };
				allowSwitchTeam: boolean;
		  }
		| {
				phase: "draft";
				expansionTids: number[];
				availablePids: number[];
		  };
};

export type GameAttributesLeagueWithHistory = Omit<
	GameAttributesLeague,
	| "confs"
	| "divs"
	| "numGamesPlayoffSeries"
	| "numPlayoffByes"
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
	ties: GameAttributeWithHistory<GameAttributesLeague["ties"]>;
	userTid: GameAttributeWithHistory<GameAttributesLeague["userTid"]>;
};

export type GameAttributes =
	| GameAttributesNonLeague
	| GameAttributesLeagueWithHistory;

export type GameAttributeKey = keyof GameAttributesLeague;

export type GameAttribute = {
	key: GameAttributeKey;
	value: any;
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
	lid?: number;
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
	| "success"
	| "teamContraction"
	| "teamExpansion"
	| "teamLogo"
	| "teamRelocation"
	| "teamRename"
	| "trade"
	| "tragedy"
	| "upgrade";

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
	active?: (a?: string) => boolean;
	league?: true;
	godMode?: true;
	nonLeague?: true;
	onClick?: (a: MouseEvent<any>) => void | false | Promise<void | false>; // Return false to leave sidebar open
	path?: string | (number | string)[];
	text:
		| Exclude<React.ReactNode, null | undefined | number | boolean>
		| {
				side: Exclude<React.ReactNode, null | undefined | number | boolean>;
				top: Exclude<React.ReactNode, null | undefined | number | boolean>;
		  };
};

export type MenuItemHeader = {
	type: "header";
	long: string;
	short: string;
	league?: true;
	nonLeague?: true;
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
	units?: "metric" | "us";
};

export type LocalStateUI = {
	challengeNoRatings: boolean;
	customMenu?: MenuItemHeader;
	gameSimInProgress: boolean;
	games: {
		forceWin?: number;
		gid: number;
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
	gold?: boolean;
	godMode: boolean;
	hasViewedALeague: boolean;
	homeCourtAdvantage: number;
	leagueName: string;
	lid?: number;
	liveGameInProgress: boolean;
	spectator: boolean;
	phase: number;
	phaseText: string;
	playMenuOptions: Option[];
	popup: boolean;
	season: number;
	showNagModal: boolean;
	sidebarOpen: boolean;
	startingSeason: number;
	statusText: string;
	teamInfoCache: {
		abbrev: string;
		region: string;
		name: string;
		imgURL?: string;
		disabled?: boolean;
	}[];
	units: "metric" | "us";
	userTid: number;
	userTids: number[];
	username?: string;
	viewInfo?: {
		Component: any;
		id: string;
		inLeague: boolean;
		context: Context;
		cb: (a?: Error) => void;
	};
	title?: string;
	hideNewWindow: boolean;
	jumpTo: boolean;
	jumpToSeason?: number | "all";
	dropdownExtraParam?: number | string;
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
	url?: string;
	updateEvents?: UpdateEvents;
};

export type PlayerContract = {
	amount: number;
	exp: number;
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
	stre: number;
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
	hof: boolean;
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
	)[]; // Only optional cause I'm worried about upgrades
	value: number;
	valueNoPot: number;
	valueFuzz: number;
	valueNoPotFuzz: number;
	watch: boolean;
	weight: number;
	yearsFreeAgent: number;
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
	showRetired?: boolean;
	fuzz?: boolean;
	oldStats?: boolean;
	numGamesRemaining?: number;
	statType?: PlayerStatType;
	mergeStats?: boolean;
};

export type PlayerBioInfo = {
	// This either overwrites a built-in country, or adds a new country
	countries?: Record<
		string,
		{
			// If any of these properties is undefined, fall back to default. For first and last, if there is no default, error.
			first?: Record<string, number>;
			last?: Record<string, number>;
			colleges?: Record<string, number>;
			fractionSkipCollege?: number;
		}
	>;

	default?: {
		colleges?: Record<string, number>;
		fractionSkipCollege?: number;
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
		}
	>;

	default: {
		colleges: [string, number][];
		fractionSkipCollege: number;
	};

	// This specifies which countries (from the built-in database, and supplemented by "data" above)
	frequencies: [string, number][];
};

export type Local = {
	autoPlayUntil?: {
		season: number;
		phase: number;
	};
	autoSave: boolean;
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
	playingUntilEndOfRound: boolean;
	statusText: string;
	unviewedSeasonSummary: boolean;
};

export type PlayoffSeriesTeam = {
	abbrev?: string;
	cid: number;
	imgURL?: string;
	pts?: number;
	// undefined means game hasn't happened yet
	region?: string;
	regularSeason?: {
		won: number;
		lost: number;
		tied?: number;
	};
	seed: number;
	tid: number;
	winp: number;
	won: number;
};

export type PlayoffSeries = {
	season: number;
	currentRound: number;
	series: {
		home: PlayoffSeriesTeam;
		away?: PlayoffSeriesTeam;
		gids?: number[];
	}[][];
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
	watch: boolean;
};

export type ReleasedPlayerWithoutKey = {
	rid?: number;
	pid: number;
	tid: number;
	contract: PlayerContract;
};

export type ReleasedPlayer = ReleasedPlayerWithoutKey & {
	rid: number;
};

export type ScheduleGameWithoutKey = {
	gid?: number;
	awayTid: number;
	homeTid: number;
	forceWin?: number; // either awayTid or homeTid, if defined

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

export type BudgetItem = {
	amount: number;
	rank: number;
};

export type Team = {
	tid: number;
	cid: number;
	did: number;
	region: string;
	name: string;
	abbrev: string;
	imgURL?: string;
	colors: [string, string, string];
	budget: Record<
		"ticketPrice" | "scouting" | "coaching" | "health" | "facilities",
		BudgetItem
	>;
	strategy: "contending" | "rebuilding";
	depth?: {
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
	};
	firstSeasonAfterExpansion?: number;
	srID?: string;

	// Optional because upgrade code was not written on 2020-05-04. Ideally should have populated these with the most recent value of teamSeason.
	pop?: number;
	stadiumCapacity?: number;

	// Optional because no upgrade. Otherwise, would make this true by default
	adjustForInflation?: boolean;

	// Optional because no upgrade. Otherwise, would make this false by default
	disabled?: boolean;

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
};
export type TeamSeasonAttr = keyof TeamSeasonPlus;

import type { TeamStatAttr as TeamStatAttrBasketball } from "./types.basketball";
import type { TeamStatAttr as TeamStatAttrFootball } from "./types.football";
type TeamStatsPlus = Record<TeamStatAttrBasketball, number> &
	Record<TeamStatAttrFootball, number> & {
		season: number;
		playoffs: boolean;
	};
export type TeamStatAttr = keyof TeamStatsPlus;

export type TeamFiltered<
	Attrs extends Readonly<TeamAttr[]> | undefined = undefined,
	SeasonAttrs extends Readonly<TeamSeasonAttr[]> | undefined = undefined,
	StatAttrs extends Readonly<TeamStatAttr[]> | undefined = undefined,
	Season extends number | undefined = undefined
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
	colors: [string, string, string];
};

export type TeamStatType = "perGame" | "totals";

export type TeamSeasonWithoutKey = {
	rid?: number;
	tid: number;
	season: number;
	gp: number;
	gpHome: number;
	att: number;
	cash: number;
	won: number;
	lost: number;
	tied: number;
	wonHome: number;
	lostHome: number;
	tiedHome: number;
	wonAway: number;
	lostAway: number;
	tiedAway: number;
	wonDiv: number;
	lostDiv: number;
	tiedDiv: number;
	wonConf: number;
	lostConf: number;
	tiedConf: number;
	lastTen: (-1 | 0 | 1)[];
	streak: number;
	playoffRoundsWon: number;
	// -1: didn't make playoffs. 0: lost in first round. ... N: won championship
	hype: number;
	pop: number;
	stadiumCapacity: number;
	revenues: {
		luxuryTaxShare: BudgetItem;
		merch: BudgetItem;
		sponsor: BudgetItem;
		ticket: BudgetItem;
		nationalTv: BudgetItem;
		localTv: BudgetItem;
	};
	expenses: {
		salary: BudgetItem;
		luxuryTax: BudgetItem;
		minTax: BudgetItem;
		scouting: BudgetItem;
		coaching: BudgetItem;
		health: BudgetItem;
		facilities: BudgetItem;
	};
	payrollEndOfSeason: number;
	ownerMood?: OwnerMood;
	numPlayersTradedAway: number;

	// x - clinched playoffs
	// y - if byes exist - clinched bye
	// z - clinched home court advantage
	// o - eliminated
	clinchedPlayoffs?: "x" | "y" | "z" | "o";

	// Copied over from Team
	cid: number;
	did: number;
	region: string;
	name: string;
	abbrev: string;
	imgURL?: string;
	colors: [string, string, string];
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
};

export type TradeTeam = {
	dpids: number[];
	dpidsExcluded: number[];
	pids: number[];
	pidsExcluded: number[];
	tid: number;
	warning?: string | null;
};

export type TradeTeams = [TradeTeam, TradeTeam];

export type Trade = {
	rid: 0;
	teams: TradeTeams;
};

export type UpdateEvents = (
	| "account"
	| "firstRun"
	| "g.userTids"
	| "gameAttributes"
	| "gameSim"
	| "leagues"
	| "newPhase"
	| "options"
	| "playerMovement"
	| "scheduledEvents"
	| "retiredJerseys"
	| "teamFinances"
	| "watchList"
)[];

export type RealPlayerPhotos = Record<string, string>;

type IndividualRealTeamInfo = {
	abbrev?: string;
	region?: string;
	name?: string;
	pop?: number;
	colors?: [string, string, string];
	imgURL?: string;
};
export type RealTeamInfo = Record<
	string,
	IndividualRealTeamInfo & {
		seasons?: Record<number, IndividualRealTeamInfo>;
	}
>;

export type GetLeagueOptions =
	| {
			type: "real";
			season: number;
			phase: number;
			randomDebuts: boolean;
	  }
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
