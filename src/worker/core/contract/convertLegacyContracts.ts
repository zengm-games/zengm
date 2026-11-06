import { PHASE, PLAYER } from "../../../common/constants.ts";
import {
	getContractExp,
	getCurrentContract,
} from "../../../common/contracts.ts";
import type {
	ContractEndedEarly,
	Contract,
	ContractType,
	LegacyPlayerContractInfo,
	Phase,
	FlatContractInfo,
} from "../../../common/types.ts";

// Before league DB version 75, a player's contract (or contract demand) was in p.contract, a log of salaries by season was in p.salaries, and contracts still owed to released players were in the releasedPlayers store. This converts that to the current format: contracts in p.contracts, and contract demands in p.contractDemand.
//
// Some info was lost in the old format, so this is a best guess. Adjacent contracts with the same amount look like one contract unless an event says otherwise, and the team that paid each season is unknown.

export type LegacyPlayer = {
	draft: {
		round: number;
		tid: number;
		year: number;
	};
	diedYear?: number;
	retiredYear: number;
	tid: number;
} & LegacyPlayerContractInfo &
	Partial<PayerInfo>;

// What's known about which teams a player was on, to estimate who paid his salary
type PayerInfo = {
	stats: {
		season: number;
		tid: number;
		playoffs: boolean;
		gp?: number;
	}[];
	transactions: {
		season: number;
		phase: Phase;
		tid: number;
	}[];
};

// From the old releasedPlayers store
export type LegacyReleasedPlayer = {
	pid: number;
	tid: number;
	contract: {
		amount: number;
		exp: number;
	};
};

// What's known about a signing, from a "freeAgent" or "reSigned" event
export type SigningEventInfo = {
	eid: number;
	type: "freeAgent" | "reSigned";
	season: number;
	phase: Phase | undefined;
	tid: number;
	amount: number;
	exp: number;
};

// When and by which team a contract was signed, for estimating who paid it
type Signing = {
	season: number;
	phase: Phase;
	tid: number;
};

// What's known about a release, from a "release" event
export type ReleaseEventInfo = {
	season: number;
	phase: Phase | undefined;
	tid: number;
};

type LeagueState = {
	// How much of the current season's salaries have been paid, from 0 to 1. Only used during the regular season.
	fractionCurrentSeasonPaid: number;

	phase: Phase;
	season: number;
};

type Segment = {
	start: number;
	exp: number;
	amount: number;
	current?: true;
	signingEvent?: SigningEventInfo;
};

// Group salary rows into contracts. Rows were added in the order contracts were signed, so a contract ends when the next row is not the next season or has a different amount, or at the expiration of a known contract.
const getSegments = (
	salaries: NonNullable<LegacyPlayerContractInfo["salaries"]>,
	knownContracts: { amount: number; exp: number }[],
) => {
	const segments: Segment[] = [];
	let current: Segment | undefined;

	for (const row of salaries) {
		if (
			current &&
			row.season === current.exp + 1 &&
			row.amount === current.amount &&
			!knownContracts.some(
				(contract) =>
					contract.exp === current!.exp && contract.amount === current!.amount,
			)
		) {
			current.exp = row.season;
		} else {
			current = {
				start: row.season,
				exp: row.season,
				amount: row.amount,
			};
			segments.push(current);
		}
	}

	return segments;
};

// The first season that could be in a current contract. During the playoffs, the current season is already fully paid, so it does not matter which season this is.
const getFirstCurrentSeason = ({ phase, season }: LeagueState) => {
	return phase > PHASE.PLAYOFFS ? season + 1 : season;
};

