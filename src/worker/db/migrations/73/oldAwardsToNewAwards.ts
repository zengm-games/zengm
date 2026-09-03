import { showStatsByType } from "../../../../common/awards.ts";
import { PLAYER, TEAM_AWARD_INFO } from "../../../../common/constants.ts";
import { bySport } from "../../../../common/sportFunctions.ts";
import type {
	AwardInfoIndividual,
	AwardInfoTeam,
	Awards,
	AwardSettingIndividual,
	AwardSettingTeam,
} from "../../../../common/types.ts";
import { omit } from "../../../../common/utils.ts";
import {
	defaultAwards,
	defaultAwardsBaseball,
	defaultAwardsBasketball,
	defaultAwardsFootball,
	defaultAwardsHockey,
} from "./defaultAwards.ts";
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

const getNewAwards = (oldAwardsRaw: OldAwards) => {
	const awards: Awards["awards"] = [];

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
					old:
						| ({ pid: number; pos?: string; tid: number } | undefined)[][]
						| undefined;
			  }
		)[]
	>({
		baseball: () => {
			const oldAwards = oldAwardsRaw as OldAwardsBaseball;
			return [
				{
					type: "individual",
					new: defaultAwards.mvp,
					old: oldAwards.mvp,
				},
				{
					type: "individual",
					new: defaultAwardsBaseball.poy,
					old: oldAwards.poy,
				},
				{
					type: "individual",
					new: defaultAwardsBaseball.rpoy,
					old: oldAwards.rpoy,
				},
				{
					type: "individual",
					new: defaultAwardsBaseball.roy,
					old: oldAwards.roy,
				},
				{
					type: "individual",
					new: defaultAwards.fmvp,
					old: oldAwards.finalsMvp,
				},
				{
					type: "team",
					new: defaultAwards.all,
					old: [oldAwards.allOffense],
				},
				{
					type: "team",
					new: defaultAwardsBaseball.def,
					old: [oldAwards.allDefense],
				},
				{
					type: "team",
					new: defaultAwards.alr,
					old: [oldAwards.allRookie],
				},
			];
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
					old: oldAwards.allDefensive.map((team) => team.players),
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
			return [
				{
					type: "individual",
					new: defaultAwards.mvp,
					old: oldAwards.mvp,
				},
				{
					type: "individual",
					new: defaultAwardsFootball.opoy,
					old: oldAwards.opoy,
				},
				{
					type: "individual",
					new: defaultAwardsFootball.poy,
					old: oldAwards.poy,
				},
				{
					type: "individual",
					new: defaultAwardsFootball.dpoy,
					old: oldAwards.dpoy,
				},
				{
					type: "individual",
					new: defaultAwardsFootball.oroy,
					old: oldAwards.oroy,
				},
				{
					type: "individual",
					new: defaultAwardsFootball.droy,
					old: oldAwards.droy,
				},
				{
					type: "individual",
					new: defaultAwards.fmvp,
					old: oldAwards.finalsMvp,
				},
				{
					type: "team",
					new: defaultAwards.all,
					old: oldAwards.allLeague.map((team) => team.players),
				},
				{
					type: "team",
					new: defaultAwards.alr,
					old: [oldAwards.allRookie],
				},
			];
		},
		hockey: () => {
			const oldAwards = oldAwardsRaw as OldAwardsHockey;
			return [
				{
					type: "individual",
					new: defaultAwards.mvp,
					old: oldAwards.mvp,
				},
				{
					type: "individual",
					new: defaultAwardsHockey.goy,
					old: oldAwards.goy,
				},
				{
					type: "individual",
					new: defaultAwardsHockey.dpoy,
					old: oldAwards.dpoy,
				},
				{
					type: "individual",
					new: defaultAwardsHockey.dfoy,
					old: oldAwards.dfoy,
				},
				{
					type: "individual",
					new: defaultAwardsHockey.roy,
					old: oldAwards.roy,
				},
				{
					type: "individual",
					new: defaultAwards.fmvp,
					old: oldAwards.finalsMvp,
				},
				{
					type: "team",
					new: defaultAwards.all,
					old: oldAwards.allLeague.map((team) => team.players),
				},
				{
					type: "team",
					new: defaultAwards.alr,
					old: [oldAwards.allRookie],
				},
			];
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
					if (oldStat !== undefined) {
						winner.statOverrides[stat] = oldStat;
					}
				}
			}

			const award: AwardInfoIndividual = {
				...omit(row.new, ["group"]),
				winner: [winner],
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
				winner: row.old
					.filter((team) => team !== undefined)
					.map((team) =>
						team
							.filter((p) => p !== undefined && p !== null)
							.map((p) => {
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

export const oldAwardsToNewAwards = (oldAwards: OldAwards) => {
	const bestRecordConfs: Record<number, number> = {};
	if (oldAwards.bestRecordConfs) {
		for (const [cid, row] of oldAwards.bestRecordConfs.entries()) {
			if (row?.tid !== undefined) {
				bestRecordConfs[cid] = row.tid;
			}
		}
	}

	const awards = getNewAwards(oldAwards);

	const newAwards: Awards = {
		season: oldAwards.season,
		bestRecord: oldAwards.bestRecord?.tid ?? PLAYER.DOES_NOT_EXIST,
		bestRecordConfs,
		bestRecordDivs: {},
		awards,
	};

	return newAwards;
};
