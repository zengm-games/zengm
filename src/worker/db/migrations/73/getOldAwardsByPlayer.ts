import { bySport, isSport } from "../../../../common/sportFunctions.ts";
import type { OldAwards } from "./types.ts";
import type { AwardByPlayerMigrate73 } from "./updatePlayerAwards.ts";

// This is adapted from addSimpleAndTeamAwardsToAwardsByPlayer in the old version, now we use it to assemble the list of awards to delete

const SIMPLE_AWARDS = bySport({
	baseball: ["mvp", "roy", "poy", "rpoy", "finalsMvp"],
	basketball: ["mvp", "roy", "smoy", "dpoy", "mip", "finalsMvp"],
	football: ["mvp", "opoy", "poy", "dpoy", "oroy", "droy", "finalsMvp"],
	hockey: ["mvp", "dpoy", "dfoy", "goy", "roy", "finalsMvp"],
});

const AWARD_NAMES = bySport<Record<string, string>>({
	baseball: {
		mvp: "Most Valuable Player",
		roy: "Rookie of the Year",
		poy: "Pitcher of the Year",
		rpoy: "Relief Pitcher of the Year",
		finalsMvp: "Finals MVP",
		allOffense: "All-Offensive Team",
		allDefense: "All-Defensive Team",
		allRookie: "All-Rookie Team",
	},
	basketball: {
		mvp: "Most Valuable Player",
		roy: "Rookie of the Year",
		smoy: "Sixth Man of the Year",
		dpoy: "Defensive Player of the Year",
		mip: "Most Improved Player",
		finalsMvp: "Finals MVP",
		sfmvp: "Semifinals MVP",
		allLeague: "All-League",
		allDefensive: "All-Defensive",
		allRookie: "All-Rookie Team",
	},
	football: {
		mvp: "Most Valuable Player",
		opoy: "Offensive Player of the Year",
		poy: "Protector of the Year",
		dpoy: "Defensive Player of the Year",
		oroy: "Offensive Rookie of the Year",
		droy: "Defensive Rookie of the Year",
		finalsMvp: "Finals MVP",
		allLeague: "All-League",
		allRookie: "All-Rookie Team",
	},
	hockey: {
		mvp: "Most Valuable Player",
		roy: "Rookie of the Year",
		dpoy: "Defensive Player of the Year",
		dfoy: "Defensive Forward of the Year",
		goy: "Goalie of the Year",
		finalsMvp: "Playoffs MVP",
		allLeague: "All-League",
		allRookie: "All-Rookie Team",
	},
});

export const getOldAwardsByPlayer = (awards: OldAwards) => {
	const season = awards.season;
	const awardsByPlayer: AwardByPlayerMigrate73[] = [];

	for (const key of SIMPLE_AWARDS) {
		const type = AWARD_NAMES[key]!;
		const award = (awards as any)[key];

		if (!award) {
			continue;
		}

		awardsByPlayer.push({
			pid: award.pid,
			award: { season, type },
		});
	}
	const awardsTeams = bySport({
		baseball: ["allRookie", "allOffense", "allDefense"] as const,
		basketball: ["allRookie", "allLeague", "allDefensive", "sfmvp"] as const,
		football: ["allRookie", "allLeague"] as const,
		hockey: ["allRookie", "allLeague"] as const,
	});
	for (const key of awardsTeams) {
		if (!(awards as any)[key]) {
			continue;
		}

		const type = AWARD_NAMES[key]!;

		if (key === "allRookie" || key === "sfmvp" || isSport("baseball")) {
			for (const p of (awards as any)[key]) {
				if (p) {
					awardsByPlayer.push({
						pid: p.pid,
						award: { season, type },
					});
				}
			}
		} else {
			for (const level of (awards as any)[key]) {
				for (const p of level.players) {
					if (p) {
						awardsByPlayer.push({
							pid: p.pid,
							award: { season, type: `${level.title} ${type}` },
						});
					}
				}
			}
		}
	}

	return awardsByPlayer;
};
