import {
	PLAYER,
	DEFAULT_PLAY_THROUGH_INJURIES,
	PHASE,
} from "../../../common/constants.ts";
import {
	finances,
	freeAgents,
	league,
	player,
	realRosters,
	team,
} from "../index.ts";
import { idb } from "../../db/index.ts";
import { g, helpers, local, logEvent, toUI } from "../../util/index.ts";
import type {
	Conditions,
	Contract,
	PhaseReturn,
	Player,
	FlatContractInfo,
	TeamSeason,
} from "../../../common/types.ts";
import { groupByUnique, maxBy } from "../../../common/utils.ts";
import { applyRealTeamInfo } from "../../../common/applyRealTeamInfo.ts";
import { bySport } from "../../../common/sportFunctions.ts";
import { choice, randInt, uniform } from "../../../common/random.ts";
import { env } from "../../util/env.ts";
import { getTeamInfoCache } from "../team/getTeamInfoCache.ts";
import { getMetaAttribute } from "../../db/metaAttributes.ts";
import {
	addContract,
	createContract,
	setContractDemandFromCurrentContract,
	truncateContractBefore,
} from "../contract/index.ts";
import {
	getContractExp,
	getCurrentContract,
	getNearestContractAmount,
} from "../../../common/contracts.ts";

// When a player changes teams or leaves his team at the start of a new season without a normal signing or release (repeat season, forced historical rosters), his contract just ends before this season
const endContractBeforeNewSeason = (
	p: Player,
	contract: Contract,
	newSeason: number,
) => {
	if (!truncateContractBefore(contract, newSeason)) {
		p.contracts = p.contracts.filter((row) => row !== contract);
	}
};

const toFreeAgent = (
	p: Player,
	newSeason: number,
	contractDemand?: FlatContractInfo,
) => {
	const currentContract = getCurrentContract(p);
	if (contractDemand) {
		p.contractDemand = contractDemand;
	} else {
		setContractDemandFromCurrentContract(p);
	}
	if (currentContract) {
		endContractBeforeNewSeason(p, currentContract, newSeason);
	}
	p.tid = PLAYER.FREE_AGENT;
};

// For repeat season, a player on a team has the same contract as when the repeated season started, with the same number of seasons remaining. Usually that's his current contract extended by a season. But if he signed a different contract (like re-signing at a new amount), that's replaced.
const setRepeatSeasonContract = (
	p: Player,
	tid: number,
	contract: FlatContractInfo,
	newSeason: number,
) => {
	const currentContract = p.contractDemand ? undefined : getCurrentContract(p);
	p.tid = tid;

	if (
		currentContract &&
		getContractExp(currentContract) >= newSeason - 1 &&
		getNearestContractAmount(currentContract, newSeason) === contract.amount
	) {
		while (getContractExp(currentContract) < contract.exp) {
			currentContract.amounts.push(contract.amount);
		}
		delete p.contractDemand;
		return;
	}

	if (currentContract) {
		endContractBeforeNewSeason(p, currentContract, newSeason);
	}

	addContract(
		p,
		createContract({
			contract,
			start: newSeason,
			tid,
			type: "unknown",
		}),
	);
};

// For forced historical rosters, a player moved to a team keeps his current contract if it covers this season, like in a trade. Otherwise he signs his contract demand if it covers this season, or a new contract.
const setHistoricalRosterContract = (
	p: Player,
	tid: number,
	newSeason: number,
) => {
	const currentContract = p.contractDemand ? undefined : getCurrentContract(p);
	p.tid = tid;

	if (currentContract && getContractExp(currentContract) >= newSeason) {
		return;
	}

	const contract =
		p.contractDemand && p.contractDemand.exp >= newSeason
			? p.contractDemand
			: {
					amount: player.genContract(p).amount,
					exp:
						newSeason -
						1 +
						randInt(g.get("minContractLength"), g.get("maxContractLength")),
				};

	addContract(
		p,
		createContract({
			contract,
			start: newSeason,
			tid,
			type: "unknown",
		}),
	);
};