// Estimate which teams paid one season of a contract, as weights that add up to 1. Returns undefined if unknown.
const estimatePayers = ({
	contract,
	currentTid,
	payerInfo,
	season,
	signing,
}: {
	contract: Pick<Contract, "endedEarly">;

	// Team that is paying this contract now, if it's the player's current contract
	currentTid: number | undefined;

	payerInfo: PayerInfo;
	season: number;
	signing: Signing | undefined;
}): { tid: number; weight: number }[] | undefined => {
	const { endedEarly } = contract;

	// After a player is released, the team that released him pays the rest of his contract. Assume that team paid all of the season he was released in too.
	if (
		endedEarly?.reason === "released" &&
		endedEarly.tid !== undefined &&
		season >= endedEarly.season
	) {
		return [{ tid: endedEarly.tid, weight: 1 }];
	}

	// Split the season between his teams by games played
	let rows = payerInfo.stats.filter(
		(row) => !row.playoffs && row.season === season && row.tid >= 0,
	);

	// A contract signed during the season was only paid by the team that signed him, and any teams he was traded to after that
	if (
		signing &&
		signing.season === season &&
		signing.phase >= PHASE.REGULAR_SEASON &&
		signing.phase <= PHASE.PLAYOFFS
	) {
		const i = rows.findLastIndex((row) => row.tid === signing.tid);
		if (i >= 0) {
			rows = rows.slice(i);
		}
	}

	if (rows.length > 0) {
		const gpByTid = new Map<number, number>();
		for (const row of rows) {
			gpByTid.set(row.tid, (gpByTid.get(row.tid) ?? 0) + (row.gp ?? 0));
		}
		let totalGp = 0;
		for (const gp of gpByTid.values()) {
			totalGp += gp;
		}

		// If he didn't play any games, split it evenly
		return Array.from(gpByTid, ([tid, gp]) => ({
			tid,
			weight: totalGp > 0 ? gp / totalGp : 1 / gpByTid.size,
		})).filter((payer) => payer.weight > 0);
	}

	// No stats, like if the season just started. Then it's whatever team he's on now, or the team he most recently joined.
	if (currentTid !== undefined) {
		return [{ tid: currentTid, weight: 1 }];
	}

	const transaction = payerInfo.transactions.findLast(
		(row) =>
			row.tid >= 0 &&
			(row.season < season ||
				(row.season === season && row.phase <= PHASE.PLAYOFFS)),
	);
	if (transaction) {
		return [{ tid: transaction.tid, weight: 1 }];
	}
};

// Payments from before contracts were tracked don't know which team paid them. This estimates it from the player's stats and transactions, replacing payments with an unknown team.
export const estimatePaymentTeams = ({
	contracts,
	currentTid,
	payerInfo,
	signings,
}: {
	contracts: Contract[];

	// Team the player is on now, or undefined if he's not on a team
	currentTid: number | undefined;

	payerInfo: PayerInfo;

	// Only for contracts whose signing is known, which is only when converting from the legacy format with events
	signings?: Map<Contract, Signing>;
}) => {
	const currentContract =
		currentTid !== undefined
			? getCurrentContract({ contracts, tid: currentTid })
			: undefined;

	for (const contract of contracts) {
		const payments: Contract["payments"] = [];
		for (const payment of contract.payments) {
			if (payment.tid !== PLAYER.DOES_NOT_EXIST) {
				payments.push(payment);
				continue;
			}

			const payers = estimatePayers({
				contract,
				currentTid: contract === currentContract ? currentTid : undefined,
				payerInfo,
				season: payment.season,
				signing: signings?.get(contract),
			});
			if (!payers) {
				payments.push(payment);
				continue;
			}

			for (const { tid, weight } of payers) {
				payments.push({
					season: payment.season,
					tid,
					amount: payment.amount * weight,
				});
			}
		}
		contract.payments = payments;
	}
};

// Assume each season was paid in full, except for the current season if it's in progress. The team that paid is estimated later, in estimatePaymentTeams.
const getPayments = (
	segment: Pick<Segment, "amount" | "exp" | "start">,
	endedEarly: ContractEndedEarly | undefined,
	{ fractionCurrentSeasonPaid, phase, season }: LeagueState,
) => {
	const payments: Contract["payments"] = [];
	for (let s = segment.start; s <= segment.exp; s++) {
		if (
			endedEarly &&
			endedEarly.reason !== "released" &&
			s > endedEarly.season
		) {
			break;
		}

		let fractionPaid;
		if (s < season || (s === season && phase > PHASE.PLAYOFFS)) {
			fractionPaid = 1;
		} else if (s === season && phase >= PHASE.REGULAR_SEASON) {
			fractionPaid = fractionCurrentSeasonPaid;
		} else {
			fractionPaid = 0;
		}

		if (fractionPaid > 0) {
			payments.push({
				season: s,
				tid: PLAYER.DOES_NOT_EXIST,
				amount: segment.amount * fractionPaid,
			});
		}
	}

	return payments;
};

