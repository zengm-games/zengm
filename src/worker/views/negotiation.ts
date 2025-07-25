import { PHASE } from "../../common/index.ts";
import { contractNegotiation, player, team } from "../core/index.ts";
import { idb } from "../db/index.ts";
import { g, helpers } from "../util/index.ts";
import type {
	ViewInput,
	PlayerContract,
	UpdateEvents,
} from "../../common/types.ts";
import { range } from "../../common/utils.ts";

const generateContractOptions = async (
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
		const disabledReason = await contractNegotiation.accept({
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

const updateNegotiation = async (
	inputs: ViewInput<"negotiation">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (
		updateEvents.includes("firstRun") ||
		!state.p ||
		(state.p && inputs.pid !== state.p.pid) ||
		updateEvents.includes("gameSim") ||
		updateEvents.includes("newPhase")
	) {
		const userTid = g.get("userTid");

		const negotiations = await idb.cache.negotiations.getAll();
		let negotiation;

		if (inputs.pid === undefined) {
			negotiation = negotiations[0];
		} else {
			negotiation = negotiations.find((neg) => neg.pid === inputs.pid);
		}

		if (!negotiation) {
			// https://stackoverflow.com/a/59923262/786644
			const returnValue = {
				errorMessage: "No negotiation with player in progress.",
			};
			return returnValue;
		}

		const p2 = await idb.cache.players.get(negotiation.pid);
		let p;
		if (p2) {
			p = await idb.getCopy.playersPlus(p2, {
				attrs: ["pid", "name", "age", "contract", "face", "imgURL"],
				ratings: ["ovr", "pot"],
				season: g.get("season"),
				showNoStats: true,
				showRookies: true,
				fuzz: true,
			});
		}

		// This can happen if a negotiation is somehow started with a retired player, or a player was deleted
		if (!p || !p2) {
			contractNegotiation.cancel(negotiation.pid);
			// https://stackoverflow.com/a/59923262/786644
			const returnValue = {
				errorMessage: "Invalid negotiation. Please try again.",
			};
			return returnValue;
		}

		p.mood = await player.moodInfos(p2);

		const contractOptions = await generateContractOptions(
			negotiation.pid,
			{
				amount: p.mood.user.contractAmount / 1000,
				exp: p.contract.exp,
			},
			p.ratings.ovr,
		);
		if (
			contractOptions.length === 0 &&
			g.get("phase") === PHASE.RESIGN_PLAYERS
		) {
			const t = await idb.cache.teams.get(userTid);
			if (
				t &&
				t.firstSeasonAfterExpansion !== undefined &&
				t.firstSeasonAfterExpansion - 1 === g.get("season")
			) {
				contractOptions.push({
					exp: g.get("season") + 1,
					years: 1,
					amount: p.mood.user.contractAmount / 1000,
					smallestAmount: true,
				});
			}
		}

		const payroll = await team.getPayroll(userTid);

		const t = await idb.getCopy.teamsPlus({
			tid: g.get("userTid"),
			attrs: ["colors", "jersey"],
		});
		if (!t) {
			throw new Error("Should never happen");
		}

		return {
			capSpace: (g.get("salaryCap") - payroll) / 1000,
			challengeNoRatings: g.get("challengeNoRatings"),
			contractOptions,
			salaryCapType: g.get("salaryCapType"),
			payroll: payroll / 1000,
			p,
			phase: g.get("phase"),
			resigning: negotiation.resigning,
			salaryCap: g.get("salaryCap") / 1000,
			t,
		};
	}
};

export default updateNegotiation;
