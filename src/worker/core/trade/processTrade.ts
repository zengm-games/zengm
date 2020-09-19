import { PHASE } from "../../../common";
import { player } from "..";
import { idb } from "../../db";
import {
	g,
	helpers,
	logEvent,
	toUI,
	updatePlayMenu,
	recomputeLocalUITeamOvrs,
} from "../../util";
import type { TradeSummary } from "../../../common/types";

const formatAssetsEventLog = (t: TradeSummary["teams"][0]) => {
	const strings: string[] = [];
	t.trade.forEach(p =>
		strings.push(
			`<a href="${helpers.leagueUrl(["player", p.pid])}">${p.name}</a>`,
		),
	);
	t.picks.forEach(dp => strings.push(`a ${dp.desc}`));
	let text;

	if (strings.length === 0) {
		text = "nothing";
	} else if (strings.length === 1) {
		text = strings[0];
	} else if (strings.length === 2) {
		text = `${strings[0]} and ${strings[1]}`;
	} else {
		text = strings[0];

		for (let i = 1; i < strings.length; i++) {
			if (i === strings.length - 1) {
				text += `, and ${strings[i]}`;
			} else {
				text += `, ${strings[i]}`;
			}
		}
	}

	return text;
};

const processTrade = async (
	tradeSummary: TradeSummary,
	tids: [number, number],
	pids: [number[], number[]],
	dpids: [number[], number[]],
) => {
	let pidsEvent = [...pids[0], ...pids[1]];

	let maxPlayerValue = -Infinity;
	let maxPid: number | undefined;
	for (const j of [0, 1]) {
		const k = j === 0 ? 1 : 0;

		if (pids[j].length > 0) {
			const teamSeason = await idb.cache.teamSeasons.indexGet(
				"teamSeasonsBySeasonTid",
				[g.get("season"), tids[j]],
			);
			if (teamSeason) {
				teamSeason.numPlayersTradedAway += pids.length;
				await idb.cache.teamSeasons.put(teamSeason);
			}
		}

		for (const pid of pids[j]) {
			const p = await idb.cache.players.get(pid);
			if (!p) {
				throw new Error("Invalid pid");
			}
			p.tid = tids[k];

			// p.gamesUntilTradable = 14; // Don't make traded players untradable
			p.ptModifier = 1; // Reset

			if (g.get("phase") <= PHASE.PLAYOFFS) {
				await player.addStatsRow(p, g.get("phase") === PHASE.PLAYOFFS);
			}

			if (!p.transactions) {
				p.transactions = [];
			}
			p.transactions.push({
				season: g.get("season"),
				phase: g.get("phase"),
				tid: p.tid,
				type: "trade",
				fromTid: tids[j],
			});

			if (p.valueFuzz > maxPlayerValue) {
				maxPlayerValue = p.valueFuzz;
				maxPid = p.pid;
			}

			await idb.cache.players.put(p);
		}

		for (const dpid of dpids[j]) {
			const dp = await idb.cache.draftPicks.get(dpid);
			if (!dp) {
				throw new Error("Invalid dpid");
			}
			dp.tid = tids[k];
			await idb.cache.draftPicks.put(dp);
		}
	}

	await toUI("realtimeUpdate", [["playerMovement"]]);
	await recomputeLocalUITeamOvrs();

	// If draft pick was changed...
	if (g.get("phase") === PHASE.DRAFT) {
		await updatePlayMenu();
	}

	// Make sure to show best player first, so his picture is shown in news feed
	if (maxPid !== undefined) {
		pidsEvent = [maxPid, ...pidsEvent.filter(pid => pid !== maxPid)];
	}

	logEvent({
		type: "trade",
		text: `The <a href="${helpers.leagueUrl([
			"roster",
			g.get("teamInfoCache")[tids[0]]?.abbrev,
			g.get("season"),
		])}">${
			g.get("teamInfoCache")[tids[0]]?.name
		}</a> traded ${formatAssetsEventLog(
			tradeSummary.teams[0],
		)} to the <a href="${helpers.leagueUrl([
			"roster",
			g.get("teamInfoCache")[tids[1]]?.abbrev,
			g.get("season"),
		])}">${
			g.get("teamInfoCache")[tids[1]]?.name
		}</a> for ${formatAssetsEventLog(tradeSummary.teams[1])}.`,
		showNotification: false,
		pids: pidsEvent,
		tids: Array.from(tids), // Array.from is for Flow
		score: Math.round(helpers.bound(maxPlayerValue - 40, 0, Infinity)),
	});
};

export default processTrade;
