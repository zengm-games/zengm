import { PHASE, PLAYER } from "../../../common/constants.ts";
import type {
	Contract,
	Phase,
	FlatContractInfo,
} from "../../../common/types.ts";
import { helpers } from "../../util/index.ts";
import { averageSalary } from "./averageSalary.ts";
import type { Basketball } from "./loadData.basketball.ts";

type SalaryRow = Basketball["salaries"][string][number];

// Contracts can't be longer than this many seasons, counting the current one
const MAX_CURRENT_CONTRACT_SEASONS = 5;

const toAmount = (amount: number) => helpers.roundContract(amount / 1000);

// Seasons before the current one were paid. The team that paid is estimated later from stats, in estimatePaymentTeams.
const getPayments = (
	start: number,
	amounts: number[],
	season: number,
	phase: Phase,
) => {
	const payments: Contract["payments"] = [];
	for (const [i, amount] of amounts.entries()) {
		const s = start + i;
		if (s < season || (s === season && phase > PHASE.PLAYOFFS)) {
			payments.push({
				season: s,
				tid: PLAYER.DOES_NOT_EXIST,
				amount,
			});
		}
	}
	return payments;
};

// Real contract data has exact amounts for each season, and extensions that start after the current contract. An extension is added to the current contract, since in the game a player only has one contract at a time.
export const getRealContracts = ({
	draftYear,
	includePastContracts,
	onTeam,
	phase,
	salaryRows: salaryRowsInput,
	season,
	useExtensions,
}: {
	draftYear: number;

	// Seasons of contracts before the current season: contracts that ended before then, seasons of the current contract before then, and the paid part of a released free agent's contract. Without stats, there's no way to tell which team paid them.
	includePastContracts: boolean;

	onTeam: boolean;
	phase: Phase;
	salaryRows: SalaryRow[];
	season: number;

	// Extensions are only known for the latest season of real data. For past seasons, nobody knew about future extensions.
	useExtensions: boolean;
}): {
	contracts: Contract[];
	contractDemand: FlatContractInfo | undefined;
} => {
	// These can be out of order, particularly due to merging data sources
	const salaryRows = salaryRowsInput
		.filter((row) => useExtensions || row.start <= season)
		.toSorted((a, b) => a.start - b.start);

	const currentRow = salaryRows.findLast(
		(row) => row.start <= season && row.exp >= season,
	);

	const contracts: Contract[] = [];
	let contractDemand: FlatContractInfo | undefined;

	// Past contracts, only the seasons before the current season
	for (const row of salaryRows) {
		if (!includePastContracts || row === currentRow || row.start >= season) {
			continue;
		}

		const amounts = row.amounts
			.slice(0, season - row.start)
			.map((amount) => toAmount(amount));
		if (amounts.length === 0) {
			continue;
		}

		contracts.push({
			type: row.start === draftYear + 1 ? "rookie" : "unknown",
			start: row.start,
			amounts,
			payments: getPayments(row.start, amounts, season, phase),
		});
	}

	const firstRow = currentRow ?? salaryRows.find((row) => row.start > season);
	if (firstRow) {
		let amounts = firstRow.amounts.map((amount) => toAmount(amount));
		let extended = false;

		if (useExtensions) {
			for (const row of salaryRows) {
				const exp = firstRow.start + amounts.length - 1;
				if (row.start === exp + 1) {
					amounts.push(...row.amounts.map((amount) => toAmount(amount)));
					extended = true;
				}
			}
		}

		// Only keep a limited number of seasons in the future
		const maxExp = season + MAX_CURRENT_CONTRACT_SEASONS - 1;
		amounts = amounts.slice(0, maxExp - firstRow.start + 1);
		const exp = firstRow.start + amounts.length - 1;

		if (onTeam) {
			// A rookie contract with an extension is not just a rookie contract anymore
			const rookie = firstRow.start === draftYear + 1 && !extended;

			// Without past contracts, the seasons of this contract before the current season are left out too
			const start = includePastContracts
				? firstRow.start
				: Math.max(firstRow.start, season);
			const currentAmounts = amounts.slice(start - firstRow.start);
			contracts.push({
				type: rookie ? "rookie" : "unknown",
				start,
				amounts: currentAmounts,
				payments: getPayments(start, currentAmounts, season, phase),
			});
		} else {
			// A free agent with a contract in the data was released, but the team that released him isn't known. So he asks for the rest of that contract. The part that was already paid is kept as a past contract, which includes the current season after the playoffs.
			const numPaidSeasons =
				season - firstRow.start + (phase > PHASE.PLAYOFFS ? 1 : 0);
			if (includePastContracts && numPaidSeasons > 0) {
				const paidAmounts = amounts.slice(0, numPaidSeasons);
				contracts.push({
					type: "unknown",
					start: firstRow.start,
					amounts: paidAmounts,
					payments: getPayments(firstRow.start, paidAmounts, season, phase),
				});
			}
			if (exp >= season) {
				contractDemand = {
					amount: averageSalary(firstRow, season, exp),
					exp,
				};
			}
		}
	}

	return {
		contracts,
		contractDemand,
	};
};
