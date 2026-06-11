import { RESTRICTED_1_PICK, RESTRICTED_5_PICK } from "./nba2027.ts";
import type { DraftLotteryResult, DraftType } from "../../../common/types.ts";

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

export const getDraftLotteryProbs = (
	draftLotteryResult: DraftLotteryResult<boolean> | undefined,
	draftType: DraftType | "dummy" | undefined,
	numToPick: number,
): { tooSlow: boolean; probs?: (number | undefined)[][] } => {
	if (
		draftLotteryResult?.result === undefined ||
		draftType === undefined ||
		draftType === "random" ||
		draftType === "noLottery" ||
		draftType === "noLotteryReverse" ||
		draftType === "freeAgents" ||
		draftType === "dummy"
	) {
		return { tooSlow: false };
	}

	const result = draftLotteryResult.result;

	const probs: number[][] = [];

	if (draftType === "randomLottery") {
		for (let i = 0; i < result.length; i++) {
			probs[i] = new Array(result.length).fill(1 / result.length);
		}

		return { tooSlow: false, probs };
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

		return { tooSlow: false, probs };
	}

	// Clever dynamic programming and bitmask stuff below comes from wiigeneral https://discord.com/channels/@me/1511922269084188723/1514152028039811153

	const numTeams = result.length;
	const numTeamsBigInt = BigInt(numTeams); // I severely doubt precomputing changes anything, but it's more readable

	for (let i = 0; i < numTeams; i++) {
		// Initialize values that we'll definitely fill in soon
		probs[i] = new Array(numTeams).fill(undefined);
	}

	// This can be a type
	const equivalenceMap = new Map<
		number,
		{
			chances: number;
			isBottom3: boolean;
			isRestricted1: boolean | undefined;
			isRestricted5: boolean | undefined;
			teamIndices: number[];
		}
	>();

	const bottom3IDs = new Set(result.slice(0, 3).map((t) => t.tid));
	let bottom3Mask = 0n;

	for (let i = 0; i < numTeams; i++) {
		const isBottom3 = bottom3IDs.has(result[i]!.tid);
		if (isBottom3) {
			bottom3Mask |= 1n << BigInt(i);
		}

		const isRestricted1 = draftLotteryResult.nba2027?.restricted1.includes(i);
		const isRestricted5 = draftLotteryResult.nba2027?.restricted5.includes(i);
		const chances = result[i]!.chances;

		// Equivalences only exist in nba2027
		const key =
			draftType === "nba2027"
				? (chances << 3) |
					((isBottom3 ? 1 : 0) << 2) |
					((isRestricted1 ? 1 : 0) << 1) |
					(isRestricted5 ? 1 : 0)
				: i;
		if (!equivalenceMap.has(key)) {
			equivalenceMap.set(key, {
				chances,
				isBottom3,
				isRestricted1,
				isRestricted5,
				teamIndices: [],
			});
		}
		equivalenceMap.get(key)!.teamIndices.push(i);
	}
	const equivalenceClasses = Array.from(equivalenceMap.values());

	for (const equivalenceClass of equivalenceClasses) {
		for (const idx of equivalenceClass.teamIndices) {
			equivalenceMap.set(idx, equivalenceClass);
		}
	}

	const pickLayers: (Map<bigint, number> | null)[] = Array.from(
		{ length: numTeams + 1 },
		() => new Map(),
	);

	// Start at the first pick with 0 teams drawn, 0 slots filled with 100% chance
	pickLayers[0]!.set(0n, 1.0);

	const lowerHalfMask = (1n << numTeamsBigInt) - 1n;
	const classProbs: (number[] | undefined)[] = equivalenceClasses.map(() =>
		new Array(numTeams).fill(0),
	);

	// Find the lowest available pick slot that hasn't been filled yet
	for (let currentLayer = 0; currentLayer < numTeams; currentLayer++) {
		for (const [stateKey, prob] of pickLayers[currentLayer]!) {
			if (prob <= 0) {
				continue;
			}

			// Extract masks from the bitmask, the first half for drawn teams, and the second half for filled teams
			// Since it's a BigInt, the amount of picks shouldn't be restricted
			const drawnTeamsMask = stateKey & lowerHalfMask;
			const filledSlotsMask = stateKey >> numTeamsBigInt;

			let currentPick = 0;
			while (
				currentPick < numTeams &&
				filledSlotsMask & (1n << BigInt(currentPick))
			) {
				currentPick++;
			}

			if (currentPick >= numTeams) {
				continue;
			}

			if (draftType !== "nba2027" && currentLayer >= numToPick) {
				let targetSlot = currentPick;
				// Place all remaining undrawn teams into the remaining slots in strict standings order
				for (let i = 0; i < numTeams; i++) {
					if (!(drawnTeamsMask & (1n << BigInt(i)))) {
						while (
							targetSlot < numTeams &&
							filledSlotsMask & (1n << BigInt(targetSlot))
						) {
							targetSlot++;
						}

						if (targetSlot < numTeams) {
							classProbs[i]![targetSlot]! += prob;
						}
						targetSlot++;
					}
				}
				continue;
			}

			if (draftType === "nba2027") {
				const emptySlots: number[] = [];
				for (let j = currentPick; j <= 11; j++) {
					if (!(filledSlotsMask & (1n << BigInt(j)))) {
						emptySlots.push(j);
					}
				}

				const remainingBottom3Mask = bottom3Mask & ~drawnTeamsMask;
				let skipCount = 0;
				for (let temp = remainingBottom3Mask; temp > 0n; temp &= temp - 1n) {
					skipCount++;
				}

				if (emptySlots.length > 0 && skipCount === emptySlots.length) {
					// Determine the individual team share for landing in a slot for the bottom 3 teams
					const probsPerTeam = prob / skipCount;

					for (let i = 0; i < numTeams; i++) {
						if (remainingBottom3Mask & (1n << BigInt(i))) {
							const equivalenceClass = equivalenceMap.get(i)!;
							const classIdx = equivalenceClasses.indexOf(equivalenceClass);

							for (const slotIdx of emptySlots) {
								if (slotIdx < numTeams) {
									classProbs[classIdx]![slotIdx]! += probsPerTeam;
								}
							}
						}
					}

					const nextDrawnMask = drawnTeamsMask | remainingBottom3Mask;
					let nextFilledMask = filledSlotsMask;
					for (const slotIdx of emptySlots) {
						nextFilledMask |= 1n << BigInt(slotIdx);
					}

					// Skip however spots many the bottom 3 teams forcefully occupied in the top 12
					const nextLayerID = currentLayer + skipCount;
					const nextKey = (nextFilledMask << numTeamsBigInt) | nextDrawnMask;
					pickLayers[nextLayerID]!.set(
						nextKey,
						(pickLayers[nextLayerID]!.get(nextKey) || 0) + prob,
					);
					continue;
				}
			}

			// Compute probability for each individual equivalence class
			let totalAvailableChances = 0;
			const activeTeamsPerClass: number[][] = [];

			for (const equivalenceClass of equivalenceClasses) {
				const activeTeams: number[] = [];
				for (const i of equivalenceClass.teamIndices) {
					if (!(drawnTeamsMask & (1n << BigInt(i)))) {
						activeTeams.push(i);
					}
				}
				activeTeamsPerClass.push(activeTeams);
				totalAvailableChances += activeTeams.length * equivalenceClass.chances;
			}

			if (totalAvailableChances === 0) {
				continue;
			}

			// Use the first active team per class
			for (
				let equivalenceClassIdx = 0;
				equivalenceClassIdx < equivalenceClasses.length;
				equivalenceClassIdx++
			) {
				const activeTeams = activeTeamsPerClass[equivalenceClassIdx]!;
				if (activeTeams.length === 0) {
					continue;
				}

				const equivalenceClass = equivalenceClasses[equivalenceClassIdx]!;

				const repTeamIdx = activeTeams[0]!;

				// The probability is the chances a class has multiplied by the teams in the class divided by total chances of all undrawn teams
				const branchProb =
					prob * (equivalenceClass.chances / totalAvailableChances);

				let targetPick = currentPick;
				while (true) {
					const isBanned =
						draftType === "nba2027" &&
						((targetPick === 0 && equivalenceClass.isRestricted1) ||
							(targetPick <= 4 && equivalenceClass.isRestricted5));

					if (!isBanned && !(filledSlotsMask & (1n << BigInt(targetPick)))) {
						break;
					}
					targetPick++;
				}

				if (targetPick < numTeams) {
					classProbs[equivalenceClassIdx]![targetPick]! +=
						branchProb * activeTeams.length;
				}

				const nextDrawnMask = drawnTeamsMask | (1n << BigInt(repTeamIdx));
				const nextFilledMask = filledSlotsMask | (1n << BigInt(targetPick));
				const nextKey = (nextFilledMask << numTeamsBigInt) | nextDrawnMask;
				const nextLayerID = currentLayer + 1;

				// Multiply the probability by the amount of teams in the class
				pickLayers[nextLayerID]!.set(
					nextKey,
					(pickLayers[nextLayerID]!.get(nextKey) || 0) +
						branchProb * activeTeams.length,
				);
			}
		}
		pickLayers[currentLayer] = null;
	}

	// Divide the probabilities among each class equally
	for (
		let equivalenceClassIdx = 0;
		equivalenceClassIdx < equivalenceClasses.length;
		equivalenceClassIdx++
	) {
		const equivalenceClass = equivalenceClasses[equivalenceClassIdx]!;
		const classSize = equivalenceClass.teamIndices.length;
		for (let slot = 0; slot < numTeams; slot++) {
			const totalSlotProb = classProbs[equivalenceClassIdx]![slot]!;
			if (totalSlotProb > 0) {
				const probPerTeam = totalSlotProb / classSize;
				for (const teamIdx of equivalenceClass.teamIndices) {
					probs[teamIdx]![slot] = probPerTeam;
				}
			}
		}
	}

	return {
		tooSlow: false,
		probs,
	};
};
