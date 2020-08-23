import { idb } from "../db";
import g from "./g";
import achievementsBasketball from "./achievements.basketball";
import achievementsFootball from "./achievements.football";
import type { Achievement } from "../../common/types";

// These are achievements that are common across all sports. Sport-specific achievements go in achievements.basketball.ts and achievements.football.ts

const goldenOldiesCutoffs =
	process.env.SPORT === "basketball" ? [30, 33, 36] : [28, 30, 32];
const youngGunsCutoffs =
	process.env.SPORT === "basketball" ? [25, 22] : [26, 24];
const superTeamCutoff = process.env.SPORT === "basketball" ? 3 : 15;
const trustTheProcessCutoff = process.env.SPORT === "basketball" ? 3 : 7;

const checkDynasty = async (titles: number, years: number) => {
	const teamSeasons = await idb.getCopies.teamSeasons({
		tid: g.get("userTid"),
		seasons: [g.get("season") - (years - 1), Infinity],
	});
	let titlesFound = 0; // Look over past years

	for (let i = 0; i < years; i++) {
		const ts = teamSeasons[teamSeasons.length - 1 - i];

		// Don't overshoot
		if (!ts) {
			break;
		}

		// Won title?
		if (
			ts.playoffRoundsWon === g.get("numGamesPlayoffSeries", ts.season).length
		) {
			titlesFound += 1;
		}
	}

	return titlesFound >= titles;
};

const checkMoneyball = async (maxPayroll: number) => {
	const t = await idb.getCopy.teamsPlus({
		seasonAttrs: ["expenses", "playoffRoundsWon"],
		season: g.get("season"),
		tid: g.get("userTid"),
	});
	return !!(
		t &&
		t.seasonAttrs.playoffRoundsWon ===
			g.get("numGamesPlayoffSeries", "current").length &&
		t.seasonAttrs.expenses.salary.amount <= maxPayroll
	);
};

const userWonTitle = async () => {
	const t = await idb.getCopy.teamsPlus({
		seasonAttrs: ["playoffRoundsWon"],
		season: g.get("season"),
		tid: g.get("userTid"),
	});
	return t
		? t.seasonAttrs.playoffRoundsWon ===
				g.get("numGamesPlayoffSeries", "current").length
		: false;
};

const checkGoldenOldies = async (age: number) => {
	const wonTitle = await userWonTitle();

	if (!wonTitle) {
		return false;
	}

	const players = await idb.cache.players.indexGetAll(
		"playersByTid",
		g.get("userTid"),
	);

	for (const p of players) {
		const playerAge = g.get("season") - p.born.year;

		if (playerAge < age) {
			return false;
		}
	}

	return true;
};

const checkYoungGuns = async (age: number) => {
	const wonTitle = await userWonTitle();

	if (!wonTitle) {
		return false;
	}

	const players = await idb.cache.players.indexGetAll(
		"playersByTid",
		g.get("userTid"),
	);

	for (const p of players) {
		const playerAge = g.get("season") - p.born.year;

		if (playerAge > age) {
			return false;
		}
	}

	return true;
};

