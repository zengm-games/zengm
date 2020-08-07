import { idb } from "../../db";
import { PLAYER, PHASE } from "../../../common";
import { team } from "..";
import { g, helpers, random } from "../../util";
import type { Player } from "../../../common/types";
import orderBy from "lodash/orderBy";

const TEMP = 0.35;
const LEARNING_RATE = 0.5;
const ROUNDS = 60;

const getExpiration = (p: Player, randomizeExp: boolean) => {
	const { ovr, pot } = p.ratings[p.ratings.length - 1];

	// Players with high potentials want short contracts
	const potentialDifference = Math.round((pot - ovr) / 4.0);
	let years = 5 - potentialDifference;

	if (years < 2) {
		years = 2;
	}

	// Bad players can only ask for short deals
	if (p.value < 36) {
		years = 1;
	} else if (p.value < 45) {
		years = 2;
	} else if (p.value < 55) {
		years = 3;
	}

	// Randomize expiration for contracts generated at beginning of new game
	if (randomizeExp) {
		years = random.randInt(1, years);
	}

	return g.get("season") + years - 1;
};

const stableSoftmax = (x: number[], param: number) => {
	let maxX = -Infinity;
	for (let i = 0; i < x.length; i++) {
		if (x[i] > maxX) {
			maxX = x[i];
		}
	}

	const numerators = Array(x.length);
	let denominator = 0;
	for (let i = 0; i < x.length; i++) {
		// Divide rather than subtract, because sometimes maxX was so large that this was getting rounded to 0
		numerators[i] = Math.exp((param * x[i]) / maxX);
		denominator += numerators[i];
	}

	if (maxX === 0 || denominator === 0) {
		return numerators.map(() => 1);
	}
	return numerators.map(numerator => numerator / denominator);
};

// "includeExpiringContracts" - use this at the start of re-signing phase
// "freeAgentsOnly" - use this at the start of free agency phase
// "dummyExpiringContracts" - use this at beginning of regular season, or during season (like when releasing a player)
const normalizeContractDemands = async ({
	type,
	pids,
}: {
	type:
		| "newLeague"
		| "freeAgentsOnly"
		| "includeExpiringContracts"
		| "dummyExpiringContracts";
	pids?: number[];
}) => {
	// Higher means more unequal salaries
	const PARAM = type === "newLeague" ? 5 : 15;

	const maxContract = g.get("maxContract");
	const minContract = g.get("minContract");
	const salaryCap = g.get("salaryCap");
	const season = g.get("season");

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
		players = playersAll.filter(p => p.tid === PLAYER.FREE_AGENT);
	} else {
		players = playersAll.filter(
			p => p.tid === PLAYER.FREE_AGENT || p.contract.exp === season,
		);
	}

	// Store contracts here, so they can be edited without editing player object (for including dummy players in pool)
	const playerInfos = players.map(p => {
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
			contractAmount: p.contract.amount,
			p,
		};
	});

	let playerInfosCurrent: typeof playerInfos;
	if (process.env.SPORT === "football" && type === "newLeague") {
		// For performance, especially for FBGM, just assume the bottom 60% of the league will be min contracts
		const cutoff = Math.round(0.4 * playerInfos.length);
		const ordered = orderBy(playerInfos, "value", "desc");
		playerInfosCurrent = ordered.slice(0, cutoff);
	} else {
		playerInfosCurrent = playerInfos;
	}

	const teams = (await idb.cache.teams.getAll())
		.filter(t => !t.disabled)
		.map(t => ({
			...t,
			payroll: 0,
		}));
	for (const t of teams) {
		const contracts = (await team.getContracts(t.tid)).filter(contract => {
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

	// console.time("foo");
	const updatedPIDs = new Set<number>();
	const randTeams = [...teams];
	for (let i = 0; i < ROUNDS; i++) {
		const OFFSET = LEARNING_RATE * (1 / (1 + i / ROUNDS) ** 4);
		const SCALE_UP = 1.0 + OFFSET;
		const SCALE_DOWN = 1.0 - OFFSET;

		const bids = new Map<number, number>();
		random.shuffle(randTeams);
		for (const t of randTeams) {
			let capSpace = salaryCap - t.payroll;
			if (type === "newLeague") {
				if (!g.get("hardCap")) {
					// Simulating that teams could have gone over the cap to sign players with bird rights
					capSpace += salaryCap;
				} else {
					// Not sure why lol
					capSpace += 0.5 * salaryCap;
				}
			}

			const availablePlayers = new Set(
				playerInfosCurrent.filter(
					p =>
						p.contractAmount <= capSpace &&
						(bids.get(p.pid) || 0) < NUM_BIDS_BEFORE_REMOVED,
				),
			);
			while (capSpace > minContract && availablePlayers.size > 0) {
				const availablePlayersArray = Array.from(availablePlayers);
				const probs = stableSoftmax(
					availablePlayersArray.map(p => p.value * TEMP),
					PARAM,
				);
				const p = random.choice(availablePlayersArray, probs);
				availablePlayers.delete(p);

				bids.set(p.pid, (bids.get(p.pid) || 0) + 1);
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
	// console.timeEnd("foo");

	const afterSeasonOver = g.get("phase") > PHASE.REGULAR_SEASON;
	for (const info of playerInfos) {
		if (
			(type === "freeAgentsOnly" ||
				type === "newLeague" ||
				updatedPIDs.has(info.pid)) &&
			!info.dummy
		) {
			const p = info.p;

			p.contract.exp = getExpiration(p, type === "newLeague");
			if (afterSeasonOver) {
				p.contract.exp += 1;
			}

			// During regular season, should only look for short contracts that teams will actually sign
			if (type === "dummyExpiringContracts") {
				if (info.contractAmount >= maxContract / 4) {
					p.contract.exp = season;
					info.contractAmount = (info.contractAmount + maxContract / 4) / 2;
				}
			}

			if (type === "newLeague") {
				info.contractAmount *= random.uniform(0.4, 1.1);
			}

			p.contract.amount = helpers.bound(
				50 * Math.round(info.contractAmount / 50), // Make it a multiple of 50k
				minContract,
				maxContract,
			);

			await idb.cache.players.put(p);
		}
	}
};

export default normalizeContractDemands;
