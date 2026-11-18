import { getCurrentContract } from "../../../common/contracts.ts";
import type {
	Contract,
	FlatContractInfo,
	Player,
} from "../../../common/types.ts";
import { idb } from "../../db/index.ts";
import { g } from "../../util/index.ts";
import { getContractStartSeason } from "../../util/getContractStartSeason.ts";
import { draft, freeAgents } from "../index.ts";
import {
	addContract,
	contractToSummary,
	createContract,
	endContract,
	getContractDemand,
	getRemainingContractSeasons,
	truncateContractBefore,
} from "./index.ts";

// Cut a contract that is being replaced by a new one starting at startSeason. If startSeason was already partly paid (during the season), the contract keeps that season and ended early, since the new contract covers that season too. If none of the contract is left, it was never paid, so it's removed.
const replaceContractFrom = (
	p: Pick<Player, "contracts">,
	contract: Contract,
	startSeason: number,
) => {
	const paidStartSeason = contract.payments.some(
		(payment) => payment.season === startSeason,
	);
	const keepBefore = paidStartSeason ? startSeason + 1 : startSeason;

	if (truncateContractBefore(contract, keepBefore)) {
		// Only does anything if startSeason is kept, otherwise the rest of the contract was already paid
		endContract(contract, {
			season: g.get("season"),
			phase: g.get("phase"),
		});
	} else {
		p.contracts = p.contracts.filter((row) => row !== contract);
	}
};

// Whether the rest of a contract, from the start of a new contract on, is the same as the new contract
const isSameRemainingContract = (contract: Contract, newContract: Contract) => {
	if (contract.type !== newContract.type) {
		return false;
	}

	const remaining = getRemainingContractSeasons(contract, newContract.start);
	return (
		remaining.start === newContract.start &&
		remaining.amounts.length === newContract.amounts.length &&
		remaining.amounts.every((amount, i) => amount === newContract.amounts[i])
	);
};

// Like in a new league (see createRandomPlayers), with rookie scale contracts, a drafted player whose rookie scale contract would still be running gets one for his draft slot, rather than a contract based on his value. undefined if he doesn't get one.
const getRookieScaleContract = (
	p: Pick<Player, "draft">,
	rookieSalaries: number[] | undefined,
	startSeason: number,
): FlatContractInfo | undefined => {
	if (!rookieSalaries || p.draft.round <= 0) {
		return;
	}

	const exp = p.draft.year + draft.getRookieContractLength(p.draft.round);
	if (exp < startSeason) {
		return;
	}

	return {
		amount: draft.getRookieSalary(p.draft, rookieSalaries),
		exp,
		rookie: true,
	};
};

// Give every player on a team a new contract, like random players in a new league: a rookie scale contract for recent draft picks (see getRookieScaleContract), otherwise a contract based on his value (see normalizeContractDemands). The new contracts start at the first season that isn't fully paid yet, and the old contracts stay in contract history up to then.
export const randomizeContracts = async () => {
	const startSeason = getContractStartSeason();
	const rookieSalaries = g.get("draftPickAutoContract")
		? draft.getRookieSalaries()
		: undefined;

	const playersChanged: Player[] = [];
	const pidsToNormalize: number[] = [];
	for (const p of await idb.cache.players.indexGetAll("playersByTid", [
		0,
		Infinity,
	])) {
		// Players who haven't signed yet, like some draft picks, don't have a contract to randomize
		const contract = getCurrentContract(p);
		if (!contract) {
			continue;
		}

		const rookieScaleContract = getRookieScaleContract(
			p,
			rookieSalaries,
			startSeason,
		);
		if (rookieScaleContract) {
			const newContract = createContract({
				contract: rookieScaleContract,
				type: "rookie",
			});

			// Already on the same rookie contract he would have in a new league. Replacing it with the same thing would just clutter his contract history. But if it's different, like if the rookie scale changed since he was drafted, it's replaced.
			if (isSameRemainingContract(contract, newContract)) {
				continue;
			}

			replaceContractFrom(p, contract, startSeason);
			addContract(p, newContract);
		} else {
			// Like random players in a new league, he gets a contract demand, which is normalized below and then becomes his contract. His current contract is the starting point for that.
			const { amount, exp } = contractToSummary(contract);
			replaceContractFrom(p, contract, startSeason);
			p.contractDemand = { amount, exp };
			pidsToNormalize.push(p.pid);
		}
		playersChanged.push(p);
	}
	await idb.cache.players.putAll(playersChanged);

	await freeAgents.normalizeContractDemands({
		type: "newLeague",
		pids: pidsToNormalize,
	});

	// Re-fetch players, because normalizeContractDemands might have changed some objects
	const pids = new Set(pidsToNormalize);
	const playersNormalized = (
		await idb.cache.players.indexGetAll("playersByTid", [0, Infinity])
	).filter((p) => pids.has(p.pid));

	// A team can still be over the hard cap if its rookie contracts and released players are too much, but there's nothing more that can be done about that here
	await freeAgents.lowerContractDemandsForHardCap(playersNormalized);

	for (const p of playersNormalized) {
		const contractDemand = getContractDemand(p);
		addContract(
			p,
			createContract({
				contract: contractDemand,
				type: contractDemand.rookie ? "rookie" : "unknown",
			}),
		);
	}
	await idb.cache.players.putAll(playersNormalized);
};
