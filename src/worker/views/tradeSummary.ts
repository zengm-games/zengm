import { bySport, PHASE, PLAYER } from "../../common/index.ts";
import type {
	DiscriminateUnion,
	DraftPickSeason,
	EventBBGM,
	MinimalPlayerRatings,
	NonEmptyArray,
	Phase,
	Player,
	PlayerContract,
	PlayerStats,
	UpdateEvents,
	ViewInput,
} from "../../common/types.ts";
import { player, team } from "../core/index.ts";
import getPlayoffsByConf from "../core/season/getPlayoffsByConf.ts";
import { idb } from "../db/index.ts";
import { g, getTeamInfoBySeason, helpers } from "../util/index.ts";
import { assetIsPlayer, getPlayerFromPick } from "../util/formatEventText.ts";
import { getRoundsWonText } from "./frivolitiesTeamSeasons.ts";

const findRatingsRow = (
	allRatings: NonEmptyArray<MinimalPlayerRatings>,
	ratingsIndex: number,
	season: number,
	phase: Phase,
) => {
	// If no data was deleted/edited, should work with just ratingsIndex
	const firstTry = allRatings[ratingsIndex];
	if (firstTry?.season === season) {
		return firstTry;
	}

	// Something's wrong! Look for first/last ratings entry that season based on phase
	if (phase <= PHASE.PLAYOFFS) {
		const ratings = allRatings.find((ratings) => ratings.season >= season);
		if (ratings) {
			return ratings;
		}

		return allRatings.at(-1)!;
	} else {
		for (let i = allRatings.length - 1; i >= 0; i--) {
			const ratings = allRatings[i]!;
			if (ratings.season <= season) {
				return ratings;
			}
		}

		return allRatings[0];
	}
};

type StatSumsBySeason = Record<
	number,
	{
		stat: number;
		statTeam: number;
	}
>;
type StatSumsBySeasons = [StatSumsBySeason, StatSumsBySeason];

const findStatSum = (
	allStats: PlayerStats[],
	statsIndex: number | undefined, // undefined means it was a traded draft pick, so include all stats
	season: number,
	phase: Phase,
	tid: number,
	statSumsBySeason?: StatSumsBySeason,
) => {
	// >= 0 check is for rookies traded after the draft, where they have no stats entry so it is -1
	let index = statsIndex !== undefined && statsIndex >= 0 ? statsIndex : 0;

	// If no data was deleted/edited, should work with just statsIndex
	const firstTry = allStats[index];
	if (firstTry === undefined || firstTry.season !== season) {
		// Something's wrong! Look for first stats entry that is after the trade
		index = allStats.findIndex((row) => {
			return (
				row.season > season ||
				(row.season === season && !row.playoffs && phase < PHASE.PLAYOFFS) ||
				(row.season === season && row.playoffs && phase <= PHASE.PLAYOFFS)
			);
		});
	}

	let statSum = 0;
	let statSumTeam = 0;
	let seenOtherTeam = false;
	for (let i = 0; i < allStats.length; i++) {
		const row = allStats[i];

		const stat = bySport({
			baseball: row.war,
			basketball: row.ows + row.dws,
			football: row.av,
			hockey: row.ops + row.dps + row.gps,
		});

		// Only after trade - undefined means traded draft pick, -1 means traded while stats array was empty (so all is after trade)
		if (
			i > index ||
			(i === index && phase <= PHASE.PLAYOFFS) ||
			statsIndex === undefined ||
			statsIndex === -1
		) {
			statSum += stat;

			if (row.tid === tid && !seenOtherTeam) {
				statSumTeam += stat;
			} else {
				seenOtherTeam = true;
			}
		}

		// Including before trade
		if (statSumsBySeason) {
			if (
				row.season < g.get("season") ||
				(row.season === g.get("season") &&
					g.get("phase") >= PHASE.REGULAR_SEASON)
			) {
				if (statSumsBySeason[row.season] === undefined) {
					statSumsBySeason[row.season] = {
						stat: 0,
						statTeam: 0,
					};
				}
				statSumsBySeason[row.season]!.stat += stat;
				if (row.tid === tid && !seenOtherTeam) {
					statSumsBySeason[row.season]!.statTeam += stat;
				}
			}
		}
	}
	return {
		stat: statSum,
		statTeam: statSumTeam,
	};
};

