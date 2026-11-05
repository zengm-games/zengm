import { draft, player } from "../index.ts";
import { PLAYER } from "../../../common/constants.ts";
import type { FaceConfig } from "facesjs";
import type {
	PlayerWithoutKey,
	RealPlayerPhotos,
} from "../../../common/types.ts";
import { g, helpers } from "../../util/index.ts";
import type { PreProcessParams } from "./createStream.ts";
import { setContractDemandFromCurrentContract } from "../contract/index.ts";

export const applyRealPlayerPhotos = (
	realPlayerPhotos: RealPlayerPhotos | undefined,
	p: Pick<PlayerWithoutKey, "imgURL" | "srID"> & {
		draft: {
			year: number;
		};
		face?: FaceConfig;
	} & (
			| {
					name?: string;
					firstName: string;
					lastName: string;
			  }
			| {
					name: string;
					firstName?: string;
					lastName?: string;
			  }
		),
) => {
	if (realPlayerPhotos) {
		// Do this before augment so it doesn't need to create a face
		// p.imgURL check means creating a league with specified images does not get overwritten
		if (p.srID && (!p.imgURL || p.imgURL === "/img/blank-face.png")) {
			let realPlayerPhoto = realPlayerPhotos[p.srID];
			if (realPlayerPhoto === undefined) {
				const name = (p.name ?? `${p.firstName} ${p.lastName}`)
					.replaceAll(" ", "_")
					.toLowerCase();

				// Keep in sync with bbgm-rosters
				realPlayerPhoto =
					realPlayerPhotos[`dp_${p.draft.year}_${name}`] ??
					realPlayerPhotos[`dp_${name}`];
			}

			if (typeof realPlayerPhoto === "string") {
				p.imgURL = realPlayerPhoto;
			} else if (realPlayerPhoto !== undefined) {
				// Empty imgURL so the face is displayed rather than the blank face image
				p.imgURL = "";
				p.face = helpers.deepCopy(realPlayerPhoto);
			}
		}
	}
};

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
	applyRealPlayerPhotos(realPlayerPhotos, p);

	const p2: PlayerWithoutKey = await player.augmentPartialPlayer(
		{ ...p },
		scoutingLevel,
		version,
	);

	// No contract info in the file, so his contract demand needs to be normalized. Then for players on a team, that will become their contract.
	const noContractInfo = !p.contract && !p.contracts && !p.contractDemand;
	if (noContractInfo && p2.contractDemand) {
		p2.contractDemand.temp = true;
	}

	// Impute rookie contract status if there is no contract for this player, or if the entire league file has no rookie contracts. Don't check draftPickAutoContract here because we want all rookie contracts to be labeled as such, not just rookie scale contracts.
	if (p2.tid >= 0 && (noContractInfo || !hasRookieContracts)) {
		const rookieContractLength = draft.getRookieContractLength(p2.draft.round);
		const rookieContractExp = p2.draft.year + rookieContractLength;

		if (rookieContractExp >= g.get("season")) {
			(p2 as any).rookieContract = true;
		}
	}

	if (p2.tid >= 0 && !activeTids.includes(p2.tid)) {
		// Like addToFreeAgents
		setContractDemandFromCurrentContract(p2);
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
