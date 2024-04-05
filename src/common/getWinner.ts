type Team = {
	pts?: number;
};

// 0 means home (0th) team won, 1 means away (1th) team won, -1 means tie, undefined means game is not over yet
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

	return -1;
};

export default getWinner;
