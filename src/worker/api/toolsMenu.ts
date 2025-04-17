import { PHASE } from "../../common/index.ts";
import type { Conditions } from "../../common/types.ts";
import { league, phase } from "../core/index.ts";
import { reset } from "../db/index.ts";
import { toUI } from "../util/index.ts";

const toolsMenu = {
	autoPlaySeasons: (param: unknown, conditions: Conditions) => {
		return league.initAutoPlay(conditions);
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
	resetDb: async (param: unknown, conditions: Conditions) => {
		const response = await toUI("confirmDeleteAllLeagues", [], conditions);

		if (response) {
			await reset(response);
		}

		return response;
	},
};

export default toolsMenu;
