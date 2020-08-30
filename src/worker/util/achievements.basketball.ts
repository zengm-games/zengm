import { idb } from "../db";
import g from "./g";
import type { Achievement } from "../../common/types";
import helpers from "./helpers";

const checkFoFoFo = async () => {
	if (g.get("numGamesPlayoffSeries", "current").length < 3) {
		return false;
	}

	const playoffSeries = await idb.cache.playoffSeries.get(g.get("season"));

	if (playoffSeries === undefined) {
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

	if (playoffSeries === undefined) {
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

const checkSevenGameFinals = async () => {
	// Confirm 4-3 finals
	const playoffSeries = await idb.getCopy.playoffSeries({
		season: g.get("season"),
	});

	if (playoffSeries === undefined) {
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
		slug: "hardware_store",
		name: "Hardware Store",
		desc:
			"Players on your team win MVP, DPOY, SMOY, MIP, ROY, and Finals MVP in the same season.",
		category: "Awards",

		async check() {
			const awards = await idb.cache.awards.get(g.get("season"));
			return (
				awards &&
				awards.mvp &&
				awards.dpoy &&
				awards.smoy &&
				awards.mip &&
				awards.roy &&
				awards.finalsMvp &&
				awards.mvp.tid === g.get("userTid") &&
				awards.dpoy.tid === g.get("userTid") &&
				awards.smoy.tid === g.get("userTid") &&
				awards.mip.tid === g.get("userTid") &&
				awards.roy.tid === g.get("userTid") &&
				awards.finalsMvp.tid === g.get("userTid")
			);
		},

		when: "afterAwards",
	},
	{
		slug: "sleeper_pick",
		name: "Sleeper Pick",
		desc: "Use a non-lottery pick to draft the ROY.",
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
					(p.draft.round > 1 || p.draft.pick >= 15)
				) {
					return true;
				}
			}

			return false;
		},

		when: "afterAwards",
	},
	{
		slug: "sleeper_pick_2",
		name: "Sleeper Pick 2",
		desc: "Use a second round pick to draft the ROY.",
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
		desc: "Win game 7 of the finals in OT.",
		category: "Playoffs",

		async check() {
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
		desc: "Lose game 7 of the finals in OT.",
		category: "Playoffs",

		async check() {
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
		desc: "Win a title with no American players on your team.",
		category: "Team Composition",

		async check() {
			const wonTitle = await userWonTitle();

			if (!wonTitle) {
				return false;
			}

			const playersAll = await idb.cache.players.getAll();
			const countUSA = playersAll.filter(p => helpers.isAmerican(p.born.loc))
				.length;

			if (countUSA < playersAll.length / 2) {
				// Handle custom rosters where nobody is from the USA by enforcing that the league must be at least half USA for this achievement to apply
				return false;
			}

			const players = await idb.cache.players.indexGetAll(
				"playersByTid",
				g.get("userTid"),
			);

			for (const p of players) {
				if (helpers.isAmerican(p.born.loc)) {
					return false;
				}
			}

			return true;
		},

		when: "afterPlayoffs",
	},
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
];

export default achievements;
