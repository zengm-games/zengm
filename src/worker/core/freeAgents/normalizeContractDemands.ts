import { idb } from "../../db/index.ts";
import { PLAYER, PHASE, bySport, isSport } from "../../../common/index.ts";
import { team, player, draft } from "../index.ts";
import { g, helpers, random } from "../../util/index.ts";
import type { Player } from "../../../common/types.ts";
import { TOO_MANY_TEAMS_TOO_SLOW } from "../season/getInitialNumGamesConfDivSettings.ts";
import { orderBy } from "../../../common/utils.ts";

const TEMP = 0.35;
const LEARNING_RATE = 0.5;
const DEFAULT_ROUNDS = 60;

const getExpiration = (
	p: Player,
	randomizeExp: boolean,
	nextSeason?: boolean,
) => {
	const { ovr, pot } = p.ratings.at(-1);

	// pot is predictable via age+ovr with R^2=0.94, so skip it b/c wasn't in data
	const age = g.get("season") - p.born.year;
	let years =
		1 +
		0.001629 * (age * age) -
		0.003661 * (age * ovr) +
		0.002178 * (ovr * ovr) +
		0 * pot;
	years = Math.round(years);

	// Randomize expiration for contracts generated at beginning of new game
	if (randomizeExp) {
		years = random.randInt(1, years);
		years = helpers.bound(years, 1, g.get("maxContractLength"));
	} else {
		years = helpers.bound(
			years,
			g.get("minContractLength"),
			g.get("maxContractLength"),
		);
	}

	let offset = g.get("phase") <= PHASE.PLAYOFFS ? -1 : 0;
	if (nextSeason) {
		// Otherwise the season+phase combo appears off when setting contract expiration in newPhasePreseason
		offset -= 1;
	}

	return g.get("season") + years + offset;
};

const stableSoftmax = (values: number[], param: number) => {
	let maxValue = -Infinity;
	for (const value of values) {
		if (value > maxValue) {
			maxValue = value;
		}
	}

	const numerators = Array(values.length);
	let denominator = 0;
	for (const [i, value] of values.entries()) {
		// Divide rather than subtract, because sometimes maxX was so large that this was getting rounded to 0
		numerators[i] = Math.exp((param * value) / maxValue);
		denominator += numerators[i];
	}

	if (maxValue === 0 || denominator === 0) {
		return numerators.map(() => 1);
	}
	return numerators.map((numerator) => numerator / denominator);
};

