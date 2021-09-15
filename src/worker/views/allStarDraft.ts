import { allStar } from "../core";
import { idb } from "../db";
import { g, getTeamInfoBySeason, helpers } from "../util";
import type {
	UpdateEvents,
	AllStars,
	ViewInput,
	AllStarPlayer,
} from "../../common/types";
import { bySport, PHASE } from "../../common";

const stats = bySport({
	basketball: ["pts", "trb", "ast"],
	football: ["keyStats"],
	hockey: ["keyStats"],
});

const getPlayerInfo = async (
	{ pid, tid, name }: AllStarPlayer,
	season: number,
) => {
	const p = await idb.getCopy.players({ pid });
	if (!p) {
		throw new Error("Invalid pid");
	}

	const p2 = await idb.getCopy.playersPlus(p, {
		attrs: ["pid", "injury", "watch", "age", "numAllStar"],
		ratings: ["ovr", "skills", "pos"],
		season,
		stats: [...stats, "jerseyNumber", "tid", "abbrev"],
		fuzz: true,
		showNoStats: true,
	});

	// Use values at time of draft
	p2.tid = tid;
	p2.name = name;
	p2.abbrev =
		(await getTeamInfoBySeason(tid, season))?.abbrev ??
		g.get("teamInfoCache")[tid].abbrev;

	return p2;
};

const augment = async (allStars: AllStars) => {
	const remaining = await Promise.all(
		allStars.remaining.map(info => getPlayerInfo(info, allStars.season)),
	);
	const teams = await Promise.all(
		allStars.teams.map(players =>
			Promise.all(players.map(info => getPlayerInfo(info, allStars.season))),
		),
	);
	return {
		finalized: allStars.finalized,
		gid: allStars.gid,
		remaining,
		teams,
		teamNames: allStars.teamNames,
	};
};

const updateAllStarDraft = async (
	{ season }: ViewInput<"allStarDraft">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("gameSim") ||
		updateEvents.includes("playerMovement") ||
		season !== state.season
	) {
		const allStars = await allStar.getOrCreate(season);
		if (allStars === undefined) {
			if (
				season === g.get("season") &&
				g.get("phase") <= PHASE.REGULAR_SEASON
			) {
				return {
					redirectUrl: helpers.leagueUrl(["all_star", "draft", season - 1]),
				};
			}

			// https://stackoverflow.com/a/59923262/786644
			const returnValue = {
				errorMessage: "All-Star draft not found",
			};
			return returnValue;
		}

		const { finalized, gid, teams, teamNames, remaining } = await augment(
			allStars,
		);

		const nextGameIsAllStar =
			season === g.get("season") && (await allStar.nextGameIsAllStar());

		return {
			challengeNoRatings: g.get("challengeNoRatings"),
			finalized,
			gid,
			nextGameIsAllStar,
			remaining,
			season,
			spectator: g.get("spectator"),
			stats,
			teams,
			teamNames,
			userTids: g.get("userTids"),
		};
	}
};

export default updateAllStarDraft;
