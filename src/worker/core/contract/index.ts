import {
	getContractAmount,
	getContractExp,
	getCurrentContract,
	getNearestContractAmount,
} from "../../../common/contracts.ts";
import type {
	Contract,
	ContractEndedEarly,
	ContractType,
	Phase,
	Player,
	FlatContractInfo,
	PlayerWithoutKey,
} from "../../../common/types.ts";
import { idb } from "../../db/index.ts";
import { g } from "../../util/index.ts";
import { getContractStartSeason } from "../../util/getContractStartSeason.ts";

// Amount that counts in payroll for a season, which by default is the first season not fully paid yet. 0 if the contract does not cover that season, so an expiring contract stops counting once the season is over.
export const getPayrollAmount = (
	contract: Pick<Contract, "amounts" | "start">,
	season: number = getContractStartSeason(),
) => {
	return getContractAmount(contract, season) ?? 0;
};

// A released player's contract is owed by the team that released him until it's fully paid
export const isReleasedContractOwed = (contract: Contract) => {
	return (
		contract.endedEarly?.reason === "released" &&
		contract.endedEarly.tid !== undefined &&
		getContractExp(contract) >= getContractStartSeason()
	);
};

// Call this whenever endedEarly.tid of any of a player's contracts changes, to keep p.owedByTids in sync
export const updateOwedByTids = (
	p: Pick<PlayerWithoutKey, "contracts" | "owedByTids">,
) => {
	const tids = new Set<number>();
	for (const contract of p.contracts) {
		if (
			contract.endedEarly?.reason === "released" &&
			contract.endedEarly.tid !== undefined
		) {
			tids.add(contract.endedEarly.tid);
		}
	}

	if (tids.size > 0) {
		p.owedByTids = Array.from(tids).sort((a, b) => a - b);
	} else {
		delete p.owedByTids;
	}
};

// Contracts a team still owes to players it released, which can be more than one for the same player. These players are always in the cache, even if retired.
export const getOwedContracts = async (tid: number) => {
	const owed = [];
	for (const p of await idb.cache.players.indexGetAll(
		"playersByOwedByTid",
		tid,
	)) {
		for (const contract of p.contracts) {
			if (
				contract.endedEarly?.reason === "released" &&
				contract.endedEarly.tid === tid &&
				isReleasedContractOwed(contract)
			) {
				owed.push({ p, contract });
			}
		}
	}
	return owed;
};

// Players who are owed money by any team that released them
const getOwedPlayers = () => {
	return idb.cache.players.indexGetAll("playersByOwedByTid", [0, Infinity]);
};

// Once a released player's contract is fully paid, the team that released him no longer owes anything. Deleting endedEarly.tid takes him out of the index of players who are owed money (unless he's owed for some other contract), so that index doesn't keep growing. Call this after the season is over.
export const clearPaidReleasedContracts = async () => {
	for (const p of await getOwedPlayers()) {
		let changed = false;
		for (const contract of p.contracts) {
			if (
				contract.endedEarly?.reason === "released" &&
				contract.endedEarly.tid !== undefined &&
				!isReleasedContractOwed(contract)
			) {
				delete contract.endedEarly.tid;
				changed = true;
			}
		}

		if (changed) {
			updateOwedByTids(p);
			await idb.cache.players.put(p);
		}
	}
};

// Remove the seasons of a contract from season on, like when it's replaced by a new contract. Returns false if that leaves no seasons, in which case the caller should remove the contract.
export const truncateContractBefore = (
	contract: Pick<Contract, "amounts" | "start">,
	season: number,
) => {
	const numSeasons = season - contract.start;
	if (numSeasons <= 0) {
		return false;
	}

	contract.amounts = contract.amounts.slice(0, numSeasons);
	return true;
};

// Teams no longer owe anything to players they released, like for a fantasy draft. Seasons that were already paid are kept.
export const cancelReleasedContracts = async () => {
	const startSeason = getContractStartSeason();
	for (const p of await getOwedPlayers()) {
		const contracts = [];
		for (const contract of p.contracts) {
			if (isReleasedContractOwed(contract)) {
				if (!truncateContractBefore(contract, startSeason)) {
					continue;
				}
				delete contract.endedEarly!.tid;
			}
			contracts.push(contract);
		}
		p.contracts = contracts;

		updateOwedByTids(p);
		await idb.cache.players.put(p);
	}
};

// Same amount every season, like contracts that are signed in game
export const isFlatContract = (contract: Pick<Contract, "amounts">) => {
	return contract.amounts.every((amount) => amount === contract.amounts[0]);
};

// For an expiring contract after the season is over, amount is from its last season, which is what the player is still being paid
export const contractToSummary = (contract: Contract): FlatContractInfo => {
	const summary: FlatContractInfo = {
		amount: getNearestContractAmount(contract, getContractStartSeason()),
		exp: getContractExp(contract),
	};
	if (contract.type === "rookie") {
		summary.rookie = true;
	}
	return summary;
};

