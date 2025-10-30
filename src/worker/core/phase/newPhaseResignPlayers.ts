import {
	bySport,
	PHASE,
	PLAYER,
	POSITION_COUNTS,
} from "../../../common/index.ts";
import {
	contractNegotiation,
	draft,
	league,
	player,
	team,
	freeAgents,
} from "../index.ts";
import { idb } from "../../db/index.ts";
import { g, helpers, local, logEvent } from "../../util/index.ts";
import type { Conditions, PhaseReturn } from "../../../common/types.ts";
import { orderBy } from "../../../common/utils.ts";

export const FREE_AGENCY_DAYS = 30;

const newPhaseResignPlayers = async (
	conditions: Conditions,
): Promise<PhaseReturn> => {
	// In case some weird situation results in games still in the schedule, clear them
	await idb.cache.schedule.clear();

	// Clear any negotiations that still somehow exist, except if it's a re-signing negotiation for the user, because that could be from a prior failed attempt to run this function and we want to keep those guys. (Would rather have phase updates be transactional, but oh well.)
	const existingNegotiations = await idb.cache.negotiations.getAll();
	const userTids = g.get("userTids");
	for (const negotiation of existingNegotiations) {
		if (negotiation.resigning && userTids.includes(negotiation.tid)) {
			continue;
		}

		await idb.cache.negotiations.delete(negotiation.pid);
	}

	const repeatSeasonType = g.get("repeatSeason")?.type;

	// Reset contract demands of current free agents and undrafted players
	// KeyRange only works because PLAYER.UNDRAFTED is -2 and PLAYER.FREE_AGENT is -1
	const existingFreeAgents = await idb.cache.players.indexGetAll(
		"playersByTid",
		PLAYER.FREE_AGENT,
	);
	const undraftedPlayers =
		!repeatSeasonType && !g.get("forceHistoricalRosters")
			? (
					await idb.cache.players.indexGetAll("playersByDraftYearRetiredYear", [
						[g.get("season")],
						[g.get("season"), Infinity],
					])
				).filter((p) => p.tid === PLAYER.UNDRAFTED)
			: [];

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
			const pos = p.ratings.at(-1)!.pos;

			if (positionInfo !== undefined && positionInfo[pos] !== undefined) {
				positionInfo[pos].count -= 1;
				if (p.value > positionInfo[pos].maxValue) {
					positionInfo[pos].maxValue = p.value;
				}
			}
		}
	}

	const payrollsByTid = new Map();

	if (g.get("salaryCapType") === "hard") {
		for (let tid = 0; tid < g.get("numTeams"); tid++) {
			const payroll = await team.getPayroll(tid);
			const expiringPayroll = players
				.filter((p) => p.tid === tid && p.contract.exp <= g.get("season"))
				.reduce((total, p) => total + p.contract.amount, 0);
			payrollsByTid.set(tid, payroll - expiringPayroll);
		}
	}

	const expiringPids = orderBy(
		players.filter((p) => p.contract.exp <= g.get("season")),
		[
			"tid",
			(p) => {
				return p.draft.year === g.get("season") ? 1 : -1;
			},
			"value",
		],
		["asc", "desc", "desc"],
	).map((p) => p.pid);

	const expiredRookieContractPids = new Set(
		players
			.filter(
				(p) =>
					p.contract.exp <= g.get("season") &&
					p.contract.rookie &&
					p.draft.year < g.get("season"),
			)
			.map((p) => p.pid),
	);

	await freeAgents.normalizeContractDemands({
		type: "includeExpiringContracts",
	});

	for (const pid of expiringPids) {
		// Re-fetch players, because normalizeContractDemands might have changed some objects
		const p = await idb.cache.players.get(pid);
		if (!p) {
			continue;
		}

		if (expiredRookieContractPids.has(p.pid)) {
			p.contract.rookieResign = true;
		}

		const draftPick = p.draft.year === g.get("season");

		if (draftPick && !g.get("draftPickAutoContract")) {
			p.contract.amount /= 2;

			if (p.contract.amount < g.get("minContract")) {
				p.contract.amount = g.get("minContract");
			} else {
				p.contract.amount = helpers.roundContract(p.contract.amount);
			}

			p.contract.rookie = true;
		}

		if (
			g.get("userTids").includes(p.tid) &&
			!local.autoPlayUntil &&
			!g.get("spectator")
		) {
			const tid = p.tid;

			player.addToFreeAgents(p);

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
			const pos = p.ratings.at(-1)!.pos;

			if (g.get("salaryCapType") === "hard") {
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
					bySport({
						baseball: true,
						basketball: false,
						football: true,
						hockey: true,
					}) &&
					positionInfo !== undefined &&
					positionInfo[pos] !== undefined &&
					positionInfo[pos].count <= 0 &&
					positionInfo[pos].maxValue > p.value
				) {
					reSignPlayer = false;
				}

				// Always sign rookies
				if (draftPick) {
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
					const whatever =
						g.get("salaryCapType") === "hard" ? Math.random() > 0.1 : true;

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

			// Delete rookieResign for AI players, since we're done re-signing them. Leave it for user players.
			if (expiredRookieContractPids.has(pid) || p.contract.rookieResign) {
				delete p.contract.rookieResign;
			}

			await idb.cache.players.put(p);
		}
	}

	const draftProspects = await idb.cache.players.indexGetAll(
		"playersByTid",
		PLAYER.UNDRAFTED,
	);

	if (repeatSeasonType === "players") {
		// Bump up age of draft prospects, so they stay the same
		for (const p of draftProspects) {
			p.draft.year += 1;
			p.born.year += 1;
			p.ratings.at(-1)!.season += 1;
			await player.updateValues(p);
			await idb.cache.players.put(p);
		}
	} else {
		// Bump up future draft classes (not simultaneous so tid updates don't cause race conditions)
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
		await draft.genPlayers(g.get("season") + 3);
	}

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
		daysLeft: FREE_AGENCY_DAYS,
	});

	return {
		redirect: {
			url: helpers.leagueUrl(["negotiation"]),
			text: "Re-sign players",
		},
		updateEvents: ["playerMovement"],
	};
};

export default newPhaseResignPlayers;
