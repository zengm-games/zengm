import type { AllStars, Conditions, ThreeResult } from "../../../common/types";
import type { PlayerRatings } from "../../../common/types.basketball";
import { idb } from "../../db";
import { g } from "../../util";
import { saveAwardsByPlayer } from "../season/awards";
import { getNextRoundType } from "./dunkContest";

type Three = NonNullable<AllStars["three"]>;

export const NUM_SHOOTERS_IN_CONTEST = 8;
const NUM_RACKS = 5;
const NUM_BALLS_PER_RACK = 5;

// Return undefined means contest is over or another round needs to be added
const getNextShooterIndex = (three: Three) => {
	const currentRound = three.rounds.at(-1);

	// Another shot/score in the current round needed?
	const lastResult = currentRound.results.at(-1);
	if (lastResult && !lastResult.done) {
		return lastResult.index;
	}

	const numShootersThisRound = currentRound.indexes.length;

	// Round is over
	if (currentRound.results.length >= numShootersThisRound) {
		return undefined;
	}

	// Next shooter up
	return currentRound.indexes[currentRound.results.length];
};

export const getRoundResults = (round: Three["rounds"][number]) => {
	const resultsByIndex: Record<
		number,
		{
			index: number;
			score: number;
		}
	> = {};

	for (const index of round.indexes) {
		resultsByIndex[index] = {
			index,
			score: 0,
		};
	}

	for (const result of round.results) {
		for (const racks of result.racks) {
			for (const shot of racks) {
				if (shot) {
					resultsByIndex[result.index].score += 1;
				}
			}
		}
	}

	return Object.values(resultsByIndex);
};

const doneRoundShots = (result: ThreeResult) => {
	return (
		result.racks.length === NUM_RACKS &&
		result.racks.every(rack => rack.length === NUM_BALLS_PER_RACK)
	);
};

const getShotOutcome = (rating: number) => Math.random() < rating / 100;

export const simNextThreeEvent = async (
	conditions: Conditions,
): Promise<"event" | "rack" | "player" | "round" | "all"> => {
	let type: "event" | "rack" | "player" | "round" | "all" = "event";

	const allStars = await idb.cache.allStars.get(g.get("season"));
	const three = allStars?.three;
	if (!three) {
		throw new Error("No three-point contest found");
	}

	if (three.winner !== undefined) {
		// Already over
		type = "all";
		return type;
	}

	// Figure out current dunker
	const nextShooterIndex = getNextShooterIndex(three);
	if (nextShooterIndex === undefined) {
		throw new Error("nextShooterIndex should not be undefined");
		// ...because it's called again at the end of this function, and undefineds are handled there
	}

	let stillSamePlayersTurn = true;

	const currentRound = three.rounds.at(-1);
	let lastResult = currentRound.results.at(-1);

	// Each call should take a shot or label a result as done
	if (
		lastResult &&
		lastResult.index === nextShooterIndex &&
		doneRoundShots(lastResult)
	) {
		// Finalize round
		lastResult.done = true;
		stillSamePlayersTurn = false;
		type = "player";
	} else {
		// New shot attempt
		if (lastResult?.index !== nextShooterIndex) {
			// New shooter!
			lastResult = {
				index: nextShooterIndex,
				racks: [[]],
				done: false,
			};
			currentRound.results.push(lastResult);
		}

		const p = await idb.cache.players.get(three.players[nextShooterIndex].pid);
		if (!p) {
			throw new Error("Invalid pid");
		}

		const ratings = p.ratings.at(-1) as PlayerRatings;
		const rating = ratings.tp;

		const success = getShotOutcome(rating);
		lastResult.racks.at(-1).push(success);

		if (lastResult.racks.at(-1).length === NUM_BALLS_PER_RACK) {
			if (lastResult.racks.length < NUM_RACKS) {
				lastResult.racks.push([]);
			}
			type = "rack";
		}

		// Don't set done even if all shots are done, do it on next call
	}

	// Contest over? Need to add another round?
	if (!stillSamePlayersTurn) {
		const index = getNextShooterIndex(three);
		if (index === undefined) {
			// Index undefined means a round just ended. Do we need another normal round? Another tiebreaker round? Or is the contest over?

			const { indexesForNextRound, indexesForNextTiebreaker, outcome } =
				getNextRoundType(three);

			if (outcome === "normalRound") {
				type = "round";

				three.rounds.push({
					indexes: indexesForNextRound,
					results: [],
				});
			} else if (outcome === "tiebreakerRound") {
				type = "round";

				three.rounds.push({
					indexes: indexesForNextTiebreaker,
					results: [],
					tiebreaker: true,
				});
			} else {
				type = "all";

				three.winner = indexesForNextRound[0];

				const p = three.players[three.winner];

				await saveAwardsByPlayer(
					[
						{
							pid: p.pid,
							tid: p.tid,
							name: p.name,
							type: "Three-Point Contest Winner",
						},
					],
					conditions,
					g.get("season"),
					true,
				);
			}
		}
	}

	await idb.cache.allStars.put(allStars);

	return type;
};
