import { idb } from "../db";
import g from "./g";
import type { Achievement } from "../../common/types";
import { bySport, isSport } from "../../common";
import helpers from "./helpers";

const goldenOldiesCutoffs = bySport({
	basketball: [30, 33, 36],
	football: [28, 30, 32],
	hockey: [30, 33, 36],
});
const youngGunsCutoffs = bySport({
	basketball: [25, 22],
	football: [26, 24],
	hockey: [25, 22],
});
const superTeamCutoff = bySport({ basketball: 3, football: 15, hockey: 4 });
const trustTheProcessCutoff = bySport({
	basketball: 3,
	football: 7,
	hockey: 3,
});

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

const checkFoFoFo = async () => {
	if (g.get("numGamesPlayoffSeries", "current").length < 3) {
		return false;
	}

	const playoffSeries = await idb.cache.playoffSeries.get(g.get("season"));

	if (!playoffSeries || playoffSeries.series.length === 0) {
		// Should only happen if playoffs are skipped
		return false;
	}

	for (const round of playoffSeries.series) {
		let found = false;

		for (const series of round) {
			if (
				series.away &&
				series.away.won >= 4 &&
				series.home.won === 0 &&
				series.away.tid === g.get("userTid")
			) {
				found = true;
				break;
			}

			if (
				series.away &&
				series.home.won >= 4 &&
				series.away.won === 0 &&
				series.home.tid === g.get("userTid")
			) {
				found = true;
				break;
			}
		}

		if (!found) {
			return false;
		}
	}

	return true;
};

const getUserSeed = async () => {
	const playoffSeries = await idb.getCopy.playoffSeries({
		season: g.get("season"),
	});

	if (!playoffSeries || playoffSeries.series.length === 0) {
		return;
	}

	for (const matchup of playoffSeries.series[0]) {
		if (matchup.away && matchup.away.tid === g.get("userTid")) {
			return matchup.away.seed;
		}

		if (matchup.home.tid === g.get("userTid")) {
			return matchup.home.seed;
		}
	}
};

const checkSevenGameFinals = async () => {
	// Confirm 4-3 finals
	const playoffSeries = await idb.getCopy.playoffSeries({
		season: g.get("season"),
	});

	if (!playoffSeries || playoffSeries.series.length === 0) {
		return false;
	}

	const matchup = playoffSeries.series[playoffSeries.series.length - 1][0];

	if (
		matchup === undefined ||
		matchup.home === undefined ||
		matchup.away === undefined
	) {
		return false;
	}

	if (matchup.home.won < 3 || matchup.away.won < 3) {
		return false;
	}

	return true;
};

