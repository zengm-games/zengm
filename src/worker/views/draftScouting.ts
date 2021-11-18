import { PHASE, PLAYER } from "../../common";
import { idb } from "../db";
import { g } from "../util";
import type { UpdateEvents, Player } from "../../common/types";

const getSeason = async (playersAll: Player[], season: number) => {
	const playersAllFiltered = playersAll.filter(p => p.draft.year === season);
	const players = await idb.getCopies.playersPlus(playersAllFiltered, {
		attrs: ["pid", "name", "nameAbbrev", "age", "valueFuzz", "watch"],
		ratings: ["ovr", "pot", "skills", "fuzz", "pos"],
		showNoStats: true,
		showRookies: true,
		fuzz: true,
	});
	players.sort((a, b) => b.valueFuzz - a.valueFuzz);

	const players2 = players.map((pa, i) => ({
		pid: pa.pid,
		name: pa.name,
		nameAbbrev: pa.nameAbbrev,
		age: pa.age,
		watch: pa.watch,
		valueFuzz: pa.valueFuzz,
		// Ratings - just take the only entry
		ovr: pa.ratings.at(-1).ovr,
		pot: pa.ratings.at(-1).pot,
		skills: pa.ratings.at(-1).skills,
		pos: pa.ratings.at(-1).pos,
		rank: i + 1,
	}));

	return {
		players: players2,
		season,
	};
};

const updateDraftScouting = async (
	inputs: unknown,
	updateEvents: UpdateEvents,
) => {
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("playerMovement")
	) {
		// In fantasy draft, use temp tid
		const tid =
			g.get("phase") === PHASE.FANTASY_DRAFT
				? PLAYER.UNDRAFTED_FANTASY_TEMP
				: PLAYER.UNDRAFTED;

		// Once a new draft class is generated, if the next season hasn't started, need to bump up year numbers
		const seasonOffset = g.get("phase") >= PHASE.RESIGN_PLAYERS ? 1 : 0;

		const firstSeason = g.get("season") + seasonOffset;

		const players = (
			await idb.cache.players.indexGetAll("playersByDraftYearRetiredYear", [
				[firstSeason],
				[Infinity, Infinity],
			])
		).filter(p => p.tid === tid);

		let maxDraftYear = firstSeason + 2;
		for (const p of players) {
			if (p.draft.year > maxDraftYear) {
				maxDraftYear = p.draft.year;
			}
		}

		const seasons: Awaited<ReturnType<typeof getSeason>>[] = [];
		for (let season = firstSeason; season <= maxDraftYear; season++) {
			seasons.push(await getSeason(players, season));
		}

		return {
			challengeNoRatings: g.get("challengeNoRatings"),
			draftType: g.get("draftType"),
			godMode: g.get("godMode"),
			seasons,
		};
	}
};

export default updateDraftScouting;
