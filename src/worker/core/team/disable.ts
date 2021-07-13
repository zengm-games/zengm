import { idb } from "../../db";
import { player, league, draft } from "..";
import {
	g,
	updateStatus,
	updatePlayMenu,
	random,
	logEvent,
	helpers,
} from "../../util";
import { PHASE } from "../../../common";
import deleteUnreadMessages from "./deleteUnreadMessages";

const disable = async (tid: number) => {
	const t = await idb.cache.teams.get(tid);
	if (!t) {
		throw new Error(`Invalid tid ${tid}`);
	}

	t.disabled = true;
	await idb.cache.teams.put(t);

	const prevUserTid = g.get("userTid");
	const prevUserTids = g.get("userTids");

	if (tid === prevUserTid) {
		// If there is an unread message from the owner, it's not doing any good now
		await deleteUnreadMessages();

		if (prevUserTids.length > 1) {
			// If it's multi team mode, just move to another team
			const newUserTids = prevUserTids.filter(userTid => userTid !== tid);
			const newUserTid = random.choice(newUserTids);
			await league.setGameAttributes({
				userTid: newUserTid,
				userTids: newUserTids,
			});
		} else {
			// If it's not multi team mode, then this is similar to being fired
			await league.setGameAttributes({
				gameOver: true,
			});
			await updateStatus();
			await updatePlayMenu();
		}
	} else if (prevUserTids.includes(tid)) {
		const newUserTids = prevUserTids.filter(userTid => userTid !== tid);
		await league.setGameAttributes({
			userTids: newUserTids,
		});
	}

	// Delete draft picks, and return traded ones to original owner
	await draft.genPicks();
	const draftPicks = await idb.cache.draftPicks.getAll();
	for (const dp of draftPicks) {
		if (dp.tid === t.tid) {
			dp.tid = dp.originalTid;
			await idb.cache.draftPicks.put(dp);
		}
	}

	// Make all players free agents
	const players = await idb.cache.players.indexGetAll("playersByTid", t.tid);

	for (const p of players) {
		player.addToFreeAgents(p);
		await idb.cache.players.put(p);

		logEvent({
			text: `The <a href="${helpers.leagueUrl([
				"roster",
				`${t.abbrev}_${t.tid}`,
				g.get("season"),
			])}">${t.region} ${
				t.name
			}</a> are disbanding, so <a href="${helpers.leagueUrl([
				"player",
				p.pid,
			])}">${p.firstName} ${p.lastName}</a> will become a free agent.`,
			type: "release",
			tids: [t.tid],
			pids: [p.pid],
			showNotification: false,
			score: 0,
		});
	}

	// In preseason, need to delete teamSeason and teamStats
	if (g.get("phase") < PHASE.PLAYOFFS) {
		const teamSeason = await idb.cache.teamSeasons.indexGet(
			"teamSeasonsByTidSeason",
			[t.tid, g.get("season")],
		);
		if (teamSeason) {
			idb.cache.teamSeasons.delete(teamSeason.rid);
		}

		const teamStats = await idb.cache.teamSeasons.indexGet(
			"teamStatsByPlayoffsTid",
			[false, t.tid],
		);
		if (teamStats) {
			await idb.cache.teamSeasons.delete(teamStats.rid);
		}
	}

	await draft.deleteLotteryResultIfNoDraftYet();

	const allTeams = await idb.cache.teams.getAll();
	await league.setGameAttributes({
		numActiveTeams: allTeams.filter(t => !t.disabled).length,
		numTeams: allTeams.length,
		teamInfoCache: allTeams.map(t => ({
			abbrev: t.abbrev,
			disabled: t.disabled,
			imgURL: t.imgURL,
			imgURLSmall: t.imgURLSmall,
			name: t.name,
			region: t.region,
		})),
	});

	logEvent({
		text: `The <a href="${helpers.leagueUrl([
			"team_history",
			`${t.abbrev}_${t.tid}`,
		])}">${t.region} ${
			t.name
		}</a> are disbanding. All their players will become free agents.`,
		type: "teamContraction",
		tids: [t.tid],
		showNotification: false,
		score: 20,
	});
};

export default disable;
