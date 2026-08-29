import type { VersionChangeTransaction } from "../../connectLeague.ts";
import { updatePlayerAwards } from "./updatePlayerAwards.ts";
import { getOldAwardsByPlayer } from "./getOldAwardsByPlayer.ts";
import type { OldAwards } from "./types.ts";
import { getNewAwardsByPlayer } from "./getNewAwardsByPlayer.ts";
import { oldAwardsToNewAwards } from "./oldAwardsToNewAwards.ts";

export const migrate73 = async (transaction: VersionChangeTransaction) => {
	for await (const cursor of transaction.objectStore("awards")) {
		const oldAwards = cursor.value as unknown as OldAwards;

		// Quick sanity check in case awards is actually in the new format somehow
		if ((oldAwards as any).awards) {
			continue;
		}

		const newAwards = oldAwardsToNewAwards(oldAwards);
		const awardsToDelete = getOldAwardsByPlayer(oldAwards);
		const awardsToSave = getNewAwardsByPlayer(newAwards.awards);

		console.log({ oldAwards, newAwards, awardsToDelete, awardsToSave });

		await cursor.update(newAwards);

		await updatePlayerAwards({
			awardsToDelete,
			awardsToSave,
			getPlayer: (pid) => transaction.objectStore("players").get(pid),
			putPlayer: (p) => transaction.objectStore("players").put(p),
			season: newAwards.season,
		});
	}
};
