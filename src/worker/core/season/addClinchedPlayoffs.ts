import type { TeamFiltered } from "../../../common/types";
import { PHASE } from "../../../common";
import { helpers, g } from "../../util";
import genPlayoffSeries from "./genPlayoffSeries";

type ClinchedPlayoffs = "x" | "y" | "z" | undefined;

const addClinchedPlayoffs = <
	T extends TeamFiltered<
		["tid"],
		["won", "lost", "tied", "cid", "did"],
		any,
		number
	>
>(
	teams: T[],
	season: number = g.get("season"),
): (T & {
	clinchedPlayoffs?: "x" | "y" | "z" | undefined;
})[] => {
	if (g.get("season") < season || g.get("phase") >= PHASE.PLAYOFFS) {
		return teams;
	}

	return teams.map(t => {
		const worstCases = teams.map(t2 => {
			const gp = t2.seasonAttrs.won + t2.seasonAttrs.lost + t2.seasonAttrs.tied;
			const gamesLeft = g.get("numGames") - gp;

			const worstCase = {
				tid: t2.tid,
				seasonAttrs: {
					won: t2.seasonAttrs.won,
					lost: t2.seasonAttrs.lost,
					tied: t2.seasonAttrs.tied,
					winp: 0,
					cid: t2.seasonAttrs.cid,
					did: t2.seasonAttrs.did,
				},
			};

			if (gamesLeft > 0) {
				if (t2.tid === t.tid) {
					// 0.1 extra is to simulate team losing all tie breakers
					worstCase.seasonAttrs.lost += gamesLeft + 0.1;
				} else {
					worstCase.seasonAttrs.won += gamesLeft;
				}
			}
			worstCase.seasonAttrs.winp = helpers.calcWinp(worstCase.seasonAttrs);

			return worstCase;
		});

		const sorted = helpers.orderByWinp(worstCases);

		// x - clinched playoffs
		// y - if byes exist - clinched bye
		// z - clinched home court advantage
		let clinchedPlayoffs: ClinchedPlayoffs;

		if (sorted[0].tid === t.tid) {
			clinchedPlayoffs = "z";
		} else {
			const result = genPlayoffSeries(sorted);
			const matchups = result.series[0];
			for (const matchup of matchups) {
				if (!matchup.away && matchup.home.tid === t.tid) {
					clinchedPlayoffs = "y";
					break;
				}
			}

			if (!clinchedPlayoffs) {
				if (result.tidPlayoffs.includes(t.tid)) {
					clinchedPlayoffs = "x";
				}
			}
		}

		return {
			...t,
			clinchedPlayoffs,
		};
	});
};

export default addClinchedPlayoffs;
