import { draft } from "../..";
import { PHASE, PLAYER } from "../../../../common";
import type { PlayerWithoutKey } from "../../../../common/types";
import { g } from "../../../util";

const addDraftProspects = async ({
	players,
	scoutingRank,
}: {
	players: PlayerWithoutKey[];
	scoutingRank: number;
}) => {
	const seasonOffset = g.get("phase") >= PHASE.RESIGN_PLAYERS ? 1 : 0;
	const existingDraftClasses: [any[], any[], any[]] = [[], [], []];
	for (const p of players) {
		if (p.tid === PLAYER.UNDRAFTED) {
			if (p.draft.year === g.get("season") + seasonOffset) {
				existingDraftClasses[0].push(p);
			} else if (p.draft.year === g.get("season") + seasonOffset + 1) {
				existingDraftClasses[1].push(p);
			} else if (p.draft.year === g.get("season") + seasonOffset + 2) {
				existingDraftClasses[2].push(p);
			}
		}
	}

	// If the draft has already happened this season but next year's class hasn't been bumped up, don't create any PLAYER.UNDRAFTED
	if (g.get("phase") >= 0) {
		if (
			g.get("phase") <= PHASE.DRAFT_LOTTERY ||
			g.get("phase") >= PHASE.RESIGN_PLAYERS
		) {
			const draftClass = await draft.genPlayersWithoutSaving(
				g.get("season") + seasonOffset,
				scoutingRank,
				existingDraftClasses[0],
			);
			players.push(...draftClass);
		}

		{
			const draftClass = await draft.genPlayersWithoutSaving(
				g.get("season") + 1 + seasonOffset,
				scoutingRank,
				existingDraftClasses[1],
			);
			players.push(...draftClass);
		}

		{
			const draftClass = await draft.genPlayersWithoutSaving(
				g.get("season") + 2 + seasonOffset,
				scoutingRank,
				existingDraftClasses[2],
			);
			players.push(...draftClass);
		}
	}
};

export default addDraftProspects;
