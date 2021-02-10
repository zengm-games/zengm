import type { HeadToHead } from "../../../common/types";
import { idb, iterate } from "../../db";
import { g } from "../../util";

const blankInfo = (tid: number, tid2: number, season: number) => ({
	tid,
	tid2,
	season,
	won: 0,
	lost: 0,
	tied: 0,
	otl: 0,
	pts: 0,
	oppPts: 0,
	seriesWon: 0,
	seriesLost: 0,
	finalsWon: 0,
	finalsLost: 0,
});

const iterate2 = async (
	options: {
		tid: number | "all";
		type: "regularSeason" | "playoffs" | "all";
		season: number | "all";
	},
	cb: (info: ReturnType<typeof blankInfo>) => void,
) => {
	const processHeadToHeadTeam = (headToHead: HeadToHead, tid2: number) => {
		const numPlayoffRounds = g.get("numGamesPlayoffSeries", headToHead.season)
			.length;

		for (let tid = 0; tid < g.get("numTeams"); tid++) {
			if (tid === tid2) {
				continue;
			}

			const info = blankInfo(tid, tid2, headToHead.season);

			let found = false;
			if (options.type === "regularSeason" || options.type === "all") {
				let record;
				let rowIsFirstTid = false;
				if (tid < tid2) {
					rowIsFirstTid = true;
					record = headToHead.regularSeason[tid]?.[tid2];
				} else {
					record = headToHead.regularSeason[tid2]?.[tid];
				}

				if (record) {
					found = true;
					info.tied += record.tied;
					if (rowIsFirstTid) {
						info.won += record.lost + record.otl;
						info.lost += record.won;
						info.otl += record.otw;
						info.pts += record.oppPts;
						info.oppPts += record.pts;
					} else {
						info.won += record.won + record.otw;
						info.lost += record.lost;
						info.otl += record.otl;
						info.pts += record.pts;
						info.oppPts += record.oppPts;
					}
				}
			}

			if (options.type === "playoffs" || options.type === "all") {
				let record;
				let rowIsFirstTid = false;
				if (tid < tid2) {
					rowIsFirstTid = true;
					record = headToHead.playoffs[tid]?.[tid2];
				} else {
					record = headToHead.playoffs[tid2]?.[tid];
				}

				if (record) {
					found = true;

					let outcome: typeof record["result"];
					if (rowIsFirstTid) {
						info.won += record.lost;
						info.lost += record.won;
						info.pts += record.oppPts;
						info.oppPts += record.pts;
						if (record.result === "lost") {
							outcome = "won";
						} else if (record.result === "won") {
							outcome = "lost";
						}
					} else {
						info.won += record.won;
						info.lost += record.lost;
						info.pts += record.pts;
						info.oppPts += record.oppPts;
						outcome = record.result;
					}

					if (outcome === "won") {
						info.seriesWon += 1;
						if (numPlayoffRounds - 1 === record.round) {
							info.finalsWon += 1;
						}
					} else if (outcome === "lost") {
						info.seriesLost += 1;
						if (numPlayoffRounds - 1 === record.round) {
							info.finalsLost += 1;
						}
					}
				}
			}

			if (found) {
				cb(info);
			}
		}
	};

	const processHeadToHead = (headToHead: HeadToHead) => {
		if (options.tid === "all") {
			for (let tid2 = 0; tid2 < g.get("numTeams"); tid2++) {
				processHeadToHeadTeam(headToHead, tid2);
			}
		} else {
			processHeadToHeadTeam(headToHead, options.tid);
		}
	};

	let key;
	if (options.season !== "all") {
		key = IDBKeyRange.only(options.season);
	}

	const currentSeason = g.get("season");

	await iterate(
		idb.league.transaction("headToHeads").store,
		key,
		undefined,
		headToHead => {
			if (headToHead.season === currentSeason) {
				// We'll do this later, from cache
				return;
			}

			processHeadToHead(headToHead);
		},
	);

	if (options.season === "all" || options.season === currentSeason) {
		const headToHead = await idb.cache.headToHeads.get(currentSeason);
		if (headToHead) {
			processHeadToHead(headToHead);
		}
	}
};

export default iterate2;
