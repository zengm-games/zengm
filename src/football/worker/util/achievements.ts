import { idb } from "../../../deion/worker/db";
import { g } from "../../../deion/worker/util";
import { Achievement } from "../../../deion/common/types";

const userWonTitle = async () => {
	const t = await idb.getCopy.teamsPlus({
		seasonAttrs: ["playoffRoundsWon"],
		season: g.season,
		tid: g.userTid,
	});
	return t.seasonAttrs.playoffRoundsWon === g.numGamesPlayoffSeries.length;
};

const achievements: Achievement[] = [
	{
		slug: "clean_sweep",
		name: "Clean Sweep",
		desc: "Go 16-0 in regular season and win the championship.",
		category: "Season",

		async check() {
			const wonTitle = await userWonTitle();

			if (wonTitle) {
				const t = await idb.getCopy.teamsPlus({
					seasonAttrs: ["won", "lost"],
					season: g.season,
					tid: g.userTid,
				});

				if (
					t &&
					t.seasonAttrs &&
					t.seasonAttrs.won === 16 &&
					t.seasonAttrs.lost === 0
				) {
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
			"Players on your team win MVP, DPOY, OROY, DROY, and Finals MVP in the same season.",
		category: "Awards",

		async check() {
			const awards = await idb.cache.awards.get(g.season);
			return (
				awards &&
				awards.mvp &&
				awards.dpoy &&
				awards.oroy &&
				awards.droy &&
				awards.finalsMvp &&
				awards.mvp.tid === g.userTid &&
				awards.dpoy.tid === g.userTid &&
				awards.oroy.tid === g.userTid &&
				awards.droy.tid === g.userTid &&
				awards.finalsMvp.tid === g.userTid
			);
		},

		when: "afterAwards",
	},
	{
		slug: "sleeper_pick",
		name: "Sleeper Pick",
		desc: "Draft the ROY in the 3rd round or later.",
		category: "Draft",

		async check() {
			const awards = await idb.cache.awards.get(g.season);

			if (awards && awards.roy && awards.roy.tid === g.userTid) {
				const p = await idb.cache.players.get(awards.roy.pid);

				if (
					p.tid === g.userTid &&
					p.draft.tid === g.userTid &&
					p.draft.year === g.season - 1 &&
					p.draft.round >= 3
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
		desc: "Draft the ROY in the 6th round or later.",
		category: "Draft",

		async check() {
			const awards = await idb.cache.awards.get(g.season);

			if (awards && awards.roy && awards.roy.tid === g.userTid) {
				const p = await idb.cache.players.get(awards.roy.pid);

				if (
					p.tid === g.userTid &&
					p.draft.tid === g.userTid &&
					p.draft.year === g.season - 1 &&
					p.draft.round >= 6
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
		desc: "Win the championship in OT.",
		category: "Playoffs",

		async check() {
			const games = await idb.cache.games.getAll();
			const game = games[games.length - 1]; // Last game of finals

			return game.overtimes >= 1 && game.won.tid === g.userTid;
		},

		when: "afterPlayoffs",
	},
	{
		slug: "unclutch_finish",
		name: "Unclutch Finish",
		desc: "Lose the championship in OT.",
		category: "Playoffs",

		async check() {
			const games = await idb.cache.games.getAll();
			const game = games[games.length - 1]; // Last game of finals

			return game.overtimes >= 1 && game.lost.tid === g.userTid;
		},

		when: "afterPlayoffs",
	},
];

export default achievements;
