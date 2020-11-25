import orderBy from "lodash/orderBy";
import { PHASE, PLAYER, POSITION_COUNTS } from "../../../common";
import {
	contractNegotiation,
	draft,
	league,
	player,
	team,
	freeAgents,
} from "..";
import { idb } from "../../db";
import { g, helpers, local, logEvent } from "../../util";
import type { Conditions, PhaseReturn } from "../../../common/types";

const newPhaseResignPlayers = async (
	conditions: Conditions,
): Promise<PhaseReturn> => {
	await idb.cache.negotiations.clear();

	// Reset contract demands of current free agents and undrafted players
	// KeyRange only works because PLAYER.UNDRAFTED is -2 and PLAYER.FREE_AGENT is -1
	const existingFreeAgents = await idb.cache.players.indexGetAll(
		"playersByTid",
		PLAYER.FREE_AGENT,
	);
	const undraftedPlayers = (
		await idb.cache.players.indexGetAll("playersByDraftYearRetiredYear", [
			[g.get("season")],
			[g.get("season"), Infinity],
		])
	).filter(p => p.tid === PLAYER.UNDRAFTED);

	for (const p of [...existingFreeAgents, ...undraftedPlayers]) {
		player.addToFreeAgents(p);
		await idb.cache.players.put(p);
	}

	// Re-sign players on user's team, and some AI players
	const players = await idb.cache.players.indexGetAll("playersByTid", [
		0,
		Infinity,
	]);

	// Figure out how many players are needed at each position, beyond who is already signed
	type PositionInfo = Record<
		string,
		{
			count: number;
			maxValue: number;
		}
	>;
	const positionInfoByTid = new Map<number, PositionInfo>();

	if (Object.keys(POSITION_COUNTS).length > 0) {
		for (let tid = 0; tid < g.get("numTeams"); tid++) {
			const positionInfo: PositionInfo = {};
			for (const [pos, count] of Object.entries(POSITION_COUNTS)) {
				positionInfo[pos] = {
					count,
					maxValue: 0,
				};
			}
			positionInfoByTid.set(tid, positionInfo);
		}

		for (const p of players) {
			// Only expiring contracts and hard cap rookies!
			if (p.contract.exp <= g.get("season")) {
				continue;
			}

			const positionInfo = positionInfoByTid.get(p.tid);
			const pos = p.ratings[p.ratings.length - 1].pos;

			if (positionInfo !== undefined && positionInfo[pos] !== undefined) {
				positionInfo[pos].count -= 1;
				if (p.value > positionInfo[pos].maxValue) {
					positionInfo[pos].maxValue = p.value;
				}
			}
		}
	}

	const payrollsByTid = new Map();

	if (g.get("hardCap")) {
		for (let tid = 0; tid < g.get("numTeams"); tid++) {
			const payroll = await team.getPayroll(tid);
			const expiringPayroll = players
				.filter(p => p.tid === tid && p.contract.exp <= g.get("season"))
				.reduce((total, p) => total + p.contract.amount, 0);
			payrollsByTid.set(tid, payroll - expiringPayroll);
		}
	}

	const expiringPids = orderBy(
		players.filter(p => p.contract.exp <= g.get("season")),
		[
			"tid",
			p => {
				return g.get("hardCap") && p.draft.year === g.get("season") ? 1 : -1;
			},
			"value",
		],
		["asc", "desc", "desc"],
	).map(p => p.pid);

	await freeAgents.normalizeContractDemands({
		type: "includeExpiringContracts",
	});

	for (const pid of expiringPids) {
		// Re-fetch players, because normalizeContractDemands might have changed some objects
		const p = await idb.cache.players.get(pid);
		if (!p) {
			continue;
		}

		const draftPick = g.get("hardCap") && p.draft.year === g.get("season");

		if (
			g.get("userTids").includes(p.tid) &&
			!local.autoPlayUntil &&
			!g.get("spectator")
		) {
			const tid = p.tid;

			player.addToFreeAgents(p);

			if (draftPick) {
				p.contract.amount /= 2;

				if (p.contract.amount < g.get("minContract")) {
					p.contract.amount = g.get("minContract");
				} else {
					p.contract.amount = helpers.roundContract(p.contract.amount);
				}
			}

			await idb.cache.players.put(p);
			const error = await contractNegotiation.create(p.pid, true, tid);

			if (error !== undefined && error) {
				logEvent(
					{
						type: "refuseToSign",
						text: error,
						pids: [p.pid],
						tids: [tid],
					},
					conditions,
				);
			}
		} else {
			let reSignPlayer = true;

			const contract = {
				...p.contract,
			};
			const payroll = payrollsByTid.get(p.tid);

			const positionInfo = positionInfoByTid.get(p.tid);
			const pos = p.ratings[p.ratings.length - 1].pos;

			if (g.get("hardCap")) {
				if (contract.amount + payroll > g.get("salaryCap")) {
					if (payroll === undefined) {
						throw new Error(
							"Payroll should always be defined if there is a hard cap",
						);
					}

					reSignPlayer = false;
				}

				// Don't go beyond roster needs by position
				if (
					process.env.SPORT === "football" &&
					positionInfo !== undefined &&
					positionInfo[pos] !== undefined &&
					positionInfo[pos].count <= 0 &&
					positionInfo[pos].maxValue > p.value
				) {
					reSignPlayer = false;
				}

				// Always sign rookies, and give them smaller contracts
				if (draftPick) {
					contract.amount /= 2;

					if (contract.amount < g.get("minContract")) {
						contract.amount = g.get("minContract");
					} else {
						contract.amount = helpers.roundContract(contract.amount);
					}

					reSignPlayer = true;
				}
			}

			if (reSignPlayer) {
				const mood = await player.moodInfo(p, p.tid, {
					contractAmount: p.contract.amount,
				});

				// Player must be willing to sign (includes draft picks and first year after expansion, from moodInfo)
				if (!mood.willing) {
					reSignPlayer = false;
				} else {
					// Is team better off without him?
					const dv = await team.valueChange(p.tid, [], [p.pid], [], []);

					// Skip re-signing some low value players, otherwise teams fill up their rosters too readily
					const skipBadPlayer =
						contract.amount < g.get("minContract") * 2 && Math.random() < 0.5;

					// More randomness if hard cap
					const whatever = g.get("hardCap") ? Math.random() > 0.1 : true;

					if (
						draftPick ||
						(mood.willing && dv < 0 && !skipBadPlayer && whatever)
					) {
						await player.sign(p, p.tid, contract, PHASE.RESIGN_PLAYERS);

						if (positionInfo !== undefined && positionInfo[pos] !== undefined) {
							positionInfo[pos].count -= 1;
							if (p.value > positionInfo[pos].maxValue) {
								positionInfo[pos].maxValue = p.value;
							}
						}

						if (payroll !== undefined) {
							payrollsByTid.set(p.tid, contract.amount + payroll);
						}
					} else {
						reSignPlayer = false;
					}
				}
			}

			if (!reSignPlayer) {
				player.addToFreeAgents(p);
			}

			await idb.cache.players.put(p);
		}
	}

	// Bump up future draft classes (not simultaneous so tid updates don't cause race conditions)
	const draftProspects = await idb.cache.players.indexGetAll(
		"playersByTid",
		PLAYER.UNDRAFTED,
	);

	for (const p of draftProspects) {
		if (p.draft.year !== g.get("season") + 1) {
			continue;
		}

		p.ratings[0].fuzz /= Math.sqrt(2);
		await player.develop(p, 0); // Update skills/pot based on fuzz

		await player.updateValues(p);
		await idb.cache.players.put(p);
	}

	for (const p of draftProspects) {
		if (p.draft.year !== g.get("season") + 2) {
			continue;
		}

		p.ratings[0].fuzz /= Math.sqrt(2);
		await player.develop(p, 0); // Update skills/pot based on fuzz

		await player.updateValues(p);
		await idb.cache.players.put(p);
	}

	// Generate a new draft class, while leaving existing players in that draft class in place
	await draft.genPlayers(g.get("season") + 3, undefined);

	// Delete any old undrafted players that still somehow exist
	const toRemove = [];
	for (const p of draftProspects) {
		if (p.draft.year <= g.get("season")) {
			toRemove.push(p.pid);
		}
	}
	await player.remove(toRemove);

	// Set daysLeft here because this is "basically" free agency, so some functions based on daysLeft need to treat it that way (such as the trade AI being more reluctant)
	await league.setGameAttributes({
		daysLeft: 30,
	});

	return {
		url: helpers.leagueUrl(["negotiation"]),
		updateEvents: ["playerMovement"],
	};
};

export default newPhaseResignPlayers;
