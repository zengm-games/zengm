import {
	RealPlayerPhotosSchema,
	RealTeamInfoSchema,
	type Conditions,
} from "../../../../common/types.ts";
import { idb } from "../../../db/index.ts";
import logEvent from "../../../util/logEvent.ts";

const getRealTeamPlayerData = async (
	{
		fileHasPlayers,
		fileHasTeams,
	}: {
		fileHasPlayers: boolean;
		fileHasTeams: boolean;
	},
	conditions: Conditions | undefined,
) => {
	let realPlayerPhotos;
	let realTeamInfo;
	if (fileHasPlayers || fileHasTeams) {
		const attributesStore = (await idb.meta.transaction("attributes")).store;
		if (fileHasPlayers) {
			const result = RealPlayerPhotosSchema.safeParse(
				await attributesStore.get("realPlayerPhotos"),
			);
			if (result.success) {
				realPlayerPhotos = result.data;
			} else {
				console.error(result.error);
				logEvent(
					{
						type: "error",
						text: "Invalid real player photos data ignored.",
						saveToDb: false,
					},
					conditions,
				);
			}
		}
		if (fileHasTeams) {
			const result = RealTeamInfoSchema.safeParse(
				await attributesStore.get("realTeamInfo"),
			);
			if (result.success) {
				realTeamInfo = result.data;
			} else {
				console.error(result.error);
				logEvent(
					{
						type: "error",
						text: "Invalid real team info data ignored.",
						saveToDb: false,
					},
					conditions,
				);
			}
		}
	}

	return {
		realPlayerPhotos,
		realTeamInfo,
	};
};

export default getRealTeamPlayerData;
