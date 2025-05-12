import type {
	RealPlayerPhotos,
	RealTeamInfo,
} from "../../../../common/types.ts";
import { idb } from "../../../db/index.ts";

const getRealTeamPlayerData = async ({
	fileHasPlayers,
	fileHasTeams,
}: {
	fileHasPlayers: boolean;
	fileHasTeams: boolean;
}) => {
	let realPlayerPhotos;
	let realTeamInfo;
	if (fileHasPlayers || fileHasTeams) {
		const attributesStore = (await idb.meta.transaction("attributes")).store;
		if (fileHasPlayers) {
			realPlayerPhotos = (await attributesStore.get("realPlayerPhotos")) as
				| RealPlayerPhotos
				| undefined;
		}
		if (fileHasTeams) {
			realTeamInfo = (await attributesStore.get("realTeamInfo")) as
				| RealTeamInfo
				| undefined;
		}
	}

	return {
		realPlayerPhotos,
		realTeamInfo,
	};
};

export default getRealTeamPlayerData;
