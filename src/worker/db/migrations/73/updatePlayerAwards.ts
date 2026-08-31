import fastDeepEqual from "fast-deep-equal";
import addAward from "../../../core/player/addAward.ts";
import type { LeagueDB } from "../../connectLeague.ts";
import type { IDBPObjectStore } from "@dumbmatter/idb";
import type { PlayerAward } from "../../../../common/types.ts";

// This is like updatePlayerAwards from awardsByPlayer.ts except it uses VersionChangeTransaction and also has some unneeded stuff deleted. Also nice to have this frozen in time so any future updates to the main function don't have to worry about this migration.

export type AwardByPlayerMigrate73 = {
	pid: number;
	award: PlayerAward;
};

export const updatePlayerAwards = async ({
	awardsToDelete,
	awardsToSave,
	playerStore,
}: {
	awardsToDelete: AwardByPlayerMigrate73[];
	awardsToSave: AwardByPlayerMigrate73[];
	playerStore: IDBPObjectStore<
		LeagueDB,
		["players"],
		"players",
		"readwrite" | "versionchange"
	>;
}) => {
	const toDeleteByPid = Map.groupBy(awardsToDelete, (award) => award.pid);
	const toSaveByPid = Map.groupBy(awardsToSave, (award) => award.pid);
	const allPids = new Set([...toDeleteByPid.keys(), ...toSaveByPid.keys()]);

	const awardsByPid = new Map<
		number,
		{ toDelete: AwardByPlayerMigrate73[]; toSave: AwardByPlayerMigrate73[] }
	>();
	for (const pid of allPids) {
		awardsByPid.set(pid, {
			toDelete: toDeleteByPid.get(pid) ?? [],
			toSave: toSaveByPid.get(pid) ?? [],
		});
	}

	for (const [pid, { toDelete, toSave }] of awardsByPid) {
		const p = await playerStore.get(pid);
		if (p) {
			p.awards = p.awards.filter((award) => {
				// Delete this award if it matches any of toDelete
				for (const { award: awardToDelete } of toDelete) {
					if (fastDeepEqual(awardToDelete, award)) {
						return false;
					}
				}

				return true;
			});

			for (const { award } of toSave) {
				addAward(p, award);
			}
			await playerStore.put(p);
		}
	}
};