const getNextTeamInfo = async (tid: number, season: number) => {
	const teamInfo = await getTeamInfoBySeason(tid, season);
	return {
		tid,
		abbrev: teamInfo?.abbrev ?? "???",
	};
};

export type PlayerOutcome =
	| {
			type: "stillOnTeam";
	  }
	| {
			type: "retired";
			season: number;
	  }
	| {
			type: "trade";
			eid: number | undefined;
			season: number;
			tid: number;
			abbrev: string;
	  }
	| {
			type: "tradeBeforeDraft";
	  }
	| {
			type: "sisyphus";
			season: number;
			phase: Phase;
			tid: number;
			abbrev: string;
	  }
	| {
			type: "godMode";
			season: number;
			phase: Phase;
			tid: number;
			abbrev: string;
	  }
	| {
			type: "freeAgent";
			season: number;
			phase: Phase;
			tid: number;
			abbrev: string;
	  }
	| undefined;

const getActualPlayerInfo = async (
	p: Player,
	ratingsIndex: number,
	statsIndex: number | undefined,
	eid: number,
	season: number,
	phase: Phase,
	tid: number,
	statSumsBySeason: StatSumsBySeason | undefined,
	draftPick: boolean,
) => {
	const ratings = findRatingsRow(p.ratings, ratingsIndex, season, phase);

	const { stat, statTeam } = findStatSum(
		p.stats,
		statsIndex,
		season,
		phase,
		tid,
		statSumsBySeason,
	);

	let foundCurrentTransaction = false;
	let tradeBeforeDraft = false;
	const nextTransaction = p.transactions?.find((row) => {
		if (row.type === "trade" && row.eid === eid) {
			// We found this trade in the log, so next transaction is leaving this team
			foundCurrentTransaction = true;
		} else if (draftPick && row.type === "draft") {
			// We found the draft pick being made, so next transaction is leaving this team
			foundCurrentTransaction = true;

			if (row.tid !== tid) {
				// Must have been traded before the draft... sadly we don't have an easy record of that, would have to search events database
				tradeBeforeDraft = true;
			}
		} else if (foundCurrentTransaction) {
			return row;
		}
	});

	let outcome: PlayerOutcome;
	if (tradeBeforeDraft) {
		outcome = {
			type: "tradeBeforeDraft",
		};
	} else if (!nextTransaction) {
		if (p.tid === PLAYER.RETIRED) {
			outcome = {
				type: "retired",
				season: p.retiredYear,
			};
		} else if (p.tid === tid) {
			outcome = {
				type: "stillOnTeam",
			};
		}
	} else if (nextTransaction.type === "trade") {
		outcome = {
			type: "trade",
			eid: nextTransaction.eid,
			season: nextTransaction.season,
			...(await getNextTeamInfo(nextTransaction.tid, nextTransaction.season)),
		};
	} else if (
		nextTransaction.type === "sisyphus" ||
		nextTransaction.type === "godMode"
	) {
		outcome = {
			type: nextTransaction.type,
			season: nextTransaction.season,
			phase: nextTransaction.phase,
			...(await getNextTeamInfo(nextTransaction.tid, nextTransaction.season)),
		};
	} else if (nextTransaction.type === "freeAgent") {
		outcome = {
			type: "freeAgent",
			season: nextTransaction.season,
			phase: nextTransaction.phase,
			...(await getNextTeamInfo(nextTransaction.tid, nextTransaction.season)),
		};
	}

	return {
		name: `${p.firstName} ${p.lastName}`,
		age: (draftPick ? p.draft.year : season) - p.born.year,
		pos: ratings.pos,
		ovr: player.fuzzRating(ratings.ovr, ratings.fuzz),
		pot: player.fuzzRating(ratings.pot, ratings.fuzz),
		retiredYear: p.retiredYear,
		skills: ratings.skills,
		stat,
		statTeam,
		watch: p.watch ?? 0,
		outcome,
	};
};

