import { draft, player } from "..";
import { PLAYER } from "../../../common";
import type { PlayerWithoutKey } from "../../../common/types";
import { g } from "../../util";
import type { PreProcessParams } from "./createStream";

const processPlayerNewLeague = async ({
	p,
	activeTids,
	hasRookieContracts,
	noStartingInjuries,
	realPlayerPhotos,
	scoutingLevel,
	version,
}: {
	p: any;
} & Pick<
	PreProcessParams,
	| "activeTids"
	| "hasRookieContracts"
	| "noStartingInjuries"
	| "realPlayerPhotos"
	| "scoutingLevel"
	| "version"
>) => {
	if (realPlayerPhotos) {
		// Do this before augment so it doesn't need to create a face
		if (p.srID) {
			if (realPlayerPhotos[p.srID] !== undefined) {
				p.imgURL = realPlayerPhotos[p.srID];
			} else {
				const name = p.name ?? `${p.firstName} ${p.lastName}`;

				// Keep in sync with bbgm-rosters
				const key = `dp_${p.draft.year}_${name
					.replace(/ /g, "_")
					.toLowerCase()}`;
				if (realPlayerPhotos[key] !== undefined) {
					p.imgURL = realPlayerPhotos[key];
				}
			}
		}
	}

	const p2: PlayerWithoutKey = await player.augmentPartialPlayer(
		{ ...p },
		scoutingLevel,
		version,
		true,
	);
	if (!p.contract) {
		p2.contract.temp = true;
		if (!p.salaries) {
			p2.salaries = [];
		}
	}

	// Impute rookie contract status if there is no contract for this player, or if the entire league file has no rookie contracts. Don't check draftPickAutoContract here because we want all rookie contracts to be labeled as such, not just rookie scale contracts.
	if (p2.tid >= 0 && (!p.contract || !hasRookieContracts)) {
		const rookieContractLength = draft.getRookieContractLength(p2.draft.round);
		const rookieContractExp = p2.draft.year + rookieContractLength;

		if (rookieContractExp >= g.get("season")) {
			(p2 as any).rookieContract = true;
		}
	}

	if (p2.tid >= 0 && !activeTids.includes(p2.tid)) {
		p2.tid = PLAYER.FREE_AGENT;
	}

	if (noStartingInjuries && p.injury) {
		p2.injury = {
			type: "Healthy",
			gamesRemaining: 0,
		};
	}

	return p2;
};

export default processPlayerNewLeague;
