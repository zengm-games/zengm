import { PHASE, WEBSITE_ROOT } from "../../../common/index.ts";
import finalize from "./finalize.ts";
import newPhasePreseason from "./newPhasePreseason.ts";
import newPhaseRegularSeason from "./newPhaseRegularSeason.ts";
import newPhaseAfterTradeDeadline from "./newPhaseAfterTradeDeadline.ts";
import newPhasePlayoffs from "./newPhasePlayoffs.ts";
import newPhaseBeforeDraft from "./newPhaseBeforeDraft.ts";
import newPhaseDraft from "./newPhaseDraft.ts";
import newPhaseAfterDraft from "./newPhaseAfterDraft.ts";
import newPhaseResignPlayers from "./newPhaseResignPlayers.ts";
import newPhaseFreeAgency from "./newPhaseFreeAgency.ts";
import newPhaseFantasyDraft from "./newPhaseFantasyDraft.ts";
import newPhaseExpansionDraft from "./newPhaseExpansionDraft.ts";
import {
	g,
	lock,
	logEvent,
	updatePlayMenu,
	updateStatus,
	local,
} from "../../util/index.ts";
import type { Conditions, Phase } from "../../../common/types.ts";

/**
 * Set a new phase of the game.
 *
 * @memberOf core.phase
 * @param {number} phase Numeric phase ID. This should always be one of the PHASE.* variables defined in globals.js.
 * @param {} extra Parameter containing extra info to be passed to phase changing function. Currently only used for newPhaseFantasyDraft.
 * @return {Promise}
 */
const newPhase = async (phase: Phase, conditions: Conditions, extra?: any) => {
	// Prevent at least some cases of code running twice
	if (phase === g.get("phase")) {
		return;
	}

	if (g.get("phase") < 0) {
		throw new Error(
			"Can't call newPhase when expansion/fantasy draft is in progress",
		);
	}

	const phaseChangeInfo = {
		[PHASE.PRESEASON]: {
			func: newPhasePreseason,
		},
		[PHASE.REGULAR_SEASON]: {
			func: newPhaseRegularSeason,
		},
		[PHASE.AFTER_TRADE_DEADLINE]: {
			func: newPhaseAfterTradeDeadline,
		},
		[PHASE.PLAYOFFS]: {
			func: newPhasePlayoffs,
		},
		[PHASE.DRAFT_LOTTERY]: {
			func: newPhaseBeforeDraft,
		},
		[PHASE.DRAFT]: {
			func: newPhaseDraft,
		},
		[PHASE.AFTER_DRAFT]: {
			func: newPhaseAfterDraft,
		},
		[PHASE.RESIGN_PLAYERS]: {
			func: newPhaseResignPlayers,
		},
		[PHASE.FREE_AGENCY]: {
			func: newPhaseFreeAgency,
		},
		[PHASE.FANTASY_DRAFT]: {
			func: newPhaseFantasyDraft,
		},
		[PHASE.EXPANSION_DRAFT]: {
			func: newPhaseExpansionDraft,
		},
	};

	if (lock.get("newPhase")) {
		logEvent(
			{
				type: "error",
				text: "Phase change already in progress.",
				saveToDb: false,
			},
			conditions,
		);
	} else {
		try {
			await lock.set("newPhase", true);

			if (
				local.autoPlayUntil &&
				(local.autoPlayUntil.season < g.get("season") ||
					(local.autoPlayUntil.season === g.get("season") &&
						local.autoPlayUntil.phase <= phase) ||
					(local.autoPlayUntil.season === g.get("season") + 1 &&
						local.autoPlayUntil.phase === PHASE.PRESEASON &&
						phase === PHASE.PRESEASON))
			) {
				console.log(
					`Auto play done in ${
						(Date.now() - local.autoPlayUntil.start) / 1000
					} seconds`,
				);
				local.autoPlayUntil = undefined;
			}

			await updateStatus("Processing...");
			await updatePlayMenu();

			if (phaseChangeInfo[phase]) {
				const result = await phaseChangeInfo[phase].func(conditions, extra);

				await finalize(phase, conditions, result);
			} else {
				throw new Error(`Unknown phase number ${phase}`);
			}
		} catch (error) {
			await lock.set("newPhase", false);
			await updatePlayMenu();
			logEvent(
				{
					type: "error",
					text: `Critical error during phase change. <a href="https://${WEBSITE_ROOT}/manual/debugging/"><b>Read this to learn about debugging.</b></a>`,
					saveToDb: false,
					persistent: true,
				},
				conditions,
			);
			throw error;
		}
	}
};

export default newPhase;
