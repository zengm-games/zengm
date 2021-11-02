import { orderBy } from "lodash";
import { bySport, processPlayerStats } from "../../../common";

const getBestPlayer = (players: any[]) => {
	if (players.length === 0) {
		return;
	}

	return bySport({
		basketball: () => {
			// Based on https://fansided.com/2017/04/10/updating-dre-tweaks/ but with blk increased because otherwise it'd basically never get selected, and pts lower to account for the negative terms kind of
			const factors: [string, number][] = [
				["pts", 0.4],
				["trb", 0.5],
				["ast", 0.5],
				["blk", 1.7],
				["stl", 1.7],
			];
			const stats = factors.map(factor => factor[0]);

			const scores = players.map(p => {
				const processedStats = processPlayerStats(p, stats);

				const components: [string, number][] = factors.map(([stat, weight]) => [
					stat,
					processedStats[stat] * weight,
				]);

				const score = components.reduce((sum, value) => sum + value[1], 0);
				return {
					components,
					p,
					processedStats,
					score,
				};
			});

			const best = orderBy(scores, "score", "desc")[0];

			const componentsSorted = orderBy(best.components, "1", "desc").slice(
				0,
				3,
			);

			const statTexts = [];
			for (const [stat, score] of componentsSorted) {
				if (score > 0) {
					statTexts.push(stat);
				}
			}

			// Sort to be same order as `factors` above
			const statTextsSorted = orderBy(
				statTexts,
				stat => factors.findIndex(row => row[0] === stat),
				"asc",
			);

			return {
				p: best.p,
				statText: statTextsSorted
					.map(stat => `${best.processedStats[stat]} ${stat}`)
					.join(", "),
			};
		},
		football: () => {
			// Based on fantasy points, with added stuff for defense too
			ps.pssYds / 25 +
				4 * ps.pssTD +
				(ps.rusYds + ps.recYds) / 10 +
				6 * (ps.rusTD + ps.recTD + ps.prTD + ps.krTD) -
				2 * (ps.pssInt + ps.fmb) +
				ps.xp +
				3 * ps.fg0 +
				3 * ps.fg20 +
				3 * ps.fg30 +
				4 * ps.fg40 +
				5 * ps.fg50;
		},
		hockey: () => {},
	})();
};

export default getBestPlayer;
