import { idb } from "../../db";
import { PLAYER } from "../../../common";
import { team } from "..";
import { g, helpers, random } from "../../util";

const TEMP = 0.35;
const LEARNING_RATE = 0.5;
const ROUNDS = 60;

const stableSoftmax = (x: number[]) => {
	const maxX = Math.max(...x);
	const z = x.map(xx => xx - maxX);
	const numerators = z.map(zz => Math.exp(zz));
	const denominator = numerators.reduce((sum, value) => sum + value, 0);
	return numerators.map(numerator => numerator / denominator);
};

// "includeExpiringContracts" - use this at the start of re-signing phase
// "freeAgentsOnly" - use this at the start of free agency phase
// "dummyExpiringContracts" - use this at beginning of regular season
const normalizeContractDemands = async ({
	type,
	pids,
}: {
	type:
		| "freeAgentsOnly"
		| "includeExpiringContracts"
		| "dummyExpiringContracts";
	pids?: number[];
}) => {
	const maxContract = g.get("maxContract");
	const minContract = g.get("minContract");
	const salaryCap = g.get("salaryCap");
	const season = g.get("season");

	// Lower number results in higher bids (more players being selected, and therefore having increases) but seems to be too much in hypothetical FAs (everything except freeAgentsOnly) because we don't know that all these players are actually going to be available
	const NUM_BIDS_BEFORE_REMOVED = 2;

	const playersAll = await idb.cache.players.getAll();
	let players;
	if (type === "freeAgentsOnly") {
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
			// basically ws/48 prediction from OVR
			value: p.value ** 2,
			contractAmount: p.contract.amount,
			p,
		};
	});

	const teams = (await idb.cache.teams.getAll())
		.filter(t => !t.disabled)
		.map(t => ({
			...t,
			payroll: 0,
		}));
	for (const t of teams) {
		const contracts = (await team.getContracts(t.tid)).filter(contract => {
			if (type === "freeAgentsOnly") {
				return true;
			}

			return contract.exp > season;
		});
		t.payroll = await team.getPayroll(contracts);
	}

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
			const selectedPlayers = new Set();
			while (capSpace > 0) {
				const validPlayers = playerInfos.filter(
					p =>
						p.contractAmount <= capSpace &&
						!selectedPlayers.has(p) &&
						(bids.get(p.pid) || 0) < NUM_BIDS_BEFORE_REMOVED,
				);
				if (validPlayers.length > 0) {
					const probs = stableSoftmax(validPlayers.map(p => p.value * TEMP));
					const p = random.choice(validPlayers, probs);
					selectedPlayers.add(p);

					bids.set(p.pid, (bids.get(p.pid) || 0) + 1);
					capSpace -= p.contractAmount;
				} else {
					break;
				}
			}
		}

		// Players adjust expectations
		for (const p of playerInfos) {
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

	const changes: any[] = [];
	for (const info of playerInfos) {
		if (updatedPIDs.has(info.pid) && !info.dummy) {
			const p = info.p;

			p.contract.exp = season + random.randInt(0, 3);

			// During regular season, should only look for short contracts that teams will actually sign
			if (type === "dummyExpiringContracts") {
				if (info.contractAmount >= maxContract / 4) {
					p.contract.exp = season;
					info.contractAmount = (info.contractAmount + maxContract / 4) / 2;
				}
			}

			const change: any = {
				pid: p.pid,
				tid: p.tid,
				before: p.contract.amount,
			};

			p.contract.amount = 50 * Math.round(info.contractAmount / 50); // Make it a multiple of 50k

			change.after = p.contract.amount;
			change.diff = change.after - change.before;
			changes.push(change);

			await idb.cache.players.put(p);
		}
	}
	console.table(changes);
};

export default normalizeContractDemands;
