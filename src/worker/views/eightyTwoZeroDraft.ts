import { PHASE, REAL_PLAYERS_INFO } from "../../common/constants.ts";
import type { Phase } from "../../common/types.ts";
import { bySport } from "../../common/sportFunctions.ts";
import { g, local } from "../util/index.ts";
import { getRealTeamInfo } from "./newLeague.ts";

const getActiveDraftErrorMessage = (phase: Phase) => {
	if (phase === PHASE.DRAFT) {
		return "You can't start an 82-0 Draft while a regular draft is already in progress.";
	}

	if (phase === PHASE.FANTASY_DRAFT) {
		return "You can't start an 82-0 Draft while a fantasy draft is already in progress.";
	}

	if (phase === PHASE.EXPANSION_DRAFT) {
		return "You can't start an 82-0 Draft while an expansion draft is already in progress.";
	}
};

const updateEightyTwoZeroDraft = async () => {
	const draft = local.eightyTwoZeroDraft;
	const stats = bySport({
		baseball: ["gp", "keyStats", "war"],
		basketball: ["gp", "min", "pts", "trb", "ast", "per", "ws"],
		football: ["gp", "keyStats", "av"],
		hockey: ["gp", "keyStats", "ops", "dps", "ps"],
	});

	return {
		activeDraftErrorMessage: getActiveDraftErrorMessage(g.get("phase")),
		godMode: g.get("godMode"),
		loading: false,
		realTeamInfo: await getRealTeamInfo(),
		realPlayers: REAL_PLAYERS_INFO !== undefined,
		stats,
		started: draft !== undefined,
		...(draft ?? {
			currentTeam: undefined,
			picks: [],
			round: 1,
		}),
	};
};

export default updateEightyTwoZeroDraft;
