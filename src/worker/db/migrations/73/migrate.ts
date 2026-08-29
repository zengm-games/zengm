import { showStatsByType } from "../../../../common/awards.ts";
import { PLAYER, TEAM_AWARD_INFO } from "../../../../common/constants.ts";
import { bySport } from "../../../../common/sportFunctions.ts";
import type {
	AwardInfoIndividual,
	AwardInfoTeam,
	Awards2,
	AwardSettingIndividual,
	AwardSettingTeam,
} from "../../../../common/types.ts";
import { omit } from "../../../../common/utils.ts";
import { getAwardsByPlayer } from "../../../core/awards/awardsByPlayer.ts";
import type { VersionChangeTransaction } from "../../connectLeague.ts";
import { updatePlayerAwards } from "./updatePlayerAwards.ts";
import { defaultAwards, defaultAwardsBasketball } from "./defaultAwards.ts";
import { getOldAwardsByPlayer } from "./getOldAwardsByPlayer.ts";
import type {
	OldAwards,
	OldAwardsBaseball,
	OldAwardsBasketball,
	OldAwardsFootball,
	OldAwardsHockey,
} from "./types.ts";

type WinnerIndividual = Extract<
	AwardInfoIndividual["winner"][number],
	{ pid: number }
>;

type WinnerTeam = Extract<
	AwardInfoTeam["winner"][number][number],
	{ pid: number }
>;

const parseOldAwards = (oldAwardsRaw: OldAwards) => {
	const awards: Awards2["awards"] = [];

	const toTranslate = bySport<
		() => (
			| {
					type: "individual";
					new: AwardSettingIndividual;
					old: { pid: number; tid: number } | undefined;
			  }
			| {
					type: "team";
					new: AwardSettingTeam;
					old: { pid: number; pos?: string; tid: number }[][] | undefined;
			  }
		)[]
	>({
		baseball: () => {
			const oldAwards = oldAwardsRaw as OldAwardsBaseball;
			return [];
		},
		basketball: () => {
			const oldAwards = oldAwardsRaw as OldAwardsBasketball;
			return [
				{
					type: "individual",
					new: defaultAwards.mvp,
					old: oldAwards.mvp,
				},
				{
					type: "individual",
					new: defaultAwardsBasketball.dpoy,
					old: oldAwards.dpoy,
				},
				{
					type: "individual",
					new: defaultAwardsBasketball.roy,
					old: oldAwards.roy,
				},
				{
					type: "individual",
					new: defaultAwardsBasketball.smoy,
					old: oldAwards.smoy,
				},
				{
					type: "individual",
					new: defaultAwardsBasketball.mip,
					old: oldAwards.mip,
				},
				{
					type: "individual",
					new: defaultAwards.fmvp,
					old: oldAwards.finalsMvp,
				},
				{
					type: "individual",
					new: defaultAwardsBasketball.sfmvp,
					old: oldAwards.sfmvp?.[0],
				},
				{
					type: "individual",
					new: defaultAwardsBasketball.sfmvp,
					old: oldAwards.sfmvp?.[1],
				},
				{
					type: "team",
					new: defaultAwards.all,
					old: oldAwards.allLeague.map((team) => team.players),
				},
				{
					type: "team",
					new: defaultAwardsBasketball.def,
					old: oldAwards.allLeague.map((team) => team.players),
				},
				{
					type: "team",
					new: defaultAwards.alr,
					old: [oldAwards.allRookie],
				},
			];
		},
		football: () => {
			const oldAwards = oldAwardsRaw as OldAwardsFootball;
			return [];
		},
		hockey: () => {
			const oldAwards = oldAwardsRaw as OldAwardsHockey;
			return [];
		},
	})();

	for (const row of toTranslate) {
		if (!row.old) {
			continue;
		}

		if (row.type === "individual") {
			const winner: WinnerIndividual = {
				pid: row.old.pid,
				tid: row.old.tid,
			};

			// Save statOverrides for playoff series awards, if possible
			if (typeof row.new.statRange === "number") {
				const stats = showStatsByType[row.new.showStats];
				if (!stats) {
					throw new Error("Invalid showStats");
				}
				winner.statOverrides = {
					score: 0,
				};
				for (const stat of stats) {
					const oldStat = (row.old as any)[stat];
					if (typeof oldStat === "number") {
						winner.statOverrides[stat] = oldStat;
					}
				}
			}

			const award: AwardInfoIndividual = {
				...omit(row.new, ["group"]),
				winner: [winner, {}, {}, {}, {}],
			};

			if (typeof row.new.statRange === "number") {
				// We need to define this so getAwardKey is unique, but we only easily know one of the teams. That's enough though, can't play in two series in the same round!
				const tid =
					award.winner.find((p) => p.tid !== undefined)?.tid ??
					PLAYER.DOES_NOT_EXIST;
				award.group = {
					type: "playoffSeries",
					tids: [PLAYER.DOES_NOT_EXIST, tid],
				};
			}

			awards.push(award);
		} else {
			const award: AwardInfoTeam = {
				...omit(row.new, ["group"]),
				winner: row.old.map((team) =>
					team.map((p) => {
						const winner: WinnerTeam = {
							pid: p.pid,
							tid: p.tid,
						};
						if (TEAM_AWARD_INFO.byPos && p.pos !== undefined) {
							winner.pos = p.pos;
						}

						// No need to set statOverrides because old playoff series awards are all individual

						return winner;
					}),
				),
			};

			awards.push(award);
		}
	}

	return awards;
};

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
		// Can pass empty array as players because we don't care what tid/name anyone has, we're not creating events
		const newAwardsByPlayer = getAwardsByPlayer(newAwards.awards, []);

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