// The contract that matters for a player right now, in the simple format (amount and exp). That's the contract demand if he has one (free agents, draft prospects, unsigned players on a team), otherwise his current contract. undefined for retired players.
export const getContractSummary = (
	p: Pick<PlayerWithoutKey, "contractDemand" | "contracts" | "tid">,
): FlatContractInfo | undefined => {
	if (p.contractDemand) {
		return p.contractDemand;
	}

	const contract = getCurrentContract(p);
	if (contract) {
		return contractToSummary(contract);
	}
};

// Like getContractSummary, but for a player with no current contract or contract demand (like a retired player), his last contract. For showing a player's contract.
export const getLatestContractSummary = (
	p: Pick<PlayerWithoutKey, "contractDemand" | "contracts" | "tid">,
) => {
	const summary = getContractSummary(p);
	if (summary) {
		return summary;
	}

	const lastContract = p.contracts.at(-1);
	if (lastContract) {
		return contractToSummary(lastContract);
	}
};

// Like getContractSummary, but throws if there is none. Use this for players who always have one, like players on a team or free agents.
export const getContractSummaryOrThrow = (
	p: Pick<
		PlayerWithoutKey,
		"contractDemand" | "contracts" | "firstName" | "lastName" | "pid" | "tid"
	>,
) => {
	const summary = getContractSummary(p);
	if (!summary) {
		throw new Error(
			`No contract or contract demand for ${p.firstName} ${p.lastName} (pid ${p.pid})`,
		);
	}
	return summary;
};

// For players who always have a contract demand, like free agents and draft prospects
export const getContractDemand = (
	p: Pick<
		PlayerWithoutKey,
		"contractDemand" | "firstName" | "lastName" | "pid"
	>,
) => {
	if (!p.contractDemand) {
		throw new Error(
			`No contract demand for ${p.firstName} ${p.lastName} (pid ${p.pid})`,
		);
	}
	return p.contractDemand;
};

// When a player with a contract becomes a free agent, his contract demand starts from his current contract. Then normalizeContractDemands figures out what he actually asks for. Call this before changing p.tid, so his current contract can be found.
export const setContractDemandFromCurrentContract = (
	p: Pick<PlayerWithoutKey, "contractDemand" | "contracts" | "tid">,
) => {
	if (p.contractDemand) {
		return;
	}

	const contract = getCurrentContract(p);
	if (contract) {
		const { amount, exp } = contractToSummary(contract);
		p.contractDemand = { amount, exp };
	} else {
		p.contractDemand = {
			amount: g.get("minContract"),
			exp: g.get("season"),
		};
	}
};

// Create a contract from a flat contract (amount and exp), like a contract demand. It starts at the first season that would be paid if it was signed now, unless that is after exp, which happens for an expiring contract created after the season is over (like in a new league).
export const createContract = ({
	contract,
	phase = g.get("phase"),
	start: startInput,
	tid,
	type,
}: {
	contract: FlatContractInfo;
	phase?: Phase;

	// Override the first season, for when the season and phase don't match yet, like during newPhasePreseason
	start?: number;

	tid: number;
	type: ContractType;
}): Contract => {
	if (!Number.isFinite(contract.exp) || !Number.isFinite(contract.amount)) {
		throw new Error(`Invalid contract: ${JSON.stringify(contract)}`);
	}

	const start = Math.min(startInput ?? getContractStartSeason(), contract.exp);
	const amounts = [];
	for (let season = start; season <= contract.exp; season++) {
		amounts.push(contract.amount);
	}

	return {
		type,
		signed: {
			season: g.get("season"),
			phase,
			tid,
		},
		start,
		amounts,
		payments: [],
	};
};

// Add a new contract for a player, replacing his contract demand
export const addContract = (
	p: Pick<PlayerWithoutKey, "contractDemand" | "contracts">,
	contract: Contract,
) => {
	delete p.contractDemand;
	p.contracts.push(contract);
};

// End a player's current contract before it expires, like when he retires or is released
export const endContractEarly = (
	p: Pick<PlayerWithoutKey, "contracts" | "owedByTids" | "tid">,
	endedEarly: ContractEndedEarly,
) => {
	const contract = getCurrentContract(p);
	if (!contract) {
		return;
	}

	// Already fully paid, so it didn't end early
	if (getContractExp(contract) < getContractStartSeason()) {
		return;
	}

	contract.endedEarly = endedEarly;
	updateOwedByTids(p);
};

// Pay one game's worth of salary for every contract a team owes: its players' current contracts, and contracts of players it released. Returns the total paid.
export const payContracts = async (tid: number) => {
	const season = g.get("season");
	const numGames = g.get("numGames");

	const toPay: { p: Player; contract: Contract }[] = [];
	for (const p of await idb.cache.players.indexGetAll("playersByTid", tid)) {
		const contract = getCurrentContract(p);
		if (contract) {
			toPay.push({ p, contract });
		}
	}
	toPay.push(...(await getOwedContracts(tid)));

	let total = 0;
	for (const { contract } of toPay) {
		const amount = getPayrollAmount(contract) / numGames;
		total += amount;

		let payment = contract.payments.find(
			(row) => row.season === season && row.tid === tid,
		);
		if (!payment) {
			payment = {
				season,
				tid,
				amount: 0,
			};
			contract.payments.push(payment);
		}
		payment.amount += amount;
	}
	await idb.cache.players.putAll(new Set(toPay.map(({ p }) => p)));

	return total;
};