const getSeasonsToPlot = async (
	season: number,
	phase: Phase,
	tids: [number, number],
	statSumsBySeason: StatSumsBySeasons,
) => {
	// Default range of the plot, relative to the season of the trade
	const start = season - (phase <= PHASE.PLAYOFFS ? 2 : 1);
	let end = season + 5;

	// Extend end date if we have stats
	const statSeasons = [
		...Object.keys(statSumsBySeason[0]),
		...Object.keys(statSumsBySeason[1]),
	].map((x) => Number.parseInt(x));
	const maxStatSeason = Math.max(...statSeasons);
	if (maxStatSeason > end) {
		end = maxStatSeason;
	}

	const seasons = [];

	for (let i = start; i <= end; i++) {
		type Team = {
			winp?: number;
			ptsPct?: number;
			won?: number;
			lost?: number;
			tied?: number;
			otl?: number;
			champ?: boolean;
			region?: string;
			name?: string;
			abbrev?: string;
			roundsWonText?: string;
			season: number;
			stat?: number;
			statTeam?: number;
		};
		const teams: [Team, Team] = [
			{
				season: i,
			},
			{
				season: i,
			},
		];
		for (const [j, tid] of tids.entries()) {
			const teamSeason = await idb.getCopy.teamSeasons(
				{
					season: i,
					tid,
				},
				"noCopyCache",
			);

			if (
				teamSeason &&
				(teamSeason.won > 0 ||
					teamSeason.lost > 0 ||
					teamSeason.tied > 0 ||
					teamSeason.otl > 0)
			) {
				teams[j] = {
					...teams[j]!,
					won: teamSeason.won,
					lost: teamSeason.lost,
					tied: teamSeason.tied,
					otl: teamSeason.otl,
					winp: helpers.calcWinp(teamSeason),
					ptsPct: team.ptsPct(teamSeason),
					champ:
						teamSeason.playoffRoundsWon ===
						g.get("numGamesPlayoffSeries", teamSeason.season).length,
					region: teamSeason.region ?? g.get("teamInfoCache")[tid]!.region,
					name: teamSeason.name ?? g.get("teamInfoCache")[tid]!.name,
					abbrev: teamSeason.abbrev ?? g.get("teamInfoCache")[tid]!.abbrev,
					roundsWonText: getRoundsWonText(
						teamSeason,
						await getPlayoffsByConf(teamSeason.season),
					),
				};
			}

			const record = statSumsBySeason[j]![i];

			if (record !== undefined && record?.stat > 0) {
				teams[j]!.stat = record.stat;
			}
			if (record !== undefined && record?.statTeam > 0) {
				teams[j]!.statTeam = record.statTeam;
			}
		}

		seasons.push({
			season: i,
			teams,
		});
	}

	return seasons;
};

type CommonPlayer = {
	pid: number;
	name: string;
	contract: PlayerContract;
};

type CommonActualPlayer = {
	pid: number;
	name: string;
	age: number;
	pos: string;
	ovr: number;
	pot: number;
	retiredYear: number;
	skills: string[];
	watch: number;
	stat: number;
	statTeam: number;
	outcome: PlayerOutcome;
};

type CommonPick = {
	abbrev?: string; // from originalTid
	tid: number; // from originalTid
	round: number;
	season: DraftPickSeason;
};

type TradeEvent = DiscriminateUnion<EventBBGM, "type", "trade">;

