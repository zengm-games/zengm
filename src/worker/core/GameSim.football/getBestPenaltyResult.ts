import range from "lodash-es/range";
import orderBy from "lodash-es/orderBy";
import type { State } from "./Play";
import type { TeamNum } from "./types";
import { random } from "../../util";

// Sort by looking at a bunch of different factors in order of importance
const getBestPenaltyResult = <
	T extends {
		state: State;
	},
>(
	results: T[],
	initialState: State,
	noPenaltyState: State,
	t: TeamNum,
): T => {
	console.log("getBestPenaltyResult", t);
	console.log("initialState", JSON.parse(JSON.stringify(initialState)));
	console.log("noPenaltyState", JSON.parse(JSON.stringify(noPenaltyState)));
	console.log("results", JSON.parse(JSON.stringify(results)));
	const t2 = t === 0 ? 1 : 0;

	const scores = results.map(({ state }) => {
		const pointDifferential = state.pts[t] - state.pts[t2];
		const pointDifferentialBeforePlay =
			initialState.pts[t] - initialState.pts[t2];
		const ptsScoredThisPlay = ([0, 1] as const).map(
			t => state.pts[t] - initialState.pts[t],
		);

		// Does not handle situation where a tie is particularly desirable or not desirable for a team
		let overtimeScore = 0;
		if (state.overtimeState === "over") {
			if (state.pts[t] > state.pts[t2]) {
				overtimeScore = 1;
			} else if (state.pts[t2] < state.pts[t]) {
				overtimeScore = -1;
			}
		}

		// Touchdown or 2 point conversion
		let tdScore = 0;
		if (ptsScoredThisPlay[t] === 6 || ptsScoredThisPlay[t] === 2) {
			tdScore = ptsScoredThisPlay[t];
		} else if (ptsScoredThisPlay[t2] === -6 || ptsScoredThisPlay[t2] === -2) {
			tdScore = -ptsScoredThisPlay[t2];
		}

		// Score to take the lead
		let leadScore = 0;
		if (pointDifferential > 0 && pointDifferentialBeforePlay < 0) {
			leadScore = pointDifferential - pointDifferentialBeforePlay;
		} else if (pointDifferential < 0 && pointDifferentialBeforePlay > 0) {
			leadScore = pointDifferential - pointDifferentialBeforePlay;
		}

		// Change of possession
		let changeOfPossession = 0;
		if (state.o === t && initialState.o !== t) {
			changeOfPossession = 1;
		} else if (state.o === t2 && initialState.o !== t2) {
			changeOfPossession = -1;
		}

		// First down achieved while not moving backwards
		let firstDown = 0;
		if (
			state.o === t &&
			initialState.o === t &&
			state.down === 1 &&
			initialState.down > 1 &&
			state.scrimmage >= initialState.scrimmage
		) {
			firstDown = 1;
		} else if (
			state.o === t2 &&
			initialState.o === t2 &&
			state.down === 1 &&
			initialState.down > 1 &&
			state.scrimmage >= initialState.scrimmage
		) {
			firstDown = -1;
		}

		// Any other score
		let anyScore = 0;
		if (ptsScoredThisPlay[t] > 0) {
			anyScore = ptsScoredThisPlay[t];
		} else if (ptsScoredThisPlay[t2] > 0) {
			anyScore = ptsScoredThisPlay[t2];
		}

		// Field position
		let fieldPosition = 0;
		if (state.o === t && initialState.o === t) {
			fieldPosition = state.scrimmage;
		} else if (state.o === t2 && initialState.o === t2) {
			fieldPosition = -state.scrimmage;
		}

		// Down
		let down = 0;
		if (state.o === t && initialState.o === t) {
			down = -state.down;
		} else if (state.o === t2 && initialState.o === t2) {
			down = state.down;
		}

		// To Go
		let toGo = 0;
		if (state.o === t && initialState.o === t) {
			toGo = -state.toGo;
		} else if (state.o === t2 && initialState.o === t2) {
			toGo = state.toGo;
		}

		return [
			overtimeScore,
			tdScore,
			leadScore,
			changeOfPossession,
			firstDown,
			anyScore,
			fieldPosition,
			down,
			toGo,
		];
	});

	const numScores = scores[0].length;
	const scoreIndexes = range(numScores);
	const orders = ([...scoreIndexes] as any[]).fill("desc");
	const orderedScores = orderBy(scores, scoreIndexes, orders);
	console.log(scores, orderedScores);

	const bestScoreString = JSON.stringify(orderedScores[0]);
	const bestScores = scores.filter(
		score => JSON.stringify(score) === bestScoreString,
	);

	// Randomly pick a winner if there are ties
	const bestScore = random.choice(bestScores);

	// Referential equality ftw
	const bestIndex = scores.indexOf(bestScore);

	const bestResult = results[bestIndex];
	if (!bestResult) {
		throw new Error("Should never happen");
	}

	return bestResult;
};

export default getBestPenaltyResult;
