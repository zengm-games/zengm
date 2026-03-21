export type FeedEventType =
	| "GAME_END"
	| "HALFTIME"
	| "TRADE_ALERT"
	| "DRAFT_PICK"
	| "INJURY"
	| "PLAYER_SIGNING"
	| "SEASON_AWARD"
	| "PLAYOFF_CLINCH";

export type StatLeader = {
	playerName: string;
	teamName: string;
	statLabel: string;
	value: number;
};

export type TeamSummary = {
	tid: number;
	name: string;
	abbrev: string;
	wins: number;
	losses: number;
	standing: number;
};

export type PlayerSummary = {
	pid: number;
	name: string;
	tid: number;
	teamName: string;
	position: string;
	seasonAverages: {
		pts: number;
		reb: number;
		ast: number;
	};
};

export type GameResult = {
	gid: number;
	homeName: string;
	awayName: string;
	homeScore: number;
	awayScore: number;
	date: string;
};

export type StandingEntry = {
	tid: number;
	name: string;
	abbrev: string;
	wins: number;
	losses: number;
	pct: number;
	conf: string;
};

export type TransactionSummary = {
	type: "trade" | "signing" | "release" | "injury";
	description: string;
	timestamp: number;
};

export type SocialContext = {
	liveGame?: {
		score: [number, number];
		quarter: number;
		statLeaders: StatLeader[];
	};
	teams: TeamSummary[];
	players: PlayerSummary[];
	recentGames: GameResult[];
	standings: StandingEntry[];
	transactions: TransactionSummary[];
};

export type FeedEvent = {
	type: FeedEventType;
	timestamp: number;
	context: SocialContext;
};

export type Account = {
	agentId: string;
	handle: string;
	displayName: string;
	type: "journalist" | "player" | "org" | "fan";
	pid: number | null;
	tid: number | null;
	templateId: string;
	status: "active" | "dormant";
	avatarUrl: string | null;
	createdAt: number;
};

export type AgentConfig = {
	id: string;
	handle: string;
	type: "journalist" | "player" | "org" | "fan";
	persona: string;
	triggers: FeedEventType[];
	replyEligible: boolean;
	postProbability: number;
};

export type GeneratedPost = {
	postId: string;
	agentId: string;
	handle: string;
	body: string;
	eventType: FeedEventType;
	threadId: string | null;
	parentId: string | null;
	imageUrl: string | null;
	createdAt: number;
	likes: number;
	reposts: number;
};

export type ThreadRecord = {
	threadId: string;
	rootPostId: string;
	openedAt: number;
	expiresAt: number;
	participantAgents: string[];
};
