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
import { getTeamInfoBySeason } from "../util";
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
		statSum += process.env.SPORT === "basketball" ? row.ows + row.dws : row.av;
	}
	return statSum;
};

const getActualPlayerInfo = (
	p: Player,
	ratingsIndex: number,
	statsIndex: number,
	season: number,
	phase: Phase = 0,
	draftPick: boolean = false,
) => {
	const ratings = findRatingsRow(p.ratings, ratingsIndex, season, phase);

	const stat = findStatSum(p.stats, statsIndex, season, phase);

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
		if (!event || event.type !== "trade" || !event.teams) {
			return {
				eid,
			};
		}

		const teams = [];

		const tids = [...event.tids];

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
				pick: number;
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
						pick: asset.pick,
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
							true,
						);
						statSum += playerInfo.stat;

						assets.push({
							type: "realizedPick",
							pid: p.pid,
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

		return {
			eid,
			teams,
			season: event.season,
			phase: event.phase,
			stat: process.env.SPORT === "basketball" ? "WS" : "AV",
		};
	}
};

export default updateTradeSummary;