const newPhasePreseason = async (
	conditions: Conditions,
): Promise<PhaseReturn> => {
	// In case some weird situation results in games still in the schedule, clear them
	await idb.cache.schedule.clear();

	const repeatSeason = g.get("repeatSeason");
	const forceHistoricalRosters = g.get("forceHistoricalRosters");
	if (repeatSeason?.type !== "playersAndRosters" && !forceHistoricalRosters) {
		await freeAgents.autoSign();
	}
	const newSeason = g.get("season") + 1;
	await league.setGameAttributes({
		season: newSeason,
	});
	await toUI("updateLocal", [
		{
			games: [],
		},
	]);

	const teams = await idb.cache.teams.getAll();
	const teamsByTid = groupByUnique(teams, "tid");

	const realTeamInfo = await getMetaAttribute("realTeamInfo");

	const popInfo: Record<
		string,
		{
			oldPop: number;
			newPop: number;
		}
	> = {};
	const sameRegionOverrides: Record<string, string> = {
		"San Jose": "San Francisco",
		"Golden State": "San Francisco",
		Brooklyn: "New York",
	};

	let updatedTeams = false;
	let scoutingLevel: number | undefined;
	for (const t of teams) {
		// Check if we need to override team info based on a season-specific entry in realTeamInfo
		if (realTeamInfo && t.srID && realTeamInfo[t.srID]) {
			const old = {
				region: t.region,
				name: t.name,
				imgURL: t.imgURL,
			};

			const updated = applyRealTeamInfo(t, realTeamInfo, newSeason, {
				exactSeason: true,
			});

			if (updated) {
				updatedTeams = true;
				await idb.cache.teams.put(t);

				if (t.region !== old.region) {
					const text = `The ${old.region} ${
						old.name
					} are now the <a href="${helpers.leagueUrl([
						"roster",
						`${t.abbrev}_${t.tid}`,
						newSeason,
					])}">${t.region} ${t.name}</a>.`;

					logEvent({
						text,
						type: "teamRelocation",
						tids: [t.tid],
						showNotification: false,
						score: 20,
					});
				} else if (t.name !== old.name) {
					const text = `the ${old.region} ${
						old.name
					} are now the <a href="${helpers.leagueUrl([
						"roster",
						`${t.abbrev}_${t.tid}`,
						newSeason,
					])}">${t.region} ${t.name}</a>.`;

					logEvent({
						text: helpers.upperCaseFirstLetter(text),
						type: "teamRename",
						tids: [t.tid],
						showNotification: false,
						score: 20,
					});
				} else if (t.imgURL && t.imgURL !== old.imgURL) {
					logEvent({
						text: `The <a href="${helpers.leagueUrl([
							"roster",
							`${t.abbrev}_${t.tid}`,
							newSeason,
						])}">${t.region} ${t.name}</a> got a new logo:<br><img src="${
							t.imgURL
						}" class="mt-2" style="max-width:120px;max-height:120px;">`,
						type: "teamLogo",
						tids: [t.tid],
						showNotification: false,
						score: 20,
					});
				}
			}
		}

		if (t.disabled) {
			continue;
		}

		let prevSeason: TeamSeason | undefined;
		// Only need scoutingLevel for the user's team to calculate fuzz when ratings are updated below.
		// This is done BEFORE a new season row is added.
		if (t.tid === g.get("userTid")) {
			const teamSeasons = await idb.merged.teamSeasons.getAll({
				tid: t.tid,
				seasons: [newSeason - 3, newSeason - 1],
			});
			scoutingLevel = await finances.getLevelLastThree("scouting", {
				t,
				teamSeasons,
			});
			prevSeason = teamSeasons.at(-1);
		} else {
			prevSeason = await idb.cache.teamSeasons.indexGet(
				"teamSeasonsByTidSeason",
				[t.tid, newSeason - 1],
			);
		}

		const newTeamSeason = team.genSeasonRow(t, prevSeason);

		t.pop ??= newTeamSeason.pop;
		t.stadiumCapacity ??= newTeamSeason.stadiumCapacity;

		// Mean population should stay constant, otherwise the economics change too much
		if (!g.get("equalizeRegions")) {
			// Check if this is the same region as another team, in which case keep the populations in sync
			const actualRegion = sameRegionOverrides[t.region] ?? t.region;
			if (
				actualRegion !== "" &&
				popInfo[actualRegion] &&
				popInfo[actualRegion].oldPop === t.pop
			) {
				t.pop = popInfo[actualRegion].newPop;
			} else {
				const newPop = t.pop * uniform(0.98, 1.02);
				popInfo[actualRegion] = {
					oldPop: t.pop,
					newPop,
				};
				t.pop = newPop;
			}
		}
		newTeamSeason.pop = t.pop;

		await idb.cache.teamSeasons.add(newTeamSeason);
		await idb.cache.teamStats.add(team.genStatsRow(t.tid));

		if (t.disabled) {
			// Active teams are persisted below
			await idb.cache.teams.put(t);
		}
	}

	const activeTeams = teams.filter((t) => !t.disabled);
	const popRanks = helpers.getPopRanks(activeTeams);
	for (const [t, popRank] of Iterator.zip([activeTeams, popRanks], {
		mode: "strict",
	})) {
		if (
			!g.get("userTids").includes(t.tid) ||
			local.autoPlayUntil ||
			g.get("spectator")
		) {
			await team.resetTicketPrice(t, popRank);

			// Sometimes update budget items for AI teams
			for (const key of [
				"scouting",
				"coaching",
				"health",
				"facilities",
			] as const) {
				if (Math.random() < 0.5) {
					t.budget[key] = finances.defaultBudgetLevel(popRank);
				}
			}

			t.adjustForInflation = true;
			t.autoTicketPrice = true;
			t.keepRosterSorted = true;
			t.playThroughInjuries = DEFAULT_PLAY_THROUGH_INJURIES;

			await idb.cache.teams.put(t);
		}
	}

	if (updatedTeams) {
		await league.setGameAttributes({
			teamInfoCache: getTeamInfoCache(teams),
		});
	}

	if (scoutingLevel === undefined) {
		throw new Error("scoutingLevel should be defined");
	}

	const coachingLevels: Record<number, number> = {};
	for (const t of teams) {
		const teamSeasons = await idb.merged.teamSeasons.getAll({
			tid: t.tid,
			seasons: [newSeason - 3, newSeason - 1],
		});
		coachingLevels[t.tid] = await finances.getLevelLastThree("coaching", {
			t,
			teamSeasons,
		});
	}

	const players = await idb.cache.players.indexGetAll("playersByTid", [
		PLAYER.FREE_AGENT,
		Infinity,
	]);

	if (forceHistoricalRosters) {
		// Also need to bring in the previous draft class who haven't been assigned a team yet
		players.push(
			...(await idb.cache.players.indexGetAll("playersByDraftYearRetiredYear", [
				[newSeason - 1],
				[newSeason - 1, Infinity],
			])),
		);
	}

	// Small chance that a player was lying about his age!
	if (
		!repeatSeason &&
		!forceHistoricalRosters &&
		Math.random() < g.get("fakeAgeProb")
	) {
		const p = player.getPlayerFakeAge(players);

		if (p) {
			const gender = g.get("gender");
			const years = randInt(1, 4);
			const age0 = newSeason - p.born.year;
			p.born.year -= years;
			const age1 = newSeason - p.born.year;
			const name = `<a href="${helpers.leagueUrl(["player", p.pid])}">${
				p.firstName
			} ${p.lastName}</a>`;
			const reason = choice([
				`A newly discovered Kenyan birth certificate suggests that ${name}`,
				`In a televised press conference, the parents of ${name} explained how they faked ${helpers.pronoun(
					gender,
					"his",
				)} age as a child to make ${helpers.pronoun(
					gender,
					"him",
				)} perform better against younger competition. ${helpers.pronoun(
					gender,
					"He",
				)}`,
				`Internet sleuths on /r/${bySport({
					baseball: "baseball",
					basketball: "nba",
					football: "nfl",
					hockey: "hockey",
				})} uncovered evidence that ${name}`,
				`Internet sleuths on Twitter uncovered evidence that ${name}`,
				`In an emotional interview on 60 Minutes, ${name} admitted that ${helpers.pronoun(
					gender,
					"he",
				)}`,
				`During a preseason locker room interview, ${name} accidentally revealed that ${helpers.pronoun(
					gender,
					"he",
				)}`,
				`In a Reddit AMA, ${name} confirmed that ${helpers.pronoun(
					gender,
					"he",
				)}`,
				`A recent Wikileaks report revealed that ${name}`,
				`A foreign ID from the stolen luggage of ${name} revealed ${helpers.pronoun(
					gender,
					"he",
				)}`,
			]);
			logEvent(
				{
					type: "ageFraud",
					text: `${reason} is actually ${age1} years old, not ${age0} as was previously thought.`,
					showNotification: p.tid === g.get("userTid"),
					pids: [p.pid],
					tids: [p.tid],
					persistent: true,
					score: 20,
				},
				conditions,
			);
		}
	}

	// Loop through all non-retired players
	for (const p of players) {
		if (__SPORT === "hockey" && p.numConsecutiveGamesG !== undefined) {
			p.numConsecutiveGamesG = 0;
		}
		if (__SPORT === "baseball" && p.pFatigue !== undefined && p.pFatigue > 0) {
			p.pFatigue = 0;
		}

		if (repeatSeason) {
			if (repeatSeason.type === "playersAndRosters") {
				const info = repeatSeason.players[p.pid];
				if (info) {
					// Same contract as when the repeated season started, with the same number of seasons remaining
					const contract = helpers.deepCopy(info.contract);
					contract.exp += newSeason - repeatSeason.startingSeason;

					if (info.tid < 0) {
						toFreeAgent(p, newSeason, contract);
					} else {
						setRepeatSeasonContract(p, info.tid, contract, newSeason);
					}

					p.injury = helpers.deepCopy(info.injury);
				} else {
					toFreeAgent(p, newSeason);
				}
			}

			// First entry for last season, so it skips injuries
			const newRatings = helpers.deepCopy(
				p.ratings.find((pr) => pr.season === newSeason - 1),
			);
			if (newRatings) {
				newRatings.season += 1;
				p.ratings.push(newRatings);
			}

			p.transactions = [];
			p.born.year += 1;
		} else {
			// Update ratings
			player.addRatingsRow(p, scoutingLevel);
			await player.develop(p, 1, false, coachingLevels[p.tid]);
		}

		if (
			forceHistoricalRosters &&
			p.draft.year < newSeason &&
			p.tid !== PLAYER.RETIRED
		) {
			if (p.srID === undefined) {
				toFreeAgent(p, newSeason);
			} else {
				const playerActiveSeasons = await realRosters.getPlayerActiveSeasons();
				let tid = playerActiveSeasons[p.srID]?.[newSeason];
				if (tid !== undefined) {
					const newTeam = teamsByTid[tid];
					if (!newTeam || newTeam.disabled) {
						// When editing league, a team that should exist could be deleted or disabled. In which case it makes no sense to use forceHistoricalRosters probably, but we still shouldn't assign to an invalid tid because that causes many other errors.
						tid = undefined;
					}
				}

				if (tid === undefined) {
					toFreeAgent(p, newSeason);
				} else {
					setHistoricalRosterContract(p, tid, newSeason);
				}
			}
		}
	}

	// Again, so updateValues can happen after new mean/std is calculated
	local.playerOvrMeanStdStale = true;
	for (const p of players) {
		if (!repeatSeason) {
			// Update player values after ratings changes
			await player.updateValues(p);
		}
	}

	if (repeatSeason?.type !== "playersAndRosters") {
		await freeAgents.normalizeContractDemands({
			type: "dummyExpiringContracts",

			// Set this because otherwise the season+phase combo appears off when setting contract expiration
			nextSeason: true,
		});
	}

	local.minFractionDiffs = undefined;

	// Handle jersey number conflicts
	const playersByTeam = Map.groupBy(
		players.filter((p) => p.tid >= 0),
		(p) => p.tid,
	);
	for (const roster of playersByTeam.values()) {
		if (!roster[0]) {
			continue;
		}
		const retiredJerseyNumbers = new Set(
			teamsByTid[roster[0].tid]?.retiredJerseyNumbers?.map((row) => row.number),
		);

		for (const p of roster) {
			const jerseyNumber = p.jerseyNumber;
			if (jerseyNumber === undefined) {
				continue;
			}

			// Conflicts with retired numbers
			if (retiredJerseyNumbers.has(jerseyNumber)) {
				player.setJerseyNumber(p, await player.genJerseyNumber(p), {
					phase: PHASE.PRESEASON,
				});
			} else {
				// Conflicts with teammates
				const conflicts = roster.filter(
					(p2) => p2.jerseyNumber === jerseyNumber,
				);
				if (conflicts.length > 1) {
					// Conflict! Who gets to keep the number? The one with the highest career peak ovr!
					const playerWhoKeepsIt = maxBy(
						conflicts,
						(p) => maxBy(p.ratings, "ovr")!.ovr,
					);

					for (const p of conflicts) {
						if (p !== playerWhoKeepsIt) {
							player.setJerseyNumber(p, await player.genJerseyNumber(p), {
								phase: PHASE.PRESEASON,
							});
						}
					}
				}
			}
		}

		// One more pass, for players without jersey numbers at all (draft picks)
		for (const p of roster) {
			if (p.jerseyNumber === undefined) {
				player.setJerseyNumber(p, await player.genJerseyNumber(p), {
					phase: PHASE.PRESEASON,
				});
			}
		}
	}

	await idb.cache.players.putAll(players);

	await realRosters.checkDisableForceHistoricalRosters(
		newSeason,
		PHASE.PRESEASON,
	);

	// No ads during multi season auto sim
	if (env.enableLogging && !local.autoPlayUntil) {
		toUI("showModal", [], conditions);
	}

	return {
		updateEvents: ["playerMovement"],
	};
};

export default newPhasePreseason;
