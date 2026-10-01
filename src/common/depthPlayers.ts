type LineupInfo = {
	lineupPos: string;
	lineupIndex: number;
};

// In a baseball lineup, a pitcher/DH slot (pid -1) or a missing player (pid -2 or less)
export type DepthPlayerPlaceholder = LineupInfo & {
	pid: number;
	id: number;
};

// lineupPos and lineupIndex are set on baseball lineup players, which are the same objects as in the D/DP depth
export type DepthPlayer<T> = T & Partial<LineupInfo>;

export const isDepthPlayerPlaceholder = <T extends { pid: number }>(
	p: DepthPlayer<T> | DepthPlayerPlaceholder,
): p is DepthPlayerPlaceholder => p.pid < 0;
