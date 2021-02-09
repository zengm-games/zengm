import type { HeadToHead } from "../../../common/types";
import { idb, iterate } from "../../db";
import { g } from "../../util";

const blankInfo = (tid: number, season: number) => ({
	tid,
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
		tid: number;
		type: "regularSeason" | "playoffs" | "all";
		season: number | "all";
	},
	cb: (info: ReturnType<typeof blankInfo>) => void,
) => {
	const processHeadToHead = (headToHead: HeadToHead) => {
		const numPlayoffRounds = g.get("numGamesPlayoffSeries", headToHead.season)
			.length;

		for (let tid = 0; tid < g.get("numTeams"); tid++) {
			if (tid === options.tid) {
				continue;
			}

			const info = blankInfo(tid, headToHead.season);

			let found = false;
			if (options.type === "regularSeason" || options.type === "all") {
				let record;
				if (tid < options.tid) {
					record = headToHead.regularSeason[tid]?.[options.tid];
				} else {
					record = headToHead.regularSeason[options.tid]?.[tid];
				}

				if (record) {
					found = true;
					info.won += record.won;
					info.lost += record.lost;
					info.tied += record.tied;
					info.otl += record.otl;
					info.pts += record.pts;
					info.oppPts += record.oppPts;
				}
			}

			if (options.type === "playoffs" || options.type === "all") {
				let record;
				let rowIsFirstTid = false;
				if (tid < options.tid) {
					rowIsFirstTid = true;
					record = headToHead.playoffs[tid]?.[options.tid];
				} else {
					record = headToHead.playoffs[options.tid]?.[tid];
				}

				if (record) {
					found = true;
					info.won += record.won;
					info.lost += record.lost;
					info.pts += record.pts;
					info.oppPts += record.oppPts;

					let outcome: typeof record["result"];
					if (record.result === "lost") {
						if (rowIsFirstTid) {
							outcome = "won";
						} else {
							outcome = "lost";
						}
					} else if (record.result === "won") {
						if (rowIsFirstTid) {
							outcome = "lost";
						} else {
							outcome = "won";
						}
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

	let key;
	if (options.season !== "all") {
		key = IDBKeyRange.only(options.season);
	}

	let doCurrentSeasonFromCache = false;
	await iterate(
		idb.league.transaction("headToHeads").store,
		key,
		undefined,
		headToHead => {
			if (headToHead.season === g.get("season")) {
				doCurrentSeasonFromCache = true;
				return;
			}

			processHeadToHead(headToHead);
		},
	);

	if (doCurrentSeasonFromCache) {
		const headToHead = await idb.cache.headToHeads.get(g.get("season"));
		if (headToHead) {
			processHeadToHead(headToHead);
		}
	}
};

export default iterate2;
