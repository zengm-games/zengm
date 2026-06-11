import { RESTRICTED_1_PICK, RESTRICTED_5_PICK } from "./nba2027.ts";
import type {
	DraftLotteryResult,
	DraftLotteryResultArray,
	DraftType,
} from "../../../common/types.ts";
import helpers from "../../util/helpers.ts";

const draftLotteryProbsTooSlow = (numToPick: number) => {
	return numToPick > 20;
};

// This is needed to handle restricted1/restricted5 for nba2027 easily, otherwise could just be an array
class PickIndexes {
	indexes: number[] = [];
	private nba2027:
		| {
				restrictions: NonNullable<DraftLotteryResult["nba2027"]>;
				pending1: number[];
				pending5: number[];
		  }
		| undefined;

	constructor(nba2027Restrictions: DraftLotteryResult["nba2027"]) {
		if (nba2027Restrictions) {
			this.nba2027 = {
				pending1: [],
				pending5: [],
				restrictions: nba2027Restrictions,
			};
		}
	}

	// Use ignoreRestrictions for riggedLottery stuff
	add(index: number, ignoreRestrictions: boolean) {
		if (this.nba2027 && !ignoreRestrictions) {
			// If we are already past pick 5, then we don't need to worry about giving this pick special treatment
			if (this.indexes.length < RESTRICTED_5_PICK) {
				// restricted5 takes precedence over restricted1
				if (this.nba2027.restrictions.restricted5.includes(index)) {
					this.nba2027.pending5.push(index);
					return;
				} else if (
					this.indexes.length < RESTRICTED_1_PICK &&
					this.nba2027.restrictions.restricted1.includes(index)
				) {
					this.nba2027.pending1.push(index);
					return;
				}
			}
		}

		this.indexes.push(index);

		if (this.nba2027) {
			// If we just added pick 1 or pick 5, then handle pending picks
			if (
				this.indexes.length >= RESTRICTED_1_PICK &&
				this.nba2027.pending1.length > 0
			) {
				this.indexes.push(...this.nba2027.pending1);
				this.nba2027.pending1 = [];
			}

			// Not elseif in case somehow the above push triggered this limit too (would need to have customizable limits or somehow 4+ #1 picks)
			if (
				this.indexes.length >= RESTRICTED_5_PICK &&
				this.nba2027.pending5.length > 0
			) {
				this.indexes.push(...this.nba2027.pending5);
				this.nba2027.pending5 = [];
			}
		}
	}

	// In some cases, like with very few teams, we can't fully apply the constraints and we just should do it at the end as best possible
	finalizeNba2027() {
		if (this.nba2027) {
			const { pending1, pending5 } = this.nba2027;
			if (pending1.length > 0) {
				this.indexes.push(...pending1);
			}
			if (pending5.length > 0) {
				this.indexes.push(...pending5);
			}
		}
	}
}

