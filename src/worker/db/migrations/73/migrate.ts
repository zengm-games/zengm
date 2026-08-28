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
import type { VersionChangeTransaction } from "../../connectLeague.ts";
import { defaultAwards, defaultAwardsBasketball } from "./defaultAwards.ts";
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

const addStatOverrides = <
	NewAward extends AwardSettingIndividual | AwardSettingTeam,
>(
	newAward: NewAward,
	oldAward: any,
	winner: NewAward extends AwardInfoIndividual ? WinnerIndividual : WinnerTeam,
) => {
	// Save statOverrides for playoff series awards, if possible
	if (typeof newAward.statRange === "number") {
		const stats = showStatsByType[newAward.showStats];
		if (!stats) {
			throw new Error("Invalid showStats");
		}
		winner.statOverrides = {
			score: 0,
		};
		for (const stat of stats) {
			const oldStat = oldAward[stat];
			if (typeof oldStat === "number") {
				winner.statOverrides[stat] = oldStat;
			}
		}
	}
};

const makeNewAwards = (oldAwardsRaw: OldAwards) => {
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
			addStatOverrides(row.new, row.old, winner);

			const award: AwardInfoIndividual = {
				...omit(row.new, ["group"]),
				winner: [winner],
			};

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
						addStatOverrides(row.new, row.old, winner);
						if (TEAM_AWARD_INFO.byPos && p.pos !== undefined) {
							winner.pos = p.pos;
						}

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

		const bestRecordConfs: Record<number, number> = {};
		if (oldAwards.bestRecordConfs) {
			for (const [cid, row] of oldAwards.bestRecordConfs.entries()) {
				if (row?.tid !== undefined) {
					bestRecordConfs[cid] = row.tid;
				}
			}
		}

		const newAwards: Awards2 = {
			season: oldAwards.season,
			bestRecord: oldAwards.bestRecord?.tid ?? PLAYER.DOES_NOT_EXIST,
			bestRecordConfs,
			bestRecordDivs: {},
			awards: makeNewAwards(oldAwards),
		};
		console.log(newAwards);

		await cursor.update(newAwards);
	}
};
