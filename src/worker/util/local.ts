import type { Local } from "../../common/types.ts";
import { UndoLog } from "./UndoLog.ts";

// These persist when the user switches leagues
type AccountKey =
	| "email"
	| "goldUntil"
	| "mailingList"
	| "undoLog"
	| "username";

// These variables are transient and will be reset every refresh, and also when the user switches leagues. See lock.js for more.
const getLeagueLocal = (): Omit<Local, AccountKey> => ({
	autoPlayUntil: undefined,
	autoSave: true,
	eightyTwoZeroDraft: undefined,
	exhibitionGamePlayers: undefined,
	fantasyDraftResults: [],
	minFractionDiffs: undefined,
	leagueLoaded: false,
	liveSimRatingsStatsPopoverPlayers: undefined,
	phaseText: "",
	playerBioInfo: undefined,
	playerOvrMean: 47,
	playerOvrStd: 10,
	playerOvrMeanStdStale: true,
	realPlayerActiveSeasons: undefined, // Since there may be different tids in different leagues
	seasonLeaders: undefined,
	playingUntilEndOfRound: false,
	statusText: "Idle",
	unviewedSeasonSummary: false, // Set to true when a live game sim of the final game prevents an automatic redirect to the season summary page
});

const local: Local & {
	reset: () => void;
} = {
	...getLeagueLocal(),
	email: undefined,
	goldUntil: Infinity, // Default is to assume Gold, until told otherwise by server
	mailingList: false, // Default, until told otherwise by server
	undoLog: new UndoLog(),
	username: undefined,
	reset: () => {
		Object.assign(local, getLeagueLocal());
		local.undoLog.invalidate("leagueChange");
	},
};

export default local;
