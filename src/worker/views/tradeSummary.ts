import { PHASE } from "../../common";
import type {
	MinimalPlayerRatings,
	Phase,
	Player,
	PlayerContract,
	PlayerStats,
	UpdateEvents,
	ViewInput,
} from "../../common/types";
import { player } from "../core";
import { idb } from "../db";
import { getTeamInfoBySeason, helpers } from "../util";
import { assetIsPlayer, getPlayerFromPick } from "../util/formatEventText";

const findRatingsRow = (
	allRatings: MinimalPlayerRatings[],
	ratingsIndex: number,
	season: number,
	phase: Phase,
) => {
	// If no data was deleted/edited, should work with just ratingsIndex
	const firstTry = allRatings[ratingsIndex];
	if (firstTry !== undefined && firstTry.season === season) {
		return firstTry;
	}

	// Something's wrong! Look for first/last ratings entry that season based on phase
	if (phase <= PHASE.PLAYOFFS) {
		const ratings = allRatings.find(ratings => ratings.season >= season);
		if (ratings) {
			return ratings;
		}

		return allRatings[allRatings.length - 1];
	} else {
		for (let i = allRatings.length - 1; i >= 0; i--) {
			const ratings = allRatings[i];
			if (ratings.season <= season) {
				return ratings;
			}
		}

		return allRatings[0];
	}
};

const findStatSum = (
	allStats: PlayerStats[],
	statsIndex: number,
	season: number,
	phase: Phase,
	statSumsBySeason: Record<number, number>,
) => {
	let rows: PlayerStats[];

	// If no data was deleted/edited, should work with just ratingsIndex
	const firstTry = allStats[statsIndex];
	if (firstTry !== undefined && firstTry.season === season) {
		rows = allStats.slice(statsIndex);
	} else {
		// Something's wrong! Look for first/last stats entry that season based on phase
		rows = allStats.filter(row => {
			if (
				row.season < season ||
				(row.season === season && !row.playoffs && phase >= PHASE.PLAYOFFS) ||
				(row.season === season && row.playoffs && phase > PHASE.PLAYOFFS)
			) {
				return false;
			}

			return true;
		});
	}

	let statSum = 0;
	for (const row of rows) {
		const stat =
			process.env.SPORT === "basketball" ? row.ows + row.dws : row.av;
		statSum += stat;

		if (!statSumsBySeason[row.season]) {
			statSumsBySeason[row.season] = 0;
		}
		statSumsBySeason[row.season] += stat;
	}
	return statSum;
};

const getActualPlayerInfo = (
	p: Player,
	ratingsIndex: number,
	statsIndex: number,
	season: number,
	phase: Phase,
	statSumsBySeason: Record<number, number>,
	draftPick: boolean = false,
) => {
	const ratings = findRatingsRow(p.ratings, ratingsIndex, season, phase);

	const stat = findStatSum(
		p.stats,
		statsIndex,
		season,
		phase,
		statSumsBySeason,
	);

	return {
		name: `${p.firstName} ${p.lastName}`,
		age: (draftPick ? p.draft.year : season) - p.born.year,
		pos: ratings.pos,
		ovr: player.fuzzRating(ratings.ovr, ratings.fuzz),
		pot: player.fuzzRating(ratings.pot, ratings.fuzz),
		skills: ratings.skills,
		stat,
		watch: p.watch,
	};
};

const getSeasonsToPlot = async (
	season: number,
	phase: Phase,
	tids: [number, number],
	statSumsBySeason: [Record<number, number>, Record<number, number>],
) => {
	// Default range of the plot, relative to the season of the trade
	const start = season - (phase <= PHASE.PLAYOFFS ? 2 : 1);
	let end = season + 5;

	// Extend end date if we have stats
	const statSeasons = [
		...Object.keys(statSumsBySeason[0]),
		...Object.keys(statSumsBySeason[1]),
	].map(x => parseInt(x));
	const maxStatSeason = Math.max(...statSeasons);
	if (maxStatSeason > end) {
		end = maxStatSeason;
	}

	const seasons = [];

	const teamSeasonsIndex = idb.league
		.transaction("teamSeasons")
		.store.index("tid, season");

	for (let i = start; i <= end; i++) {
		type Team = {
			winp?: number;
			won?: number;
			lost?: number;
			tied?: number;
			stat?: number;
		};
		const teams: [Team, Team] = [{}, {}];
		for (let j = 0; j < tids.length; j++) {
			const tid = tids[j];
			const teamSeason = await teamSeasonsIndex.get([tid, i]);
			if (
				teamSeason &&
				(teamSeason.won > 0 || teamSeason.lost > 0 || teamSeason.tied > 0)
			) {
				teams[j].won = teamSeason.won;
				teams[j].lost = teamSeason.lost;
				teams[j].tied = teamSeason.tied;
				teams[j].winp = helpers.calcWinp(teamSeason);
			}

			if (i > season || (i === season && phase <= PHASE.PLAYOFFS)) {
				teams[j].stat = statSumsBySeason[j][i] ?? 0;
			}
		}

		seasons.push({
			season: String(i),
			teams,
		});
	}

	return seasons;
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
		const event = await idb.getCopy.events({ eid });
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

		const tids = [...event.tids];

		const statSumsBySeason: [Record<number, number>, Record<number, number>] = [
			{},
			{},
		];

		for (let i = 0; i < tids.length; i++) {
			const tid = tids[i];
			const otherTid = tids[i === 0 ? 1 : 0];
			const teamInfo = await getTeamInfoBySeason(tid, event.season);
			if (!teamInfo) {
				throw new Error("teamInfo not found");
			}

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
				skills: string[];
				watch: boolean;
				stat: number;
			};

			type CommonPick = {
				abbrev?: string; // from originalTid
				tid: number; // from originalTid
				round: number;
				season: number | "fantasy" | "expansion";
			};

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

			let statSum = 0;

			for (const asset of event.teams[i].assets) {
				if (assetIsPlayer(asset)) {
					const p = await idb.getCopy.players({ pid: asset.pid });
					const common = {
						pid: asset.pid,
						contract: asset.contract,
					};
					if (p) {
						const playerInfo = getActualPlayerInfo(
							p,
							asset.ratingsIndex,
							asset.statsIndex,
							event.season,
							event.phase,
							statSumsBySeason[i],
						);
						statSum += playerInfo.stat;

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
						const teamInfo = await getTeamInfoBySeason(
							asset.originalTid,
							season,
						);
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
						const playerInfo = getActualPlayerInfo(
							p,
							0,
							0,
							event.season,
							event.phase,
							statSumsBySeason[i],
							true,
						);
						statSum += playerInfo.stat;

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

			teams.push({
				abbrev: teamInfo.abbrev,
				region: teamInfo.region,
				name: teamInfo.name,
				tid,
				assets,
				statSum,
			});
		}

		console.log("statSumsBySeason", statSumsBySeason);

		const seasonsToPlot = await getSeasonsToPlot(
			event.season,
			event.phase,
			event.tids as [number, number],
			statSumsBySeason,
		);
		console.log(seasonsToPlot);

		return {
			eid,
			teams,
			season: event.season,
			phase: event.phase,
			stat: process.env.SPORT === "basketball" ? "WS" : "AV",
			seasonsToPlot,
		};
	}
};

export default updateTradeSummary;
