// The All-Star Game and the trade deadline are stored in the schedule as games between these placeholder tids, as [homeTid, awayTid]
export const ALL_STAR_GAME_TIDS = [-1, -2] as const;
export const TRADE_DEADLINE_TIDS = [-3, -3] as const;

export const isAllStarGame = (homeTid: number, awayTid: number) =>
	homeTid === ALL_STAR_GAME_TIDS[0] && awayTid === ALL_STAR_GAME_TIDS[1];

export const isTradeDeadline = (homeTid: number, awayTid: number) =>
	homeTid === TRADE_DEADLINE_TIDS[0] && awayTid === TRADE_DEADLINE_TIDS[1];

// tid of either All-Star team
export const isAllStarTid = (tid: number) =>
	tid === ALL_STAR_GAME_TIDS[0] || tid === ALL_STAR_GAME_TIDS[1];