const getAmounts = (segment: Pick<Segment, "amount" | "exp" | "start">) => {
	const amounts = [];
	for (let s = segment.start; s <= segment.exp; s++) {
		amounts.push(segment.amount);
	}
	return amounts;
};

// Mark contracts that are owed to teams that released the player, from the old releasedPlayers store. This is separate from convertLegacyContracts because in a league file, releasedPlayers is separate from players. If the player is on a team, his current contract can't be a released contract.
export const applyLegacyReleasedPlayers = ({
	contracts,
	leagueState,
	releasedPlayers,
	releaseEvents,
	tid,
}: {
	contracts: Contract[];
	leagueState: LeagueState;
	releasedPlayers: LegacyReleasedPlayer[];
	releaseEvents: ReleaseEventInfo[];
	tid: number;
}) => {
	const currentContract = getCurrentContract({ contracts, tid });

	for (const releasedPlayer of releasedPlayers) {
		const { amount, exp } = releasedPlayer.contract;

		const getEndedEarly = (start: number): ContractEndedEarly => {
			const releaseEvent = releaseEvents.findLast(
				(event) =>
					event.tid === releasedPlayer.tid &&
					event.season >= start - 1 &&
					event.season <= exp,
			);

			return {
				season: releaseEvent?.season ?? leagueState.season,
				phase: releaseEvent?.phase ?? leagueState.phase,
				reason: "released",
				tid: releasedPlayer.tid,
			};
		};

		// If he retired after he was released, the release is what matters, because that team still owes the contract
		const contract = contracts.findLast(
			(contract) =>
				contract !== currentContract &&
				contract.endedEarly?.reason !== "released" &&
				getContractExp(contract) === exp &&
				contract.amounts[0] === amount,
		);
		if (contract) {
			contract.endedEarly = getEndedEarly(contract.start);

			// In case it was cut short by retirement before
			contract.payments = getPayments(
				{ start: contract.start, exp, amount },
				contract.endedEarly,
				leagueState,
			);
		} else {
			const segment = {
				start: Math.min(getFirstCurrentSeason(leagueState), exp),
				exp,
				amount,
			};
			const endedEarly = getEndedEarly(segment.start);

			// Before the current contract, which has to stay last
			const index = currentContract
				? contracts.indexOf(currentContract)
				: contracts.length;
			contracts.splice(index, 0, {
				type: "unknown",
				start: segment.start,
				amounts: getAmounts(segment),
				payments: getPayments(segment, endedEarly, leagueState),
				endedEarly,
			});
		}
	}
};

