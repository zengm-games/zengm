import { PHASE } from "../../../common/constants.ts";
import { idb } from "../../db/index.ts";
import { actualPhase } from "../../util/actualPhase.ts";
import g from "../../util/g.ts";

export const initializeNba2027 = async () => {
	const RESTRICTED_1_PICK = 1;
	const RESTRICTED_5_PICK = 5;

	const teams = await idb.cache.teams.getAll();

	// Look back to the past 2 completed draft lotteries
	let lastDraftLotterySeason = g.get("season");
	const phase = actualPhase();

	// Check existence of draftLotteryResults first, to handle any edge case where that is prespecified like in real player leagues during the playoffs
	let lastDraftLotteryResults = await idb.getCopy.draftLotteryResults({
		season: lastDraftLotterySeason,
	});
	if (!lastDraftLotteryResults) {
		// Lottery must not have happened yet
		if (phase <= PHASE.DRAFT_LOTTERY) {
			lastDraftLotterySeason -= 1;

			lastDraftLotteryResults = await idb.getCopy.draftLotteryResults({
				season: lastDraftLotterySeason,
			});
		}
	}

	const restricted1ByTid: Record<number, boolean> = {};
	const restricted5ByTid: Record<number, 1 | 2> = {};

	if (lastDraftLotteryResults) {
		// We can check last season from draftLotteryResults!
		for (const row of lastDraftLotteryResults.result) {
			if (row.pick === RESTRICTED_1_PICK) {
				console.log("FIRST PICK", row);
				restricted1ByTid[row.originalTid] = true;
			} else if (row.pick <= RESTRICTED_5_PICK) {
				restricted5ByTid[row.originalTid] = 1;
			}
		}
	} else {
		// We need to check players, since draft lottery results are missing
		const players = await idb.getCopies.players(
			{
				draftYear: lastDraftLotterySeason,
			},
			"noCopyCache",
		);
		for (const p of players) {
			if (p.draft.round !== 1) {
				continue;
			}
			if (p.draft.pick === RESTRICTED_1_PICK) {
				restricted1ByTid[p.draft.originalTid] = true;
			} else if (p.draft.pick <= RESTRICTED_5_PICK) {
				restricted5ByTid[p.draft.originalTid] = 1;
			}
		}
	}

	// Check one season further back for restricted5
	const olderDraftLotterySeason = lastDraftLotterySeason - 1;
	const olderDraftLotteryResults = await idb.getCopy.draftLotteryResults({
		season: olderDraftLotterySeason,
	});
	if (olderDraftLotteryResults) {
		// We can check last season from draftLotteryResults!
		for (const row of olderDraftLotteryResults.result) {
			if (
				restricted5ByTid[row.originalTid] === 1 &&
				row.pick <= RESTRICTED_5_PICK
			) {
				restricted5ByTid[row.originalTid] = 2;
			}
		}
	} else {
		// We need to check players, since draft lottery results are missing
		const players = await idb.getCopies.players(
			{
				draftYear: olderDraftLotterySeason,
			},
			"noCopyCache",
		);
		for (const p of players) {
			if (p.draft.round !== 1) {
				continue;
			}
			if (
				restricted5ByTid[p.draft.originalTid] === 1 &&
				p.draft.pick <= RESTRICTED_5_PICK
			) {
				restricted5ByTid[p.draft.originalTid] = 2;
			}
		}
	}

	for (const t of teams) {
		// type check is for importing leagues, cause this gets run but might already have a value
		if (t.disabled || t.draftLottery?.type === "nba2027") {
			continue;
		}

		const restricted1 = restricted1ByTid[t.tid];
		const restricted5 = restricted5ByTid[t.tid];
		if (restricted1 || restricted5) {
			t.draftLottery = {
				type: "nba2027",
			};
			if (restricted1) {
				t.draftLottery.restricted1 = restricted1;
			}
			if (restricted5) {
				t.draftLottery.restricted5 = restricted5;
			}
		}
		await idb.cache.teams.put(t);
	}
};

export const disableNba2027 = async () => {
	const teams = await idb.cache.teams.getAll();

	for (const t of teams) {
		if (t.draftLottery?.type === "nba2027") {
			delete t.draftLottery;
			await idb.cache.teams.put(t);
		}
	}
};
