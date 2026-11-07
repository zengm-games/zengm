import { PLAYER } from "./constants.ts";
import type { Contract, PlayerWithoutKey } from "./types.ts";

type ContractSeasons = Pick<Contract, "start" | "amounts">;

// Last season of the contract
export const getContractExp = (contract: ContractSeasons) => {
	return contract.start + contract.amounts.length - 1;
};

// undefined if the contract does not cover this season
export const getContractAmount = (
	contract: ContractSeasons,
	season: number,
) => {
	return contract.amounts[season - contract.start];
};

// Like getContractAmount, but if the contract does not cover this season, it's the amount of the nearest season it does cover. That's the first season for a contract that hasn't started yet, and the last season for one that's over, like for an expiring contract after the season, which is still what the player is being paid.
export const getNearestContractAmount = (
	contract: ContractSeasons,
	season: number,
) => {
	const index = Math.min(
		Math.max(season - contract.start, 0),
		contract.amounts.length - 1,
	);
	return contract.amounts[index]!;
};

// A player's current contract is his last one, unless it ended early. Players with a contract demand (free agents, draft prospects, unsigned players on a team) and retired players have no current contract.
//
// This doesn't depend on whether he's on a team, because in a fantasy draft, players who were on a team are draft prospects until they're drafted, but they keep their contracts (see selectPlayer).
export const getCurrentContract = (
	p: Pick<PlayerWithoutKey, "contractDemand" | "contracts" | "tid">,
) => {
	if (p.contractDemand || p.tid === PLAYER.RETIRED) {
		return undefined;
	}

	const contract = p.contracts.at(-1);
	if (contract && !contract.endedEarly) {
		return contract;
	}
};