// "includeExpiringContracts" - use this at the start of re-signing phase
// "freeAgentsOnly" - use this at the start of free agency phase
// "dummyExpiringContracts" - use this at beginning of regular season, or during season (like when releasing a player)
const normalizeContractDemands = async ({
	type,
	pids,
	nextSeason,
}: {
	type:
		| "newLeague"
		| "freeAgentsOnly"
		| "includeExpiringContracts"
		| "dummyExpiringContracts";
	pids?: number[];
	nextSeason?: boolean;
}) => {
	if (pids && pids.length === 0) {
		return;
	}

	// Higher means more unequal salaries
	const PARAM = bySport({
		baseball: 1,
		basketball: 0.5 * (type === "newLeague" ? 5 : 15),
		football: 1,
		hockey: 2.5,
	});

	const maxContract = g.get("maxContract");
	const minContract = g.get("minContract");
	const salaryCap = g.get("salaryCap");
	const season = g.get("season");

	let numRounds = DEFAULT_ROUNDS;

	// 0 for FBGM because we don't actually do bidding there, it had too much variance. Instead, use the old genContract formula. Same if minContract and maxContract are the same, no point in doing auction.
	if (
		bySport({
			baseball: true,
			basketball: false,
			football: true,

			// For hockey, we want the fast method (numRounds 0) for any in-season free agents created by releasing players. For basketball (due to fewer players) this optimization is not needed.
			hockey: type === "dummyExpiringContracts" && pids !== undefined,
		}) ||
		minContract === maxContract ||
		g.get("numActiveTeams") >= TOO_MANY_TEAMS_TOO_SLOW
	) {
		numRounds = 0;
	}

	// Lower number results in higher bids (more players being selected, and therefore having increases) but seems to be too much in hypothetical FAs (everything except freeAgentsOnly) because we don't know that all these players are actually going to be available
	const NUM_BIDS_BEFORE_REMOVED = 2;

	const playersAll = await idb.cache.players.indexGetAll("playersByTid", [
		PLAYER.FREE_AGENT,
		Infinity,
	]);
	let players;
	if (type === "newLeague") {
		players = playersAll;
	} else if (type === "freeAgentsOnly") {
		players = playersAll.filter((p) => p.tid === PLAYER.FREE_AGENT);
	} else {
		players = playersAll.filter(
			(p) => p.tid === PLAYER.FREE_AGENT || p.contract.exp === season,
		);
	}

	// Store contracts here, so they can be edited without editing player object (for including dummy players in pool)
	const playerInfos = players.map((p) => {
		let dummy = false;
		if (pids) {
			dummy = !pids.includes(p.pid);
		} else if (
			type === "dummyExpiringContracts" &&
			p.tid !== PLAYER.FREE_AGENT
		) {
			dummy = true;
		}

		return {
			pid: p.pid,
			dummy,
			value: (p.value < 0 ? -1 : 1) * p.value ** 2,
			contractAmount: helpers.bound(
				p.contract.amount,
				minContract,
				maxContract,
			),
			p,
		};
	});

	let playerInfosCurrent: typeof playerInfos;
	if (type === "newLeague") {
		// For performance, especially for FBGM, just assume the bottom X% of the league will be min contracts
		const cutoff = Math.round(0.75 * playerInfos.length);
		const ordered = orderBy(playerInfos, "value", "desc");
		playerInfosCurrent = ordered.slice(0, cutoff);
	} else {
		playerInfosCurrent = playerInfos;
	}

	const teams = (await idb.cache.teams.getAll())
		.filter((t) => !t.disabled)
		.map((t) => ({
			...t,
			payroll: 0,
		}));
	for (const t of teams) {
		const contracts = (await team.getContracts(t.tid)).filter((contract) => {
			if (pids && pids.includes(contract.pid)) {
				return false;
			}

			if (type === "newLeague" || type === "freeAgentsOnly") {
				return true;
			}

			return contract.exp > season;
		});
		t.payroll = await team.getPayroll(contracts);
	}

	//console.time("foo");
	const updatedPIDs = new Set<number>();
	const randTeams = [...teams];
	for (let i = 0; i < numRounds; i++) {
		const OFFSET = LEARNING_RATE * (1 / (1 + i / numRounds) ** 4);
		const SCALE_UP = 1.0 + OFFSET;
		const SCALE_DOWN = 1.0 - OFFSET;

		const bids = new Map<number, number>();
		random.shuffle(randTeams);
		for (const t of randTeams) {
			let capSpace = salaryCap - t.payroll;
			if (type === "newLeague") {
				if (g.get("salaryCapType") !== "hard") {
					// Simulating that teams could have gone over the cap to sign players with bird rights
					capSpace += salaryCap;
				} else {
					// Not sure why lol
					capSpace += 0.5 * salaryCap;
				}
			}

			const availablePlayers = new Set(
				playerInfosCurrent.filter(
					(p) =>
						p.contractAmount <= capSpace &&
						(bids.get(p.pid) ?? 0) < NUM_BIDS_BEFORE_REMOVED,
				),
			);
			while (capSpace > minContract && availablePlayers.size > 0) {
				const availablePlayersArray = Array.from(availablePlayers);
				const probs = stableSoftmax(
					availablePlayersArray.map((p) => p.value * TEMP),
					PARAM,
				);
				const p = random.choice(availablePlayersArray, probs);
				availablePlayers.delete(p);

				bids.set(p.pid, (bids.get(p.pid) ?? 0) + 1);
				capSpace -= p.contractAmount;
				if (capSpace > minContract) {
					for (const p of availablePlayers) {
						if (p.contractAmount > capSpace) {
							availablePlayers.delete(p);
						}
					}
				}
			}
		}

		// Players adjust expectations
		for (const p of playerInfosCurrent) {
			const playerBids = bids.get(p.pid);
			if (playerBids === undefined) {
				// Got 0 bids - decrease demands
				if (p.contractAmount >= minContract) {
					p.contractAmount = helpers.bound(
						p.contractAmount * SCALE_DOWN,
						minContract,
						maxContract,
					);
					updatedPIDs.add(p.pid);
				}
			} else if (playerBids > 1) {
				// Got multiple bids - increase demands
				if (p.contractAmount <= maxContract) {
					p.contractAmount = helpers.bound(
						p.contractAmount * SCALE_UP,
						minContract,
						maxContract,
					);
					updatedPIDs.add(p.pid);
				}
			}
		}
	}
	//console.timeEnd("foo");

	// See selectPlayer.ts - for hard cap, players are not auto signed, so special logic here
	let rookieSalaries;
	if (g.get("draftPickAutoContract") && g.get("salaryCapType") === "hard") {
		rookieSalaries = draft.getRookieSalaries();
	}

	const playerInfosToUpdate = playerInfos.filter((info) => {
		return (
			(type === "freeAgentsOnly" ||
				type === "newLeague" ||
				numRounds === 0 ||
				updatedPIDs.has(info.pid)) &&
			!info.dummy
		);
	});

	// Set contract amounts to final values, especially for numRounds=0
	for (const info of playerInfosToUpdate) {
		const p = info.p;
		if (rookieSalaries && p.draft.year === season) {
			const pickIndex =
				(p.draft.round - 1) * g.get("numActiveTeams") + p.draft.pick - 1;
			info.contractAmount = rookieSalaries[pickIndex] ?? rookieSalaries.at(-1)!;
		} else if (numRounds === 0) {
			info.contractAmount = player.genContract(p, type === "newLeague").amount;
		} else if (type === "newLeague") {
			info.contractAmount *= random.uniform(0.4, 1.1);
		}
	}
	if (
		isSport("football") &&
		numRounds === 0 &&
		type === "freeAgentsOnly" &&
		maxContract !== minContract
	) {
		let totalCapSpace = 0;
		for (const t of teams) {
			totalCapSpace += helpers.bound(salaryCap - t.payroll, 0, Infinity);
		}

		if (totalCapSpace === 0) {
			// No cap space, min contracts for everyone
			for (const info of playerInfosToUpdate) {
				info.contractAmount = minContract;
			}
		} else {
			const playerInfosToUpdateSorted = orderBy(
				playerInfosToUpdate,
				"value",
				"desc",
			);

			let numPlayersOnTeams = 0;
			for (const p of playersAll) {
				if (p.tid >= 0) {
					numPlayersOnTeams += 1;
				}
			}
			const numTotalRosterSpots = teams.length * g.get("maxRosterSize");
			const numOpenRosterSpots = Math.max(
				0,
				numTotalRosterSpots - numPlayersOnTeams,
			);

			// For the top free agents (up to the available number of roster spots), adjust their contract demands up/down based on available cap space. Anyone beyond the available number of roster spots, set to a min contract
			let topPlayersAmountSum = 0;
			let topPlayersCount = 0; // In case there are fewer than roster spots, somehow
			for (const [i, info] of playerInfosToUpdateSorted.entries()) {
				const playerNum = i + 1;

				if (playerNum < numOpenRosterSpots) {
					topPlayersAmountSum += info.contractAmount;
					topPlayersCount += 1;
				} else {
					info.contractAmount = minContract;
				}
			}

			// Adjust contracts of top players - bound is so it's not too crazy, especially in a new league
			const fraction = helpers.bound(
				totalCapSpace / topPlayersAmountSum,
				0.6,
				1.4,
			);
			for (const info of playerInfosToUpdateSorted.slice(0, topPlayersCount)) {
				info.contractAmount =
					minContract +
					(info.contractAmount - minContract) *
						fraction *
						random.uniform(0.75, 1);
				// console.log(`${info.p.firstName} ${info.p.lastName} ${prev} -> ${info.contractAmount}`)
			}
		}
	}

	let offset = g.get("phase") <= PHASE.PLAYOFFS ? -1 : 0;
	if (nextSeason) {
		// Otherwise the season+phase combo appears off when setting contract expiration in newPhasePreseason
		offset -= 1;
	}
	const minNewContractExp =
		g.get("season") + g.get("minContractLength") + offset;

	for (const info of playerInfosToUpdate) {
		const p = info.p;

		const exp =
			rookieSalaries && p.draft.year === season
				? g.get("season") + draft.getRookieContractLength(p.draft.round)
				: getExpiration(p, type === "newLeague", nextSeason);

		let amount = info.contractAmount;

		// HACK - assume within first 3 years it is a rookie contract. Only need to check players with draftPickAutoContract disabled, because otherwise there is other code handling rookie contracts.
		let labelAsRookieContract = rookieSalaries && p.draft.year === season;
		if (
			type === "newLeague" &&
			p.draft.round > 0 &&
			!g.get("draftPickAutoContract")
		) {
			if (g.get("season") <= p.draft.year + 3) {
				labelAsRookieContract = true;

				// Decrease salary by 50%, like in newPhaseResignPlayers
				amount /= 2;
			}
		}

		// During regular season, should only look for short contracts that teams will actually sign
		if (type === "dummyExpiringContracts") {
			if (info.contractAmount >= maxContract / 4) {
				p.contract.exp = season;
				info.contractAmount = (info.contractAmount + maxContract / 4) / 2;
			}
		}

		amount = helpers.bound(
			helpers.roundContract(amount),
			minContract,
			maxContract,
		);

		// Make sure to remove "temp" flag!
		p.contract = {
			amount,
			exp,
		};
		if (p.tid === PLAYER.FREE_AGENT && p.contract.exp < minNewContractExp) {
			p.contract.exp = minNewContractExp;
		}

		if (labelAsRookieContract) {
			p.contract.rookie = true;
		}

		await idb.cache.players.put(p);
	}
};

export default normalizeContractDemands;
