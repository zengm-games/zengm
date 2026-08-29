import fastDeepEqual from "fast-deep-equal";
import type { AwardByPlayer } from "../../../core/awards/awardsByPlayer.ts";
import addAward from "../../../core/player/addAward.ts";
import type { Player } from "../../../../common/types.ts";

// These are like saveAwardsByPlayer and deleteAwardsByPlayer from awardsByPlayer.ts but all in one (since we're updating the same player generally) and use VersionChangeTransaction and also don't create events

type MyAwardByPlayer = Pick<AwardByPlayer, "pid" | "award">;

export const updatePlayerAwards = async ({
	awardsToDelete,
	awardsToSave,
	getPlayer,
	putPlayer,
	season,
}: {
	awardsToDelete: MyAwardByPlayer[];
	awardsToSave: MyAwardByPlayer[];
	getPlayer: (pid: number) => Promise<Player | undefined>;
	putPlayer: (p: Player) => Promise<unknown>;
	season: number;
}) => {
	const toDeleteByPid = Map.groupBy(awardsToDelete, (award) => award.pid);
	const toSaveByPid = Map.groupBy(awardsToSave, (award) => award.pid);
	const allPids = new Set([...toDeleteByPid.keys(), ...toSaveByPid.keys()]);

	const awardsByPid = new Map<
		number,
		{ toDelete: MyAwardByPlayer[]; toSave: MyAwardByPlayer[] }
	>();
	for (const pid of allPids) {
		awardsByPid.set(pid, {
			toDelete: toDeleteByPid.get(pid) ?? [],
			toSave: toSaveByPid.get(pid) ?? [],
		});
	}

	for (const [pid, { toDelete, toSave }] of awardsByPid) {
		const p = await getPlayer(pid);
		if (p) {
			console.log("player", p.pid, p.firstName, p.lastName);
			p.awards = p.awards.filter((award) => {
				if (award.season !== season) {
					return true;
				}

				// Delete this award if it matches any of toDelete
				for (const { award: awardToDelete } of toDelete) {
					if (fastDeepEqual({ ...awardToDelete, season }, award)) {
						console.log("delete", award);
						return false;
					}
				}

				return true;
			});

			for (const { award } of toSave) {
				console.log("add", { ...award, season });
				addAward(p, {
					...award,
					season,
				});
			}
			await putPlayer(p);
		} else {
			console.log("player not found:", pid);
		}
	}
};