export const processAssets = async (
	event: TradeEvent,
	i: 0 | 1,
	statSumsBySeason?: StatSumsBySeasons,
) => {
	if (!event.teams || event.phase === undefined) {
		throw new Error("Invalid event");
	}

	const otherTid = event.tids[i === 0 ? 1 : 0];

	const assets: (
		| ({
				type: "player";
		  } & CommonPlayer &
				CommonActualPlayer)
		| ({
				type: "deletedPlayer";
		  } & CommonPlayer)
		| ({
				type: "realizedPick";
				pick: number;
		  } & CommonPick &
				CommonActualPlayer)
		| ({
				type: "unrealizedPick";
		  } & CommonPick)
	)[] = [];

	for (const asset of event.teams[i].assets) {
		if (assetIsPlayer(asset)) {
			const p = await idb.getCopy.players({ pid: asset.pid }, "noCopyCache");
			const common = {
				pid: asset.pid,
				contract: asset.contract,
			};
			if (p) {
				const playerInfo = await getActualPlayerInfo(
					p,
					asset.ratingsIndex,
					asset.statsIndex,
					event.eid,
					event.season,
					event.phase,
					event.tids[i],
					statSumsBySeason ? statSumsBySeason[i] : undefined,
					false,
				);

				assets.push({
					type: "player",
					...playerInfo,
					...common,
				});
			} else {
				assets.push({
					type: "deletedPlayer",
					name: asset.name,
					...common,
				});
			}
		} else {
			// Show abbrev only if it's another team's pick
			let abbrev;
			if (otherTid !== asset.originalTid) {
				const season =
					typeof asset.season === "number" ? asset.season : event.season;
				const teamInfo = await getTeamInfoBySeason(asset.originalTid, season);
				if (teamInfo) {
					abbrev = teamInfo.abbrev;
				} else {
					abbrev = "???";
				}
			}

			const common = {
				abbrev,
				tid: asset.originalTid,
				round: asset.round,
				season: asset.season,
			};

			// Has the draft already happened? If so, fill in the player
			const p = await getPlayerFromPick(asset);
			if (p) {
				const playerInfo = await getActualPlayerInfo(
					p,
					0,
					undefined,
					event.eid,
					event.season,
					event.phase,
					event.tids[i],
					statSumsBySeason ? statSumsBySeason[i] : undefined,
					true,
				);

				assets.push({
					type: "realizedPick",
					pid: p.pid,
					pick: p.draft.pick,
					...playerInfo,
					...common,
				});
			} else {
				assets.push({
					type: "unrealizedPick",
					...common,
				});
			}
		}
	}

	return assets;
};

const updateTradeSummary = async (
	{ eid }: ViewInput<"tradeSummary">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("gameSim") ||
		updateEvents.includes("newPhase") ||
		updateEvents.includes("playerMovement") ||
		eid !== state.eid
	) {
		const event = await idb.getCopy.events({ eid }, "noCopyCache");
		if (
			!event ||
			event.type !== "trade" ||
			!event.teams ||
			event.phase === undefined
		) {
			// https://stackoverflow.com/a/59923262/786644
			const returnValue = {
				errorMessage: "Trade not found.",
			};
			return returnValue;
		}

		const teams = [];

		const statSumsBySeason: StatSumsBySeasons = [{}, {}];

		for (const i of [0, 1] as const) {
			const tid = event.tids[i];
			const teamInfo = await getTeamInfoBySeason(tid, event.season);
			if (!teamInfo) {
				throw new Error("teamInfo not found");
			}

			const assets = await processAssets(event, i, statSumsBySeason);

			let statSum = 0;
			let statSumTeam = 0;
			for (const asset of assets) {
				// https://github.com/microsoft/TypeScript/issues/21732
				if (asset.type === "player" || asset.type === "realizedPick") {
					statSum += asset.stat;
					statSumTeam += asset.statTeam;
				}
			}

			teams.push({
				abbrev: teamInfo.abbrev,
				region: teamInfo.region,
				name: teamInfo.name,
				tid,
				assets,
				statSum,
				statSumTeam,
			});
		}

		const seasonsToPlot = await getSeasonsToPlot(
			event.season,
			event.phase,
			event.tids as [number, number],
			statSumsBySeason,
		);

		const pointsFormula = g.get("pointsFormula");
		const usePts = pointsFormula !== "";

		return {
			challengeNoRatings: g.get("challengeNoRatings"),
			eid,
			teams,
			season: event.season,
			phase: event.phase,
			stat: bySport({
				baseball: "WAR",
				basketball: "WS",
				football: "AV",
				hockey: "PS",
			}),
			seasonsToPlot,
			usePts,
		};
	}
};

export default updateTradeSummary;