// IF YOU ADD TO THIS you also need to add to the whitelist in add_achievements.php
const achievements: Achievement[] = [
	{
		slug: "participation",
		name: "Participation",
		desc:
			"You get an achievement just for creating an account, you special snowflake!",
		category: "Meta",
	},
	{
		slug: "dynasty",
		name: "Dynasty",
		desc: "Win 6 championships in 8 years.",
		category: "Multiple Seasons",

		check() {
			return checkDynasty(6, 8);
		},

		when: "afterPlayoffs",
	},
	{
		slug: "dynasty_2",
		name: "Dynasty 2",
		desc: "Win 8 championships in a row.",
		category: "Multiple Seasons",

		check() {
			return checkDynasty(8, 8);
		},

		when: "afterPlayoffs",
	},
	{
		slug: "dynasty_3",
		name: "Dynasty 3",
		desc: "Win 11 championships in 13 years.",
		category: "Multiple Seasons",

		check() {
			return checkDynasty(11, 13);
		},

		when: "afterPlayoffs",
	},
	{
		slug: "moneyball",
		name: "Moneyball",
		desc: "Win a title with a payroll under 2/3 of the salary cap.",
		category: "Season",

		check() {
			return checkMoneyball((2 / 3) * g.get("salaryCap"));
		},

		when: "afterPlayoffs",
	},
	{
		slug: "moneyball_2",
		name: "Moneyball 2",
		desc: "Win a title with a payroll under half of the salary cap.",
		category: "Season",

		check() {
			return checkMoneyball(0.5 * g.get("salaryCap"));
		},

		when: "afterPlayoffs",
	},
	{
		slug: "small_market",
		name: "Small Market",
		desc: "Win a title in a city with under 2 million people.",
		category: "Season",

		async check() {
			const t = await idb.getCopy.teamsPlus({
				seasonAttrs: ["playoffRoundsWon", "pop"],
				season: g.get("season"),
				tid: g.get("userTid"),
			});
			return !!(
				t &&
				t.seasonAttrs.playoffRoundsWon ===
					g.get("numGamesPlayoffSeries", "current").length &&
				t.seasonAttrs.pop <= 2
			);
		},

		when: "afterPlayoffs",
	},
	{
		slug: "hacker",
		name: "Hacker",
		desc:
			"Privately report a security issue in the account system or some other part of the site.",
		category: "Meta",
	},
	{
		slug: "longevity",
		name: "Longevity",
		desc: "Play 100 seasons in a single league.",
		category: "Multiple Seasons",

		async check() {
			return g.get("season") === g.get("startingSeason") + 99;
		},

		when: "afterPlayoffs",
	},
	{
		slug: "longevity_2",
		name: "Longevity 2",
		desc: "Play 1,000 seasons in a single league.",
		category: "Multiple Seasons",

		async check() {
			return g.get("season") === g.get("startingSeason") + 999;
		},

		when: "afterPlayoffs",
	},
	{
		slug: "longevity_3",
		name: "Longevity 3",
		desc: "Play 10,000 seasons in a single league.",
		category: "Multiple Seasons",

		async check() {
			return g.get("season") === g.get("startingSeason") + 9999;
		},

		when: "afterPlayoffs",
	},
	{
		slug: "so_close",
		name: "So Close",
		desc: "Lose in the finals four seasons in a row.",
		category: "Playoffs",

		async check() {
			const teamSeasons = await idb.getCopies.teamSeasons({
				tid: g.get("userTid"),
				seasons: [g.get("season") - 3, g.get("season")],
			});
			let count = 0;

			for (const teamSeason of teamSeasons) {
				if (
					teamSeason.playoffRoundsWon ===
					g.get("numGamesPlayoffSeries", "current").length - 1
				) {
					count += 1;
				}
			}

			return count >= 4;
		},

		when: "afterPlayoffs",
	},
	{
		slug: "homegrown",
		name: "Homegrown",
		desc: "Win a title with only players you drafted.",
		category: "Team Composition",

		async check() {
			const wonTitle = await userWonTitle();

			if (!wonTitle) {
				return false;
			}

			const players = await idb.cache.players.indexGetAll(
				"playersByTid",
				g.get("userTid"),
			);

			for (const p of players) {
				if (p.draft.tid !== g.get("userTid")) {
					return false;
				}
			}

			return true;
		},

		when: "afterPlayoffs",
	},
	{
		slug: "golden_oldies",
		name: "Golden Oldies",
		desc: `Win a title when your entire team is at least ${goldenOldiesCutoffs[0]} years old.`,
		category: "Team Composition",

		async check() {
			const awarded = await checkGoldenOldies(goldenOldiesCutoffs[0]);
			return awarded;
		},

		when: "afterPlayoffs",
	},
	{
		slug: "golden_oldies_2",
		name: "Golden Oldies 2",
		desc: `Win a title when your entire team is at least ${goldenOldiesCutoffs[1]} years old.`,
		category: "Team Composition",

		async check() {
			const awarded = await checkGoldenOldies(goldenOldiesCutoffs[1]);
			return awarded;
		},

		when: "afterPlayoffs",
	},
	{
		slug: "golden_oldies_3",
		name: "Golden Oldies 3",
		desc: `Win a title when your entire team is at least ${goldenOldiesCutoffs[2]} years old.`,
		category: "Team Composition",

		async check() {
			const awarded = await checkGoldenOldies(goldenOldiesCutoffs[2]);
			return awarded;
		},

		when: "afterPlayoffs",
	},
	{
		slug: "young_guns",
		name: "Young Guns",
		desc: `Win a title when your entire team is at most ${youngGunsCutoffs[0]} years old.`,
		category: "Team Composition",

		async check() {
			const awarded = await checkYoungGuns(youngGunsCutoffs[0]);
			return awarded;
		},

		when: "afterPlayoffs",
	},
	{
		slug: "young_guns_2",
		name: "Young Guns 2",
		desc: `Win a title when your entire team is at most ${youngGunsCutoffs[1]} years old.`,
		category: "Team Composition",

		async check() {
			const awarded = await checkYoungGuns(youngGunsCutoffs[1]);
			return awarded;
		},

		when: "afterPlayoffs",
	},
	{
		slug: "bittersweet_victoy",
		name: "Bittersweet Victory",
		desc: "Get fired the same year you won a title.",
		category: "Playoffs",
		check: userWonTitle,
		when: "afterFired",
	},
	{
		slug: "team_effort",
		name: "Team Effort",
		desc: "Win a title without a player on an All-League Team.",
		category: "Awards",

		async check() {
			const wonTitle = await userWonTitle();

			if (!wonTitle) {
				return false;
			}

			const awards = await idb.cache.awards.get(g.get("season"));

			if (awards && awards.allLeague) {
				for (const team of awards.allLeague) {
					for (const p of team.players) {
						if (p.tid === g.get("userTid")) {
							return false;
						}
					}
				}
			}

			return true;
		},

		when: "afterAwards",
	},
	{
		slug: "super_team",
		name: "Super Team",
		desc: `Have ${superTeamCutoff}+ players on the All-League First Team.`,
		category: "Awards",

		async check() {
			let count = 0;
			const awards = await idb.cache.awards.get(g.get("season"));

			if (awards && awards.allLeague && awards.allLeague[0]) {
				for (const p of awards.allLeague[0].players) {
					if (p.tid === g.get("userTid")) {
						count += 1;
					}
				}
			}

			return count >= superTeamCutoff;
		},

		when: "afterAwards",
	},
	{
		slug: "quit_on_top",
		name: "Quit On Top",
		desc: "Have a player retire while making the All-League First Team.",
		category: "Awards",

		async check() {
			const awards = await idb.cache.awards.get(g.get("season"));

			if (awards && awards.allLeague && awards.allLeague[0]) {
				for (const { pid, tid } of awards.allLeague[0].players) {
					if (tid === g.get("userTid")) {
						const p = await idb.cache.players.get(pid);

						if (p && p.retiredYear === g.get("season")) {
							return true;
						}
					}
				}
			}

			return false;
		},

		when: "afterAwards",
	},
	{
		slug: "golden_boy",
		name: "Golden Boy",
		desc: "Have a rookie make an All-League Team.",
		category: "Awards",

		async check() {
			const awards = await idb.cache.awards.get(g.get("season"));

			if (awards && awards.allLeague) {
				for (const team of awards.allLeague) {
					for (const { pid, tid } of team.players) {
						if (tid === g.get("userTid")) {
							const p = await idb.cache.players.get(pid);

							if (p && p.draft.year === g.get("season") - 1) {
								return true;
							}
						}
					}
				}
			}

			return false;
		},

		when: "afterAwards",
	},
	{
		slug: "golden_boy_2",
		name: "Golden Boy 2",
		desc: "Have a rookie make the All-League First Team.",
		category: "Awards",

		async check() {
			const awards = await idb.cache.awards.get(g.get("season"));

			if (awards && awards.allLeague && awards.allLeague[0]) {
				for (const { pid, tid } of awards.allLeague[0].players) {
					if (tid === g.get("userTid")) {
						const p = await idb.cache.players.get(pid);

						if (p && p.draft.year === g.get("season") - 1) {
							return true;
						}
					}
				}
			}

			return false;
		},

		when: "afterAwards",
	},
	{
		slug: "trust_the_process",
		name: "Trust The Process",
		desc: `Have ${trustTheProcessCutoff}+ players on the All-Rookie Team.`,
		category: "Awards",

		async check() {
			const awards = await idb.cache.awards.get(g.get("season"));
			const count =
				awards && awards.allRookie
					? awards.allRookie.filter((p: any) => p.tid === g.get("userTid"))
							.length
					: 0;
			return count >= trustTheProcessCutoff;
		},

		when: "afterAwards",
	},
	{
		slug: "triple_crown",
		name: "Triple Crown",
		desc: "Have a player win MVP, Championship MVP, and DPOY in the same year",
		category: "Awards",
		async check() {
			const awards = await idb.cache.awards.get(g.get("season"));

			return (
				awards &&
				awards.mvp &&
				awards.finalsMvp &&
				awards.dpoy &&
				awards.mvp.tid === g.get("userTid") &&
				awards.finalsMvp.tid === g.get("userTid") &&
				awards.dpoy.tid === g.get("userTid") &&
				awards.mvp.pid === awards.finalsMvp.pid &&
				awards.mvp.pid === awards.dpoy.pid &&
				// technically not needed due to transitive property
				awards.finalsMvp.pid === awards.dpoy.pid
			);
		},
		when: "afterAwards",
	},
];

if (process.env.SPORT === "football") {
	achievements.push(...achievementsFootball);
} else {
	achievements.push(...achievementsBasketball);
}

export default achievements;
