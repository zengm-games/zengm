type TeamRecord = {
	tid: number;
	won: number;
	lost: number;
	tied?: number;
	otl?: number;
	playoffs?: {
		won: number;
		lost: number;
	};
};

type GameResult = {
	playoffs?: boolean;
	overtimes: number;
	won: {
		tid: number;
		pts: number;
		sPts?: number;
	};
	lost: {
		tid: number;
		pts: number;
		sPts?: number;
	};
};

// Add (sign 1) or remove (sign -1) the result of a game from a team's record
export const updateRecordForGameResult = (
	t: TeamRecord,
	game: GameResult,
	otl: boolean,
	sign: 1 | -1,
) => {
	if (game.playoffs) {
		if (t.playoffs) {
			if (game.won.tid === t.tid) {
				t.playoffs.won += sign;
			} else if (game.lost.tid === t.tid) {
				t.playoffs.lost += sign;
			}
		}
	} else if (
		game.won.pts === game.lost.pts &&
		game.won.sPts === game.lost.sPts
	) {
		// Tied!
		if (t.tied !== undefined) {
			t.tied += sign;
		}
	} else if (game.won.tid === t.tid) {
		t.won += sign;
	} else if (game.lost.tid === t.tid) {
		if (game.overtimes > 0 && otl && t.otl !== undefined) {
			t.otl += sign;
		} else {
			t.lost += sign;
		}
	}
};
