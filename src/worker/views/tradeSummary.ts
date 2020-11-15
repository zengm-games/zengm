import { PHASE } from "../../common";
import type {
	MinimalPlayerRatings,
	Phase,
	Player,
	PlayerContract,
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
	} else {
		for (let i = allRatings.length - 1; i >= 0; i--) {
			const ratings = allRatings[i];
			if (ratings.season <= season) {
				return ratings;
			}
		}
	}

	throw new Error("Ratings not found");
};

const getActualPlayerInfo = (
	p: Player,
	ratingsIndex: number,
	season: number,
	phase: Phase = 0,
) => {
	const ratings = findRatingsRow(p.ratings, ratingsIndex, season, phase);

	return {
		name: `${p.firstName} ${p.lastName}`,
		pos: ratings.pos,
		ovr: player.fuzzRating(ratings.ovr, ratings.fuzz),
		pot: player.fuzzRating(ratings.pot, ratings.fuzz),
		skills: ratings.skills,
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
				pos: string;
				ovr: number;
				pot: number;
				skills: string[];
				watch: boolean;
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

			for (const asset of event.teams[i].assets) {
				if (assetIsPlayer(asset)) {
					const p = await idb.getCopy.players({ pid: asset.pid });
					const common = {
						pid: asset.pid,
						contract: asset.contract,
					};
					if (p) {
						assets.push({
							type: "player",
							...getActualPlayerInfo(
								p,
								asset.ratingsIndex,
								event.season,
								event.phase,
							),
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
					console.log(asset, p);
					if (p) {
						assets.push({
							type: "realizedPick",
							pid: p.pid,
							...getActualPlayerInfo(p, 0, event.season, event.phase),
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
			});
		}

		return {
			eid,
			teams,
			season: event.season,
			phase: event.phase,
		};
	}
};

export default updateTradeSummary;
