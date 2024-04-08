type Team = {
	pts?: number;
	sPts?: number;
};

// 0 means home (0th) team won, 1 means away (1th) team won, -1 means tie, undefined means game is not over yet.
// Would be nice if TypeScript new that undefined will only be returned if pts is undefined, but we're passing `any` to here often, and idk how to handle that too (override would work fine for distinguishing number/undefined).
// Would also be nice if TypeScript also that pts and sPts are either both undefined or neither.
const getWinner = (teams: [Team, Team]): 1 | 0 | -1 | undefined => {
	if (teams[0].pts === undefined || teams[1].pts === undefined) {
		return;
	}

	if (teams[0].pts > teams[1].pts) {
		return 0;
	}

	if (teams[1].pts > teams[0].pts) {
		return 1;
	}

	// Score is tied - check for shootout
	if (teams[0].sPts === undefined || teams[1].sPts === undefined) {
		return -1;
	}

	if (teams[0].sPts > teams[1].sPts) {
		return 0;
	}

	if (teams[1].sPts > teams[0].sPts) {
		return 1;
	}

	// Shootout tied - should never happen, but I guess if it does, it's a tie
	return -1;
};

export default getWinner;