// IF YOU ADD TO THIS you also need to add to the whitelist in add_achievements.php
const achievements: Achievement[] = [
	{
		slug: "participation",
		name: "Participation",
		desc: "You get an achievement just for creating an account, you special snowflake!",
		category: "Meta",
	},
	{
		slug: "dynasty",
		name: "Dynasty",
		desc: bySport({
			basketball: "Win 6 championships in 8 years.",
			default: "Win 3 championships in 5 years.",
		}),
		category: "Multiple Seasons",

		check() {
			return bySport({
				basketball: checkDynasty(6, 8),
				default: checkDynasty(3, 5),
			});
		},

		when: "afterPlayoffs",
	},
	{
		slug: "dynasty_2",
		name: "Dynasty 2",
		desc: bySport({
			basketball: "Win 8 championships in a row.",
			default: "Win 5 championships in a row.",
		}),
		category: "Multiple Seasons",

		check() {
			return bySport({
				basketball: checkDynasty(8, 8),
				default: checkDynasty(5, 5),
			});
		},

		when: "afterPlayoffs",
	},
	{
		slug: "dynasty_3",
		name: "Dynasty 3",
		desc: bySport({
			basketball: "Win 11 championships in 13 years.",
			default: "Win 10 championships in 15 years.",
		}),
		category: "Multiple Seasons",

		check() {
			return bySport({
				basketball: checkDynasty(11, 13),
				default: checkDynasty(10, 15),
			});
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
		desc: "Privately report a security issue in the account system or some other part of the site.",
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
		desc: "Win a title with only players your team drafted.",
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
	{
		slug: "hardware_store",
		name: "Hardware Store",
		desc: bySport({
			basketball:
				"Players on your team win MVP, DPOY, SMOY, MIP, ROY, and Finals MVP in the same season.",
			football:
				"Players on your team win MVP, DPOY, OROY, DROY, and Finals MVP in the same season.",
			hockey:
				"Players on your team win MVP, DPOY, DFOY, GOY, ROY, and Finals MVP in the same season",
		}),
		category: "Awards",

		async check() {
			const awards = await idb.cache.awards.get(g.get("season"));

			const userTid = g.get("userTid");

			return bySport({
				basketball:
					awards &&
					awards.mvp &&
					awards.dpoy &&
					awards.smoy &&
					awards.mip &&
					awards.roy &&
					awards.finalsMvp &&
					awards.mvp.tid === userTid &&
					awards.dpoy.tid === userTid &&
					awards.smoy.tid === userTid &&
					awards.mip.tid === userTid &&
					awards.roy.tid === userTid &&
					awards.finalsMvp.tid === userTid,
				football:
					awards &&
					awards.mvp &&
					awards.dpoy &&
					awards.oroy &&
					awards.droy &&
					awards.finalsMvp &&
					awards.mvp.tid === userTid &&
					awards.dpoy.tid === userTid &&
					awards.oroy.tid === userTid &&
					awards.droy.tid === userTid &&
					awards.finalsMvp.tid === userTid,
				hockey:
					awards &&
					awards.mvp &&
					awards.dpoy &&
					awards.goy &&
					awards.roy &&
					awards.finalsMvp &&
					awards.mvp.tid === userTid &&
					awards.dpoy.tid === userTid &&
					awards.dfoy.tid === userTid &&
					awards.goy.tid === userTid &&
					awards.roy.tid === userTid &&
					awards.finalsMvp.tid === userTid,
			});
		},
		when: "afterAwards",
	},
	{
		slug: "sleeper_pick",
		name: "Sleeper Pick",
		desc: bySport({
			basketball: "Use a non-lottery pick to draft the ROY.",
			football: "Draft the ROY in the 3rd round or later.",
			hockey: "Use a non-lottery pick to draft the ROY.",
		}),
		category: "Draft",

		async check() {
			const awards = await idb.cache.awards.get(g.get("season"));

			if (awards && awards.roy && awards.roy.tid === g.get("userTid")) {
				const p = await idb.cache.players.get(awards.roy.pid);

				if (
					p &&
					p.tid === g.get("userTid") &&
					p.draft.tid === g.get("userTid") &&
					p.draft.year === g.get("season") - 1
				) {
					return bySport({
						basketball: p.draft.round > 1 || p.draft.pick >= 15,
						football: p.draft.round >= 3,
						hockey: p.draft.round > 1 || p.draft.pick >= 15,
					});
				}
			}

			return false;
		},

		when: "afterAwards",
	},
	{
		slug: "sleeper_pick_2",
		name: "Sleeper Pick 2",
		desc: bySport({
			basketball: "Use a second round pick to draft the ROY.",
			football: "Draft the ROY in the 5th round or later.",
			hockey: "Draft the ROY in the 2nd round or later.",
		}),
		category: "Draft",

		async check() {
			const awards = await idb.cache.awards.get(g.get("season"));

			if (awards && awards.roy && awards.roy.tid === g.get("userTid")) {
				const p = await idb.cache.players.get(awards.roy.pid);

				if (
					p &&
					p.tid === g.get("userTid") &&
					p.draft.tid === g.get("userTid") &&
					p.draft.year === g.get("season") - 1 &&
					p.draft.round > 1
				) {
					return bySport({
						basketball: p.draft.round > 1,
						football: p.draft.round >= 5,
						hockey: p.draft.round > 1,
					});
					return true;
				}
			}

			return false;
		},

		when: "afterAwards",
	},
	{
		slug: "clutch_finish",
		name: "Clutch Finish",
		desc: bySport({
			basketball: "Win game 7 of the finals in OT.",
			football: "Win the championship in OT.",
			hockey: "Win game 7 of the finals in OT.",
		}),
		category: "Playoffs",

		async check() {
			if (isSport("football")) {
				const games = await idb.cache.games.getAll();
				const game = games[games.length - 1]; // Last game of finals

				return game.overtimes >= 1 && game.won.tid === g.get("userTid");
			}

			const sevenGameFinals = await checkSevenGameFinals();

			if (!sevenGameFinals) {
				return false;
			}

			const games = await idb.cache.games.getAll();
			if (games.length === 0) {
				return false;
			}

			const game = games[games.length - 1]; // Last game of finals

			return game.overtimes >= 1 && game.won.tid === g.get("userTid");
		},

		when: "afterPlayoffs",
	},
	{
		slug: "unclutch_finish",
		name: "Unclutch Finish",
		desc: bySport({
			basketball: "Lose game 7 of the finals in OT.",
			football: "Lose the championship in OT.",
			hockey: "Lose game 7 of the finals in OT.",
		}),
		category: "Playoffs",

		async check() {
			if (isSport("football")) {
				const games = await idb.cache.games.getAll();
				const game = games[games.length - 1]; // Last game of finals

				return game.overtimes >= 1 && game.lost.tid === g.get("userTid");
			}

			const sevenGameFinals = await checkSevenGameFinals();

			if (!sevenGameFinals) {
				return false;
			}

			const games = await idb.cache.games.getAll();
			const game = games[games.length - 1]; // Last game of finals

			return game.overtimes >= 1 && game.lost.tid === g.get("userTid");
		},

		when: "afterPlayoffs",
	},
];

if (isSport("hockey") || isSport("basketball")) {
	achievements.push(
		{
			slug: "fo_fo_fo",
			name: "Fo Fo Fo",
			desc: "Go 16-0 in the playoffs.",
			category: "Playoffs",
			check: checkFoFoFo,
			when: "afterPlayoffs",
		},
		{
			slug: "fo_fo_fo_2",
			name: "Fo Fo Fo 2",
			desc: "Go 16-0 in the playoffs, without the #1 seed.",
			category: "Playoffs",

			async check() {
				const foFoFo = await checkFoFoFo();

				if (!foFoFo) {
					return false;
				}

				const seed = await getUserSeed();
				return seed !== undefined && seed > 1;
			},

			when: "afterPlayoffs",
		},
		{
			slug: "septuawinarian",
			name: "Septuawinarian",
			desc: "Win 70+ games in the regular season.",
			category: "Season",

			async check() {
				const t = await idb.getCopy.teamsPlus({
					seasonAttrs: ["won"],
					season: g.get("season"),
					tid: g.get("userTid"),
				});
				return !!(t && t.seasonAttrs.won >= 70);
			},

			when: "afterRegularSeason",
		},
		{
			slug: "98_degrees",
			name: "98 Degrees",
			desc: "Go 98-0 in the playoffs and regular season.",
			category: "Season",

			async check() {
				const awarded = await checkFoFoFo();

				if (awarded) {
					const t = await idb.getCopy.teamsPlus({
						seasonAttrs: ["won", "lost"],
						season: g.get("season"),
						tid: g.get("userTid"),
					});

					if (t && t.seasonAttrs.won === 82 && t.seasonAttrs.lost === 0) {
						return true;
					}
				}

				return false;
			},

			when: "afterPlayoffs",
		},
		{
			slug: "underdog",
			name: "Underdog",
			desc: "Win a title as the 8th seed.",
			category: "Playoffs",

			async check() {
				const wonTitle = await userWonTitle();

				if (!wonTitle) {
					return false;
				}

				const seed = await getUserSeed();
				return seed === 8;
			},

			when: "afterPlayoffs",
		},
		{
			slug: "international",
			name: "International",
			desc: `Win a title with no ${bySport({
				hockey: "Canadian",
				default: "American",
			})} players on your team.`,
			category: "Team Composition",

			async check() {
				const wonTitle = await userWonTitle();

				if (!wonTitle) {
					return false;
				}

				const playersAll = await idb.cache.players.getAll();
				const countUSA = playersAll.filter(p => {
					if (isSport("hockey")) {
						return helpers.getCountry(p.born.loc) === "Canada";
					}

					return helpers.isAmerican(p.born.loc);
				}).length;

				if (countUSA < playersAll.length / 2) {
					// Handle custom rosters where nobody is from the USA by enforcing that the league must be at least half USA for this achievement to apply
					return false;
				}

				const players = await idb.cache.players.indexGetAll(
					"playersByTid",
					g.get("userTid"),
				);

				for (const p of players) {
					if (isSport("hockey")) {
						if (helpers.getCountry(p.born.loc) === "Canada") {
							return false;
						}
					} else {
						if (helpers.isAmerican(p.born.loc)) {
							return false;
						}
					}
				}

				return true;
			},

			when: "afterPlayoffs",
		},
		{
			slug: "finals_choke",
			name: "Finals Choke",
			desc: "Blow a 3-0 lead in the finals.",
			category: "Playoffs",

			async check() {
				// Confirm lost finals
				const t = await idb.getCopy.teamsPlus({
					seasonAttrs: ["playoffRoundsWon"],
					season: g.get("season"),
					tid: g.get("userTid"),
				});

				if (
					!t ||
					t.seasonAttrs.playoffRoundsWon !==
						g.get("numGamesPlayoffSeries", "current").length - 1
				) {
					return false;
				}

				const sevenGameFinals = await checkSevenGameFinals();

				if (!sevenGameFinals) {
					return false;
				}

				// Confirm lost last 4 games
				const games = await idb.cache.games.getAll();
				const last4 = games.slice(-4);

				for (const game of last4) {
					if (game.lost.tid !== g.get("userTid")) {
						return false;
					}
				}

				return true;
			},

			when: "afterPlayoffs",
		},
		{
			slug: "first_round_choke",
			name: "First Round Choke",
			desc: "Lose in the first round of the playoffs as the #1 seed.",
			category: "Playoffs",

			async check() {
				// Confirm lost in first round
				const t = await idb.getCopy.teamsPlus({
					seasonAttrs: ["playoffRoundsWon"],
					season: g.get("season"),
					tid: g.get("userTid"),
				});

				if (!t || t.seasonAttrs.playoffRoundsWon !== 0) {
					return false;
				}

				const seed = await getUserSeed();
				return seed === 1;
			},

			when: "afterPlayoffs",
		},
	);
}

if (isSport("basketball")) {
	achievements.push(
		{
			slug: "brick_wall",
			name: "Brick Wall",
			desc: "Have 3+ players on the All-Defensive First Team.",
			category: "Awards",

			async check() {
				let count = 0;
				const awards = await idb.cache.awards.get(g.get("season"));

				if (awards && awards.allDefensive && awards.allDefensive[0]) {
					for (const p of awards.allDefensive[0].players) {
						if (p.tid === g.get("userTid")) {
							count += 1;
						}
					}
				}

				return count >= 3;
			},

			when: "afterAwards",
		},
		{
			slug: "out_of_nowhere",
			name: "Out Of Nowhere",
			desc: "Have a player win both MIP and MVP in the same year.",
			category: "Awards",

			async check() {
				const awards = await idb.cache.awards.get(g.get("season"));
				return (
					awards &&
					awards.mvp &&
					awards.mip &&
					awards.mvp.tid === g.get("userTid") &&
					awards.mip.tid === g.get("userTid") &&
					awards.mvp.pid === awards.mip.pid
				);
			},

			when: "afterAwards",
		},
	);
}

if (isSport("football")) {
	achievements.push({
		slug: "clean_sweep",
		name: "Clean Sweep",
		desc: "Go 16-0 in regular season and win the championship.",
		category: "Season",

		async check() {
			const wonTitle = await userWonTitle();

			if (wonTitle) {
				const t = await idb.getCopy.teamsPlus({
					seasonAttrs: ["won", "lost"],
					season: g.get("season"),
					tid: g.get("userTid"),
				});

				if (t && t.seasonAttrs.won === 16 && t.seasonAttrs.lost === 0) {
					return true;
				}
			}

			return false;
		},

		when: "afterPlayoffs",
	});
}

export default achievements;