export const convertLegacyContracts = ({
	p,
	leagueState,
	releasedPlayers,
	releaseEvents,
	signingEvents,
}: {
	p: LegacyPlayer;
	leagueState: LeagueState;
	releasedPlayers: LegacyReleasedPlayer[];
	releaseEvents: ReleaseEventInfo[];
	signingEvents: SigningEventInfo[];
}): {
	contracts: Contract[];
	contractDemand: FlatContractInfo | undefined;
} => {
	const { phase, season } = leagueState;
	const legacyContract = p.contract;

	// Not the current contract, because it's the latest one signed, so it's always at the end of the salaries log. If it was used to split segments, an earlier contract that happens to have the same amount in that season would be split too.
	const knownContracts = [
		...releasedPlayers.map((rp) => rp.contract),
		...signingEvents,
	];
	const segments = getSegments(p.salaries ?? [], knownContracts);

	let contractDemand: FlatContractInfo | undefined;
	if (legacyContract) {
		const { rookieResign, temp, ...demand } = legacyContract;
		if (p.tid >= 0) {
			const segment = segments.findLast(
				(segment) =>
					segment.exp === legacyContract.exp &&
					segment.amount === legacyContract.amount,
			);
			if (segment) {
				segment.current = true;
			} else if (
				p.draft.year === season &&
				phase >= PHASE.DRAFT &&
				legacyContract.exp <= season
			) {
				// Unsigned draft pick, still needs to sign a contract
				contractDemand = demand;
			} else {
				segments.push({
					start: Math.min(
						getFirstCurrentSeason(leagueState),
						legacyContract.exp,
					),
					exp: legacyContract.exp,
					amount: legacyContract.amount,
					current: true,
				});
			}
		} else if (p.tid !== PLAYER.RETIRED) {
			// Free agents and draft prospects
			contractDemand = demand;
		}
	}

	const usedSigningEvents = new Set<SigningEventInfo>();
	for (const segment of segments.toReversed()) {
		const signingEvent = signingEvents.findLast(
			(event) =>
				!usedSigningEvents.has(event) &&
				event.exp === segment.exp &&
				event.amount === segment.amount,
		);
		if (signingEvent) {
			usedSigningEvents.add(signingEvent);
			segment.signingEvent = signingEvent;
		}
	}

	// Current contract is last, because that's how getCurrentContract finds it
	segments.sort((a, b) => {
		if (a.current !== b.current) {
			return a.current ? 1 : -1;
		}
		return a.start - b.start;
	});

	// During the re-signing phase, rookieResign marks a player whose expiring contract was a rookie contract
	const expiringRookieContract = legacyContract?.rookieResign
		? segments.findLast((segment) => segment.exp === season)
		: undefined;

	const firstStart = Math.min(...segments.map((segment) => segment.start));

	const signings = new Map<Contract, Signing>();
	const contracts = segments.map((segment) => {
		let type: ContractType = "unknown";
		let signing: Signing | undefined;

		const event = segment.signingEvent;
		if (event) {
			type = event.type === "reSigned" ? "reSign" : "freeAgent";
			signing = {
				season: event.season,
				phase:
					event.phase ??
					(event.season < segment.start
						? PHASE.FREE_AGENCY
						: PHASE.REGULAR_SEASON),
				tid: event.tid,
			};
		}

		const firstContractAfterDraft =
			p.draft.round > 0 &&
			segment.start === firstStart &&
			(segment.start === p.draft.year || segment.start === p.draft.year + 1);
		if (
			firstContractAfterDraft ||
			(segment.current && legacyContract?.rookie) ||
			segment === expiringRookieContract
		) {
			type = "rookie";
		}

		let endedEarly: ContractEndedEarly | undefined;
		if (p.tid === PLAYER.RETIRED && segment.exp > p.retiredYear) {
			const died = p.diedYear !== undefined;
			endedEarly = {
				season: died ? p.diedYear! : p.retiredYear,
				phase: died ? PHASE.REGULAR_SEASON : PHASE.DRAFT_LOTTERY,
				reason: died ? "died" : "retired",
			};
		}

		const contract: Contract = {
			type,
			start: segment.start,
			amounts: getAmounts(segment),
			payments: getPayments(segment, endedEarly, leagueState),
		};
		if (event) {
			contract.eid = event.eid;
		}
		if (signing) {
			signings.set(contract, signing);
		}
		if (endedEarly) {
			contract.endedEarly = endedEarly;
		}
		return contract;
	});

	applyLegacyReleasedPlayers({
		contracts,
		leagueState,
		releasedPlayers,
		releaseEvents,
		tid: p.tid,
	});

	estimatePaymentTeams({
		contracts,
		currentTid: p.tid >= 0 ? p.tid : undefined,
		payerInfo: {
			stats: p.stats ?? [],
			transactions: p.transactions ?? [],
		},
		signings,
	});

	return {
		contracts,
		contractDemand,
	};
};
