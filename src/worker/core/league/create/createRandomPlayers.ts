import orderBy from "lodash-es/orderBy";
import { draft, player, freeAgents } from "../..";
import { PHASE, POSITION_COUNTS } from "../../../../common";
import { groupBy } from "../../../../common/groupBy";
import type {
	PlayerWithoutKey,
	MinimalPlayerRatings,
	PlayerContract,
	Team,
} from "../../../../common/types";
import { g, random } from "../../../util";

const createRandomPlayers = async ({
	activeTids,
	scoutingRank,
	teams,
}: {
	activeTids: number[];
	scoutingRank: number;
	teams: Pick<Team, "tid" | "retiredJerseyNumbers">[];
}) => {
	const players: PlayerWithoutKey[] = [];

	// Generate past 20 years of draft classes, unless forceRetireAge/draftAges make that infeasible
	let seasonsSimmed = 20;
	const forceRetireAge = g.get("forceRetireAge");
	const draftAges = g.get("draftAges");
	const averageDraftAge = Math.round((draftAges[0] + draftAges[1]) / 2);
	const forceRetireAgeDiff = forceRetireAge - averageDraftAge;
	if (forceRetireAgeDiff > 0 && forceRetireAgeDiff < seasonsSimmed) {
		seasonsSimmed = forceRetireAgeDiff;
	} else {
		// Maybe add some extra seasons, for leagues when players start young
		const estimatedRetireAge = forceRetireAgeDiff > 0 ? forceRetireAge : 35;
		const estimatedRetireAgeDiff = estimatedRetireAge - averageDraftAge;
		if (estimatedRetireAgeDiff > seasonsSimmed) {
			seasonsSimmed = estimatedRetireAgeDiff;
		}
	}

	const seasonOffset = g.get("phase") >= PHASE.RESIGN_PLAYERS ? -1 : 0;
	const NUM_PAST_SEASONS = seasonsSimmed + seasonOffset;

	// Keep synced with Dropdown.js seasonsAndOldDrafts and addRelatives
	const rookieSalaries = draft.getRookieSalaries();
	let keptPlayers: PlayerWithoutKey<MinimalPlayerRatings>[] = [];

	for (
		let numYearsAgo = NUM_PAST_SEASONS;
		numYearsAgo > seasonOffset;
		numYearsAgo--
	) {
		let draftClass = await draft.genPlayersWithoutSaving(
			g.get("season"),
			scoutingRank,
			[],
		);

		// value is needed for ordering the historical draft class. This is value AT THE TIME OF THE DRAFT! Will be regenerated below for subsequent use.
		for (const p of draftClass) {
			p.value = player.value(p, {
				ovrMean: 47,
				ovrStd: 10,
			});
		}

		// Very rough simulation of a draft
		draftClass = orderBy(draftClass, "value", "desc");
		const tids = [...activeTids];
		random.shuffle(tids);

		for (let i = 0; i < draftClass.length; i++) {
			const p = draftClass[i];
			let round = 0;
			let pick = 0;
			const roundTemp = Math.floor(i / activeTids.length) + 1;

			if (roundTemp <= g.get("numDraftRounds")) {
				round = roundTemp;
				pick = (i % activeTids.length) + 1;
			}

			// Save these for later, because player.develop will overwrite them

			const pot = p.ratings[0].pot;
			const ovr = p.ratings[0].ovr;
			const skills = p.ratings[0].skills;

			// Develop player and see if he is still non-retired

			await player.develop(p, numYearsAgo, true);

			// Do this before developing, to save ratings
			p.draft = {
				round,
				pick,
				tid: round === 0 ? -1 : tids[pick - 1],
				year: g.get("season") - numYearsAgo,
				originalTid: round === 0 ? -1 : tids[pick - 1],
				pot,
				ovr,
				skills,
			};

			if (round === 0) {
				// Guarantee contracts for undrafted players are overwritten below
				p.contract.exp = -Infinity;
			} else {
				let years;
				if (g.get("draftPickAutoContract")) {
					years = draft.getRookieContractLength(round);
				} else {
					// 2 years for 2nd round, 3 years for 1st round;
					years = Math.min(4 - round, 2);
				}

				const contract: PlayerContract = {
					amount: rookieSalaries[i],
					exp: g.get("season") - numYearsAgo + years,
				};
				if (g.get("draftPickAutoContract")) {
					contract.rookie = true;
				}

				player.setContract(p, contract, false);
			}
			p.contract.temp = true;

			keptPlayers.push(p);
		}
	}

	// (g.get("maxRosterSize") + 1) for wiggle room (need min contract FAs sometimes)
	if (keptPlayers.length < (g.get("maxRosterSize") + 1) * activeTids.length) {
		throw new Error("Not enough players!");
	}

	const numPlayerPerTeam = Math.max(
		g.get("maxRosterSize") - 2,
		g.get("minRosterSize"),
	); // 13 for basketball
	const maxNumFreeAgents = Math.round(
		(activeTids.length / 3) * g.get("maxRosterSize"),
	); // 150 for basketball

	// Needed for sorting the keptPlayers array and inside getBest (only if DRAFT_BY_TEAM_OVR)
	for (const p of keptPlayers) {
		p.value = player.value(p, {
			ovrMean: 47,
			ovrStd: 10,
		});
	}
	keptPlayers.sort((a, b) => b.value - a.value);

	// Keep track of number of players on each team
	const numPlayersByTid: Record<number, number> = {};

	for (const tid2 of activeTids) {
		numPlayersByTid[tid2] = 0;
	}

	const teamJerseyNumbers: Record<number, string[]> = {};

	const addPlayerToTeam = async (p: PlayerWithoutKey, tid2: number) => {
		if (!teamJerseyNumbers[tid2]) {
			teamJerseyNumbers[tid2] = [];
		}

		const t = teams.find(t => t.tid === tid2);
		const retiredJerseyNumbers =
			t && t.retiredJerseyNumbers
				? t.retiredJerseyNumbers.map(row => row.number)
				: [];

		numPlayersByTid[tid2] += 1;
		p.tid = tid2;
		await player.addStatsRow(p, g.get("phase") === PHASE.PLAYOFFS, {
			retired: retiredJerseyNumbers,
			team: teamJerseyNumbers[tid2],
		});

		const jerseyNumber = p.stats.at(-1).jerseyNumber;
		if (jerseyNumber) {
			teamJerseyNumbers[tid2].push(jerseyNumber);
		}

		// Keep rookie contract, or no?
		if (p.contract.exp >= g.get("season") && g.get("draftPickAutoContract")) {
			delete p.contract.temp;
		}

		players.push(p);
	};

	const probStillOnDraftTeam = (p: PlayerWithoutKey) => {
		let prob = 0; // Probability a player is still on his draft team

		const numYearsAgo = g.get("season") - p.draft.year;

		if (typeof p.draft.round === "number") {
			if (numYearsAgo < 8) {
				prob = (8 - numYearsAgo) / 8; // 87.5% for last year, 75% for 2 years ago, etc
			} else {
				prob = 0.125;
			}

			if (p.draft.round > 1) {
				prob *= 0.75;
			}

			if (p.draft.round > 3) {
				prob *= 0.75;
			}

			if (p.draft.round > 5) {
				prob *= 0.75;
			}

			if (p.draft.round > 7) {
				prob *= 0.75;
			}
		}

		return prob;
	};

	// Drafted players kept with own team, with some probability
	const playersStayedOnOwnTeam = new Set();
	for (let i = 0; i < numPlayerPerTeam * activeTids.length; i++) {
		const p = keptPlayers[i];

		if (
			p.draft.tid >= 0 &&
			Math.random() < probStillOnDraftTeam(p) &&
			numPlayersByTid[p.draft.tid] < numPlayerPerTeam
		) {
			await addPlayerToTeam(p, p.draft.tid);
			playersStayedOnOwnTeam.add(p);
		}
	}
	keptPlayers = keptPlayers.filter(p => !playersStayedOnOwnTeam.has(p));

	// Then add other players, up to the limit
	while (true) {
		// Random order tids, so no team is a superpower
		const tids = [...activeTids];
		random.shuffle(tids);
		let numTeamsDone = 0;

		for (const currentTid of tids) {
			if (numPlayersByTid[currentTid] >= numPlayerPerTeam) {
				numTeamsDone += 1;
				continue;
			}

			const p = freeAgents.getBest(
				players.filter(p2 => p2.tid === currentTid),
				keptPlayers,
			);

			if (p) {
				keptPlayers = keptPlayers.filter(p2 => p2 !== p);
				await addPlayerToTeam(p, currentTid);
			} else {
				console.log(currentTid, "can't find player");
				numTeamsDone += 1;
			}
		}

		if (numTeamsDone === activeTids.length) {
			break;
		}
	}

	const addToFreeAgents = (
		p: PlayerWithoutKey<MinimalPlayerRatings> | undefined,
	) => {
		// eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
		if (p) {
			// So half will be eligible to retire after the first season
			p.yearsFreeAgent = Math.random() > 0.5 ? 1 : 0;

			player.setContract(
				p,
				{
					amount: g.get("minContract"),
					exp: g.get("season"),
				},
				false,
			);
			p.contract.temp = true;
			player.addToFreeAgents(p);
			players.push(p);
		}
	};

	// Finally, free agents
	if (Object.keys(POSITION_COUNTS).length === 0) {
		for (let i = 0; i < maxNumFreeAgents; i++) {
			addToFreeAgents(keptPlayers[i]);
		}
	} else {
		// POSITION_COUNTS exists, so use it to keep a balanced list of free agents
		let positionCountsSum = 0;
		for (const positionCount of Object.values(POSITION_COUNTS)) {
			positionCountsSum += positionCount;
		}

		const groupedPlayers = groupBy(keptPlayers, p => p.ratings[0].pos);

		for (const pos of Object.keys(groupedPlayers)) {
			const limit = Math.round(
				(maxNumFreeAgents * POSITION_COUNTS[pos]) / positionCountsSum,
			);

			for (let i = 0; i < limit; i++) {
				addToFreeAgents(groupedPlayers[pos][i]);
			}
		}
	}

	return players;
};

export default createRandomPlayers;
