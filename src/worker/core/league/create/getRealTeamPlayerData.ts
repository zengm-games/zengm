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
	const realPlayerPhotos = (
		fileHasPlayers
			? await idb.meta.get("attributes", "realPlayerPhotos")
			: undefined
	) as RealPlayerPhotos | undefined;

	const realTeamInfo = (
		fileHasTeams ? await idb.meta.get("attributes", "realTeamInfo") : undefined
	) as RealTeamInfo | undefined;

	return {
		realPlayerPhotos,
		realTeamInfo,
	};
};

export default getRealTeamPlayerData;
