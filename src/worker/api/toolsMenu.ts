import { PHASE } from "../../common";
import type { Conditions } from "../../common/types";
import { league, phase } from "../core";
import { reset } from "../db";
import { toUI } from "../util";

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
		console.log("response", response);

		if (response) {
			await reset(response);
		}

		return response;
	},
};

export default toolsMenu;
