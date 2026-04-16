type TeamNotPlayed = {
	pts?: undefined;
	sPts?: undefined;
};

type TeamPlayed = {
	pts: number;
	sPts?: number;
};

type Winner<T extends TeamNotPlayed | TeamPlayed> = T extends { pts: number }
	? 0 | 1 | -1
	: undefined;

// 0 means home (0th) team won, 1 means away (1th) team won, -1 means tie, undefined means game is not over yet.
const getWinner = <T extends TeamNotPlayed | TeamPlayed>(
	teams: [T, T],
): Winner<T> => {
	if (teams[0].pts === undefined || teams[1].pts === undefined) {
		return undefined as Winner<T>;
	}
	if (teams[0].pts > teams[1].pts) {
		return 0 as Winner<T>;
	}
	if (teams[1].pts > teams[0].pts) {
		return 1 as Winner<T>;
	}

	// Score is tied - check for shootout
	if (teams[0].sPts === undefined || teams[1].sPts === undefined) {
		return -1 as Winner<T>;
	}
	if (teams[0].sPts > teams[1].sPts) {
		return 0 as Winner<T>;
	}
	if (teams[1].sPts > teams[0].sPts) {
		return 1 as Winner<T>;
	}

	// Shootout tied - should never happen, but I guess if it does, it's a tie
	return -1 as Winner<T>;
};

export default getWinner;
