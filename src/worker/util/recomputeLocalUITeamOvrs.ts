import { groupBy, range } from "../../common/utils.ts";
import { getActualPlayThroughInjuries } from "../core/game/loadTeams.ts";
import { player, team } from "../core/index.ts";
import { idb } from "../db/index.ts";
import g from "./g.ts";
import toUI from "./toUI.ts";

const recomputeLocalUITeamOvrs = async () => {
	const players = (
		await idb.cache.players.indexGetAll("playersByTid", [
			0, // Active players have tid >= 0
			Infinity,
		])
	).map((p) => ({
		pid: p.pid,
		tid: p.tid,
		injury: p.injury,
		value: p.value,
		ratings: {
			ovr: player.fuzzRating(p.ratings.at(-1)!.ovr, p.ratings.at(-1)!.fuzz),
			ovrs: player.fuzzOvrs(p.ratings.at(-1)!.ovrs, p.ratings.at(-1)!.fuzz),
			pos: p.ratings.at(-1)!.pos,
		},
	}));
	const playersByTid = groupBy(players, "tid");

	const teams = await idb.cache.teams.getAll();

	const ovrs = range(g.get("numTeams")).map((tid) => {
		const t = teams[tid]!;

		return team.ovr(playersByTid[tid] ?? [], {
			accountForInjuredPlayers: {
				numDaysInFuture: 0,
				playThroughInjuries: getActualPlayThroughInjuries(t),
			},
		});
	});

	await toUI("updateTeamOvrs", [ovrs]);
};

export default recomputeLocalUITeamOvrs;
