import type { VersionChangeTransaction } from "../../connectLeague.ts";
import { updatePlayerAwards } from "./updatePlayerAwards.ts";
import { getOldAwardsByPlayer } from "./getOldAwardsByPlayer.ts";
import type { OldAwards } from "./types.ts";
import { getNewAwardsByPlayer } from "./getNewAwardsByPlayer.ts";
import { oldAwardsToNewAwards } from "./oldAwardsToNewAwards.ts";
import { defaultGameAttributes } from "../../../../common/defaultGameAttributes.ts";

export const migrate73 = async (transaction: VersionChangeTransaction) => {
	const awardsToDelete = [];
	const awardsToSave = [];
	for await (const cursor of transaction.objectStore("awards")) {
		const oldAwards = cursor.value as unknown as OldAwards;

		// Quick sanity check in case awards is actually in the new format somehow
		if ((oldAwards as any).awards) {
			continue;
		}

		const newAwards = oldAwardsToNewAwards(oldAwards);
		awardsToDelete.push(...getOldAwardsByPlayer(oldAwards));
		awardsToSave.push(...getNewAwardsByPlayer(newAwards));

		await cursor.update(newAwards);
	}

	await updatePlayerAwards({
		awardsToDelete,
		awardsToSave,
		playerStore: transaction.objectStore("players"),
	});

	const awards = await transaction.objectStore("gameAttributes").get("awards");
	if (!awards) {
		await transaction.objectStore("gameAttributes").put({
			key: "awards",
			value: defaultGameAttributes.awards,
		});
	}
};
