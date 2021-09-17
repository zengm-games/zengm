import type { AllStars, Conditions, ThreeResult } from "../../../common/types";
import type { PlayerRatings } from "../../../common/types.basketball";
import { idb } from "../../db";
import { g } from "../../util";
import { saveAwardsByPlayer } from "../season/awards";
import { getNextRoundType } from "./contest";

export type Three = NonNullable<AllStars["three"]>;

export const NUM_SHOOTERS_IN_CONTEST = 8;
const NUM_RACKS = 5;
const NUM_BALLS_PER_RACK = 5;

const doneRoundShots = (racks: ThreeResult["racks"]) => {
	return (
		racks.length === NUM_RACKS &&
		racks.every(rack => rack.length === NUM_BALLS_PER_RACK)
	);
};

// Return undefined means contest is over or another round needs to be added
const getNextShooterIndex = (three: Three) => {
	const currentRound = three.rounds.at(-1);

	// Another shot/score in the current round needed?
	const lastResult = currentRound.results.at(-1);
	if (lastResult && !doneRoundShots(lastResult.racks)) {
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
		for (const rack of result.racks) {
			for (let i = 0; i < rack.length; i++) {
				const value = i === NUM_BALLS_PER_RACK - 1 ? 2 : 1;
				if (rack[i]) {
					resultsByIndex[result.index].score += value;
				}
			}
		}
	}

	return Object.values(resultsByIndex);
};

// Increase exponent to lower scores and make them more spread out
const getShotOutcome = (rating: number) =>
	Math.random() < 0.2 + 0.7 * (rating / 100) ** 1.5;

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
	if (nextShooterIndex !== undefined) {
		const currentRound = three.rounds.at(-1);
		const lastResult = currentRound.results.at(-1);

		// Each call should take a shot or label a result as done
		if (lastResult && doneRoundShots(lastResult.racks)) {
			// Player over, prep next player
			if (currentRound.results.length < currentRound.indexes.length) {
				currentRound.results.push({
					index: nextShooterIndex,
					racks: [[]],
				});
			}
		} else {
			// New shot attempt
			const p = await idb.cache.players.get(
				three.players[nextShooterIndex].pid,
			);
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
					type = "rack";
				} else {
					type = "player";
				}
			}

			// Don't set done even if all shots are done, do it on next call
		}
	} else {
		// Index undefined means a round just ended. Do we need another normal round? Another tiebreaker round? Or is the contest over?

		const { indexesForNextRound, indexesForNextTiebreaker, outcome } =
			getNextRoundType(three);

		if (outcome === "normalRound") {
			type = "round";

			three.rounds.push({
				indexes: indexesForNextRound,
				results: [
					{
						index: indexesForNextRound[0],
						racks: [[]],
					},
				],
			});
		} else if (outcome === "tiebreakerRound") {
			type = "round";

			three.rounds.push({
				indexes: indexesForNextTiebreaker,
				results: [
					{
						index: indexesForNextTiebreaker[0],
						racks: [[]],
					},
				],
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

	await idb.cache.allStars.put(allStars);

	return type;
};
