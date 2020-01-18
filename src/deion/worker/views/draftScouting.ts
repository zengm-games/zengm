import { PHASE, PLAYER } from "../../common";
import { idb } from "../db";
import { g } from "../util";
import { UpdateEvents } from "../../common/types";

const addSeason = async season => {
	// In fantasy draft, use temp tid
	const tid =
		g.get("phase") === PHASE.FANTASY_DRAFT
			? PLAYER.UNDRAFTED_FANTASY_TEMP
			: PLAYER.UNDRAFTED;
	const playersAll2 = (
		await idb.cache.players.indexGetAll("playersByDraftYearRetiredYear", [
			[season],
			[season, Infinity],
		])
	).filter(p => p.tid === tid);
	const playersAll = await idb.getCopies.playersPlus(playersAll2, {
		attrs: ["pid", "nameAbbrev", "age", "valueFuzz", "watch"],
		ratings: ["ovr", "pot", "skills", "fuzz", "pos"],
		showNoStats: true,
		showRookies: true,
		fuzz: true,
	});
	playersAll.sort((a, b) => b.valueFuzz - a.valueFuzz);

	const players = playersAll.map((pa, i) => ({
		pid: pa.pid,
		nameAbbrev: pa.nameAbbrev,
		age: pa.age,
		watch: pa.watch,
		valueFuzz: pa.valueFuzz,
		// Ratings - just take the only entry
		ovr: pa.ratings[0].ovr,
		pot: pa.ratings[0].pot,
		skills: pa.ratings[0].skills,
		pos: pa.ratings[0].pos,
		rank: i + 1,
	}));

	return {
		players,
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
		// Once a new draft class is generated, if the next season hasn't started, need to bump up year numbers
		const seasonOffset = g.get("phase") >= PHASE.RESIGN_PLAYERS ? 1 : 0;
		const seasons = await Promise.all([
			addSeason(g.get("season") + seasonOffset),
			addSeason(g.get("season") + seasonOffset + 1),
			addSeason(g.get("season") + seasonOffset + 2),
		]);
		return {
			draftType: g.get("draftType"),
			seasons,
		};
	}
};

export default updateDraftScouting;
