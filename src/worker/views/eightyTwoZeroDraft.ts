import { PHASE, REAL_PLAYERS_INFO } from "../../common/constants.ts";
import type { Phase } from "../../common/types.ts";
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

	return {
		activeDraftErrorMessage: getActiveDraftErrorMessage(g.get("phase")),
		godMode: g.get("godMode"),
		loading: false,
		realTeamInfo: await getRealTeamInfo(),
		realPlayers: REAL_PLAYERS_INFO !== undefined,
		started: draft !== undefined,
		...(draft ?? {
			currentTeam: undefined,
			picks: [],
			round: 1,
		}),
	};
};

export default updateEightyTwoZeroDraft;
