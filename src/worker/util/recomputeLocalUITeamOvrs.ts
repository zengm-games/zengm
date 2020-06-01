import range from "lodash/range";
import { player, team } from "../core";
import { idb } from "../db";
import g from "./g";
import toUI from "./toUI";

const recomputeLocalUITeamOvrs = async () => {
	const players = (
		await idb.cache.players.indexGetAll("playersByTid", [
			0, // Active players have tid >= 0
			Infinity,
		])
	).map(p => ({
		pid: p.pid,
		tid: p.tid,
		injury: p.injury,
		ratings: {
			ovr: player.fuzzRating(
				p.ratings[p.ratings.length - 1].ovr,
				p.ratings[p.ratings.length - 1].fuzz,
			),
			pos: p.ratings[p.ratings.length - 1].pos,
		},
	}));

	const ovrs = range(g.get("numTeams")).map(tid => {
		const playersCurrent = players.filter(
			p => p.tid === tid && p.injury.gamesRemaining === 0,
		);
		return team.ovr(playersCurrent);
	});

	toUI("updateTeamOvrs", [ovrs]);
};

export default recomputeLocalUITeamOvrs;
