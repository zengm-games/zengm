import { PHASE } from "../../common/constants.ts";
import type { Conditions } from "../../common/types.ts";
import { league, phase } from "../core/index.ts";
import { getAutoPlayDialogInfo } from "../core/league/initAutoPlay.ts";
import { reset } from "../db/index.ts";

const toolsMenu = {
	// The UI shows its auto play dialog with this, then calls autoPlaySeasons with the user's choice
	getAutoPlayDialogInfo: (param: unknown, conditions: Conditions) => {
		return getAutoPlayDialogInfo(conditions);
	},
	autoPlaySeasons: (
		choice: { season: string; phase: string },
		conditions: Conditions,
	) => {
		return league.initAutoPlay(choice, conditions);
	},
	skipToPlayoffs: async (param: unknown, conditions: Conditions) => {
		await phase.newPhase(PHASE.PLAYOFFS, conditions);
	},
	skipToBeforeDraft: async (param: unknown, conditions: Conditions) => {
		await phase.newPhase(PHASE.DRAFT_LOTTERY, conditions);
	},
	skipToAfterDraft: async (param: unknown, conditions: Conditions) => {
		await phase.newPhase(PHASE.AFTER_DRAFT, conditions);
	},
	skipToPreseason: async (param: unknown, conditions: Conditions) => {
		await phase.newPhase(PHASE.PRESEASON, conditions);
	},
	// The UI confirms before calling this
	resetDb: async (type: "all" | "unstarred") => {
		await reset(type);
	},
};

export default toolsMenu;