export const simLottery = (
	draftType: DraftType,
	chances: number[],
	numToPick: number,
	nba2027Restrictions: DraftLotteryResult["nba2027"],

	// Each entry in this array corresponds to a lottery pick (length is numToPick), each value is either undefined (this pick is not rigged) or has a number (index of chances array)
	riggedLotteryIndexesByPick: (number | undefined)[] | undefined,
): number[] => {
	let teams = chances.map((chance, index) => ({
		chances: chance,
		index,
	}));

	const pickIndexes = new PickIndexes(nba2027Restrictions);

	const riggedLotteryIndexes = riggedLotteryIndexesByPick
		? new Set(riggedLotteryIndexesByPick.filter((index) => index !== undefined))
		: undefined;

	const top12GuaranteedLimit = 12;
	const top12Guaranteed =
		draftType === "nba2027"
			? new Set(
					teams.slice(0, 3).filter((t) => {
						// If a team is in riggedLotteryIndexes, then it shouldn't have any guarantee applied to it, in case the user picks something that breaks the guarantee
						return !riggedLotteryIndexes?.has(t.index);
					}),
				)
			: undefined;

	const selectLotteryWinner = (
		t: (typeof teams)[number],
		ignoreRestrictions: boolean,
	) => {
		pickIndexes.add(t.index, ignoreRestrictions);
		teams = teams.filter((t2) => t2 !== t);
		if (top12Guaranteed) {
			top12Guaranteed.delete(t);
		}
	};

	for (let i = 0; i < numToPick; i++) {
		// Short circuit if this is rigged
		if (riggedLotteryIndexesByPick) {
			// Use `pickIndexes.indexes.length` rather than `i` to account for nba2027 restrictions leading to them not being exactly the same thing (could have some selections already processed but not in indexes yet)
			const riggedIndex =
				riggedLotteryIndexesByPick[pickIndexes.indexes.length];
			if (riggedIndex !== undefined) {
				const t = teams.find((t2) => t2.index === riggedIndex);
				if (t) {
					selectLotteryWinner(t, true);
					continue;
				}
			}
		}

		// For example, if there are still 3 teams left to put in the top 12, then forceTop12 needs to become true when i=9 (10th pick)
		const numTop12GuaranteedLeft = top12Guaranteed?.size;
		const forceTop12 =
			numTop12GuaranteedLeft !== undefined && numTop12GuaranteedLeft > 0
				? i + numTop12GuaranteedLeft >= top12GuaranteedLimit
				: false;

		let sum = 0;
		for (const t of teams) {
			if (forceTop12 && !top12Guaranteed!.has(t)) {
				// No chances for this team, we need to pick one of the worst 3
			} else if (riggedLotteryIndexes?.has(t.index)) {
				// No chances, this team is rigged in another slot
			} else {
				sum += t.chances;
			}
		}

		const rand = Math.random() * sum;
		let sum2 = 0;
		for (const t of teams) {
			if (forceTop12 && !top12Guaranteed!.has(t)) {
				// No chances for this team, we need to pick one of the worst 3
			} else if (riggedLotteryIndexes?.has(t.index)) {
				// No chances, this team is rigged in another slot
			} else {
				sum2 += t.chances;
			}
			if (rand < sum2) {
				selectLotteryWinner(t, false);
				break;
			}
		}
	}

	// Normally follow restrictions. But in some cases, such as rigging the loggery in nba2027 such that a restricted1/restricted5 team can only go in the top 5, you can get in a situation where there are no available teams to be picked. In that situation, we need to ignore nba2027Restrictions.
	if (riggedLotteryIndexes && nba2027Restrictions) {
		return simLottery(
			draftType,
			chances,
			numToPick,
			undefined,
			riggedLotteryIndexesByPick,
		);
	}

	for (const t of teams) {
		pickIndexes.add(t.index, false);
	}

	pickIndexes.finalizeNba2027();

	return pickIndexes.indexes;
};

// If it's too slow to calculate the precise probability, just estimate
const monteCarloLotteryProbs = (
	draftType: DraftType,
	result: DraftLotteryResultArray,
	numToPick: number,
	nba2027Restrictions: DraftLotteryResult["nba2027"],
) => {
	const ITERATIONS = 100000;

	const probs: number[][] = [];

	const chances = result.map((row) => row.chances);

	for (let i = 0; i < ITERATIONS; i++) {
		const result = simLottery(
			draftType,
			chances,
			numToPick,
			nba2027Restrictions,
			undefined,
		);
		for (let j = 0; j < result.length; j++) {
			const k = result[j]!;
			probs[k] ??= [];
			probs[k][j] ??= 0;
			// @ts-expect-error
			probs[k][j] += 1 / ITERATIONS;
		}
	}

	// First column we can trivially calculate
	const firstPickChances = result.map((row, i) =>
		nba2027Restrictions &&
		(nba2027Restrictions.restricted1.includes(i) ||
			nba2027Restrictions.restricted5.includes(i))
			? 0
			: row.chances,
	);
	const firstPickChancesSum = helpers.sum(firstPickChances);
	for (const [i, chances] of firstPickChances.entries()) {
		if (chances > 0) {
			probs[i]![0] = chances / firstPickChancesSum;
		}
	}

	return probs;
};

