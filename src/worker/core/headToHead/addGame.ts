import { PHASE } from "../../../common";
import getWinner from "../../../common/getWinner";
import type { HeadToHead } from "../../../common/types";
import { idb } from "../../db";
import { g } from "../../util";

const addGame = async ({
	tids,
	pts,
	sPts,
	overtime,
	playoffRound,
	seriesWinner,
	season = g.get("season"),
	playoffs = g.get("phase") === PHASE.PLAYOFFS,
}: {
	tids: [number, number];
	pts: [number, number];
	sPts: [number, number] | undefined;
	overtime: boolean;
	playoffRound?: number;
	seriesWinner?: number;
	season?: number;
	playoffs?: boolean;
}) => {
	const otl = g.get("otl", season);

	const headToHead: HeadToHead = (await idb.cache.headToHeads.get(season)) ?? {
		season,
		regularSeason: {},
		playoffs: {},
	};

	const minTid = Math.min(...tids);
	const i = tids.indexOf(minTid);
	const j = i === 0 ? 1 : 0;
	const t0 = tids[i];
	const t1 = tids[j];

	// All-Star Game
	if (t0 < 0 || t1 < 0) {
		return;
	}

	const winner = getWinner([
		{
			pts: pts[i],
			sPts: sPts?.[i],
		},
		{
			pts: pts[j],
			sPts: sPts?.[j],
		},
	]);

	if (!playoffs) {
		if (!headToHead.regularSeason[t0]) {
			headToHead.regularSeason[t0] = {};
		}

		if (!headToHead.regularSeason[t0][t1]) {
			headToHead.regularSeason[t0][t1] = {
				won: 0,
				lost: 0,
				tied: 0,
				otl: 0,
				otw: 0,
				pts: 0,
				oppPts: 0,
			};
		}

		if (winner === 0) {
			if (overtime && otl) {
				headToHead.regularSeason[t0][t1].otw += 1;
			} else {
				headToHead.regularSeason[t0][t1].won += 1;
			}
		} else if (winner === -1) {
			headToHead.regularSeason[t0][t1].tied += 1;
		} else {
			if (overtime && otl) {
				headToHead.regularSeason[t0][t1].otl += 1;
			} else {
				headToHead.regularSeason[t0][t1].lost += 1;
			}
		}

		headToHead.regularSeason[t0][t1].pts += pts[i];
		headToHead.regularSeason[t0][t1].oppPts += pts[j];
	} else {
		if (!headToHead.playoffs[t0]) {
			headToHead.playoffs[t0] = {};
		}

		if (!headToHead.playoffs[t0][t1]) {
			if (playoffRound === undefined) {
				// In some weird cases (like game in schedule still after playoffs end) this can happen. Maybe would be better to make this a hard error and prevent this from ever happening, but headToHead is just not that important of a feature.
				return;
			}

			headToHead.playoffs[t0][t1] = {
				round: playoffRound,
				result: undefined,
				won: 0,
				lost: 0,
				pts: 0,
				oppPts: 0,
			};
		}

		if (winner === 0) {
			headToHead.playoffs[t0][t1].won += 1;
		} else {
			headToHead.playoffs[t0][t1].lost += 1;
		}

		headToHead.playoffs[t0][t1].pts += pts[i];
		headToHead.playoffs[t0][t1].oppPts += pts[j];

		if (seriesWinner === tids[i]) {
			headToHead.playoffs[t0][t1].result = "won";
		} else if (seriesWinner === tids[j]) {
			headToHead.playoffs[t0][t1].result = "lost";
		}
	}

	await idb.cache.headToHeads.put(headToHead);
};

export default addGame;
