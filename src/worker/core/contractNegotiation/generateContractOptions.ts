import { PHASE } from "../../../common/constants.ts";
import type { PlayerContract } from "../../../common/types.ts";
import { range } from "../../../common/utils.ts";
import g from "../../util/g.ts";
import helpers from "../../util/helpers.ts";
import accept from "./accept.ts";

export const generateContractOptions = async (
	pid: number,
	contract: PlayerContract,
	ovr: number,
) => {
	let growthFactor = 0.15;

	// Modulate contract amounts based on last digit of ovr (add some deterministic noise)
	growthFactor += (ovr % 10) * 0.01 - 0.05;
	let exp = g.get("season");

	if (g.get("phase") <= PHASE.AFTER_TRADE_DEADLINE) {
		exp -= 1;
	}
	let found: number | undefined;

	const allowedLengths = range(
		g.get("minContractLength"),
		g.get("maxContractLength") + 1,
	);

	const contractOptions: {
		exp: number;
		years: number;
		amount: number;
		smallestAmount: boolean;
		disabledReason?: string;
	}[] = allowedLengths.map((contractLength, i) => {
		const contractOption = {
			exp: exp + contractLength,
			years: contractLength,
			amount: 0,
			smallestAmount: false,
		};

		if (contractOption.exp === contract.exp) {
			contractOption.amount = contract.amount;
			contractOption.smallestAmount = true;
			found = i;
		}

		return contractOption;
	});

	if (found === undefined) {
		contractOptions[0]!.amount = contract.amount;
		contractOptions[0]!.smallestAmount = true;
		found = 0;
	}

	// From the desired contract, ask for more money for less or more years
	for (const [i, contractOption] of contractOptions.entries()) {
		const factor = 1 + Math.abs(found - i) * growthFactor;
		contractOption.amount = contractOptions[found]!.amount * factor;
		contractOption.amount =
			helpers.roundContract(contractOption.amount * 1000) / 1000;
	}

	const possible = contractOptions.filter((contractOption) => {
		if (contractOption.smallestAmount) {
			return true;
		}

		if (
			g.get("challengeNoFreeAgents") &&
			g.get("phase") !== PHASE.RESIGN_PLAYERS &&
			contractOption.amount * 1000 > g.get("minContract")
		) {
			return false;
		}

		return contractOption.amount * 1000 <= g.get("maxContract");
	});

	for (const row of possible) {
		const disabledReason = await accept({
			pid,
			amount: Math.round(row.amount * 1000),
			exp: row.exp,
			dryRun: true,
		});
		if (disabledReason !== undefined) {
			row.disabledReason = disabledReason;
		}
	}

	return possible;
};