export const getDraftLotteryProbs = (
	draftLotteryResult: DraftLotteryResult<boolean> | undefined,
	draftType: DraftType | "dummy" | undefined,
	numToPick: number,
): {
	tooSlow: boolean;
	probs?: (number | undefined)[][];
} => {
	if (
		draftLotteryResult?.result === undefined ||
		draftType === undefined ||
		draftType === "random" ||
		draftType === "noLottery" ||
		draftType === "noLotteryReverse" ||
		draftType === "freeAgents" ||
		draftType === "dummy"
	) {
		return {
			tooSlow: false,
		};
	}

	const result = draftLotteryResult.result;

	const probs: number[][] = [];

	if (draftType === "randomLottery") {
		for (let i = 0; i < result.length; i++) {
			probs[i] = new Array(result.length).fill(1 / result.length);
		}

		return {
			tooSlow: false,
			probs,
		};
	}

	if (draftType === "coinFlip") {
		for (let i = 0; i < result.length; i++) {
			const row = [];
			for (let j = 0; j < result.length; j++) {
				if (i === 0 && j <= 1) {
					row[j] = 0.5;
				} else if (i === 1 && j <= 1) {
					row[j] = 0.5;
				} else if (i === j) {
					row[j] = 1;
				} else {
					row[j] = 0;
				}
			}
			probs[i] = row;
		}

		return {
			tooSlow: false,
			probs,
		};
	}

	const tooSlow = draftLotteryProbsTooSlow(numToPick);

	if (tooSlow) {
		// Estimate probs
		return {
			tooSlow,
			probs: monteCarloLotteryProbs(
				draftType,
				result,
				numToPick,
				draftLotteryResult.nba2027,
			),
		};
	}

	const numTeams = result.length;

	for (let i = 0; i < result.length; i++) {
		probs[i] = new Array(numTeams).fill(undefined);
	}

	// Clever dynamic programming and bitmask stuff below comes from wiigeneral https://discord.com/channels/@me/1511922269084188723/1514152028039811153

	let bottom3Mask = 0;
	if (draftType === "nba2027") {
		const bottom3IDs = new Set(result.slice(0, 3).map((t) => t.tid));
		for (let i = 0; i < numTeams; i++) {
			if (bottom3IDs.has(result[i]!.tid)) {
				bottom3Mask |= 1 << i;
			}
		}
	}

	const pickLayers: Map<bigint, number>[] = Array.from(
		{ length: numTeams + 1 },
		() => new Map(),
	);

	// Start at the first pick with 0 teams drawn, 0 slots filled with 100% chance
	pickLayers[0]!.set(0n, 1.0);

	// Find the lowest available pick slot that hasn't been filled yet
	for (let currentLayer = 0; currentLayer < numTeams; currentLayer++) {
		for (const [stateKey, prob] of pickLayers[currentLayer]!) {
			if (prob <= 0) {
				continue;
			}

			// Extract masks from the 64-bit BigInt, the first half for drawn teams and the second half for filled teams
			// Maybe this isn't worth doing at all?
			const drawnTeamsMask = Number(stateKey & 0xffffffffn);
			const filledSlotsMask = Number(stateKey >> 32n);

			let currentPick = 0;
			while (currentPick < numTeams && filledSlotsMask & (1 << currentPick)) {
				currentPick++;
			}

			if (currentPick >= numTeams) {
				continue;
			}

			if (draftType !== "nba2027" && currentLayer >= numToPick) {
				let targetSlot = currentPick;
				// Place all remaining undrawn teams into the remaining slots in strict standings order
				for (let i = 0; i < numTeams; i++) {
					if (!(drawnTeamsMask & (1 << i))) {
						while (
							targetSlot < numTeams &&
							filledSlotsMask & (1 << targetSlot)
						) {
							targetSlot++;
						}
						if (targetSlot < numTeams) {
							probs[i]![targetSlot] = (probs[i]![targetSlot] ?? 0) + prob;
						}
						targetSlot++;
					}
				}
				continue;
			}

			if (draftType === "nba2027") {
				let emptySlotsToNo12 = 0;
				for (let j = currentPick; j <= 11; j++) {
					if (!(filledSlotsMask & (1 << j))) {
						emptySlotsToNo12++;
					}
				}

				const remainingBottom3Mask = bottom3Mask & ~drawnTeamsMask;
				let remCount = 0;
				let tempMask = remainingBottom3Mask;
				while (tempMask > 0) {
					tempMask &= tempMask - 1;
					remCount++;
				}

				if (emptySlotsToNo12 > 0 && remCount === emptySlotsToNo12) {
					const remBottom3Indices: number[] = [];
					for (let i = 0; i < numTeams; i++) {
						// Force the bottom 3 teams to be picked if necessary to be picked in the top 12
						if (remainingBottom3Mask & (1 << i)) {
							remBottom3Indices.push(i);
						}
					}

					const emptySlots: number[] = [];
					for (let j = currentPick; j <= 11; j++) {
						if (!(filledSlotsMask & (1 << j))) {
							emptySlots.push(j);
						}
					}

					const pEach = prob / remCount;
					for (const teamIdx of remBottom3Indices) {
						for (const slotIdx of emptySlots) {
							if (slotIdx < numTeams) {
								probs[teamIdx]![slotIdx] =
									(probs[teamIdx]![slotIdx] ?? 0) + pEach;
							}
						}
					}

					const nextDrawnMask = drawnTeamsMask | remainingBottom3Mask;
					let nextFilledMask = filledSlotsMask;
					for (const slotIdx of emptySlots) {
						nextFilledMask |= 1 << slotIdx;
					}

					// Skip however spots many the bottom 3 teams occupied to force them into the top 12
					const nextLayerID = currentLayer + remCount;
					const nextKey =
						(BigInt(nextFilledMask) << 32n) | BigInt(nextDrawnMask);
					pickLayers[nextLayerID]!.set(
						nextKey,
						(pickLayers[nextLayerID]!.get(nextKey) || 0) + prob,
					);
					continue;
				}
			}

			let totalAvailableChances = 0;
			for (let i = 0; i < numTeams; i++) {
				if (!(drawnTeamsMask & (1 << i))) {
					totalAvailableChances += result[i]!.chances;
				}
			}
			if (totalAvailableChances === 0) {
				continue;
			}

			for (let i = 0; i < numTeams; i++) {
				if (drawnTeamsMask & (1 << i)) {
					continue;
				}

				// The probability is the chances a team has divided by total chances of all undrawn teams
				const branchProb = prob * (result[i]!.chances / totalAvailableChances);

				let targetPick = currentPick;
				while (true) {
					const isBanned =
						draftType === "nba2027" &&
						((targetPick === 0 &&
							draftLotteryResult.nba2027 &&
							draftLotteryResult.nba2027.restricted1.includes(i)) ||
							(targetPick <= 4 &&
								draftLotteryResult.nba2027 &&
								draftLotteryResult.nba2027.restricted5.includes(i)));

					if (!isBanned && !(filledSlotsMask & (1 << targetPick))) {
						break;
					}
					targetPick++;
				}

				if (targetPick < numTeams) {
					probs[i]![targetPick] = (probs[i]![targetPick] ?? 0) + branchProb;
				}

				// Next state key
				const nextDrawnMask = drawnTeamsMask | (1 << i);
				const nextFilledMask = filledSlotsMask | (1 << targetPick);
				const nextKey = (BigInt(nextFilledMask) << 32n) | BigInt(nextDrawnMask);
				const nextLayerID = currentLayer + 1;

				pickLayers[nextLayerID]!.set(
					nextKey,
					(pickLayers[nextLayerID]!.get(nextKey) || 0) + branchProb,
				);
			}
		}
		pickLayers[currentLayer] = null as any;
	}

	return {
		tooSlow,
		probs,
	};
};
