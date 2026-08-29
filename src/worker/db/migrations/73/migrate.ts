import { PLAYER } from "../../../../common/constants.ts";
import type { Awards2 } from "../../../../common/types.ts";
import type { VersionChangeTransaction } from "../../connectLeague.ts";
import { updatePlayerAwards } from "./updatePlayerAwards.ts";
import { getOldAwardsByPlayer } from "./getOldAwardsByPlayer.ts";
import type { OldAwards } from "./types.ts";
import { getNewAwardsByPlayer } from "./getNewAwardsByPlayer.ts";
import { parseOldAwards } from "./parseOldAwards.ts";

export const migrate73 = async (transaction: VersionChangeTransaction) => {
	for await (const cursor of transaction.objectStore("awards")) {
		const oldAwards = cursor.value as unknown as OldAwards;

		// Quick sanity check in case awards is actually in the new format somehow
		if ((oldAwards as any).awards) {
			continue;
		}

		// Make new awards object, based on old one

		const bestRecordConfs: Record<number, number> = {};
		if (oldAwards.bestRecordConfs) {
			for (const [cid, row] of oldAwards.bestRecordConfs.entries()) {
				if (row?.tid !== undefined) {
					bestRecordConfs[cid] = row.tid;
				}
			}
		}

		const awards = parseOldAwards(oldAwards);

		const newAwards: Awards2 = {
			season: oldAwards.season,
			bestRecord: oldAwards.bestRecord?.tid ?? PLAYER.DOES_NOT_EXIST,
			bestRecordConfs,
			bestRecordDivs: {},
			awards,
		};

		// Figure out what player awards to delete, based on old awards object
		const oldAwardsByPlayer = getOldAwardsByPlayer(oldAwards);

		// Figure out what new player awards to add, based on new awards object
		const newAwardsByPlayer = getNewAwardsByPlayer(newAwards.awards);

		console.log({ oldAwards, newAwards, oldAwardsByPlayer, newAwardsByPlayer });

		await cursor.update(newAwards);

		await updatePlayerAwards({
			awardsToDelete: oldAwardsByPlayer,
			awardsToSave: newAwardsByPlayer,
			getPlayer: (pid) => transaction.objectStore("players").get(pid),
			putPlayer: (p) => transaction.objectStore("players").put(p),
			season: newAwards.season,
		});
	}
};
