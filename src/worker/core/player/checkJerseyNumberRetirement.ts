import orderBy from "lodash-es/orderBy";
import { bySport, isSport } from "../../../common";
import type { Player, Team } from "../../../common/types";
import { idb } from "../../db";
import { g, local, logEvent, helpers } from "../../util";
import { getThreshold } from "./madeHof.football";

// Higher in basketball, because real player leagues have a lot
const MAX_RETIRED_JERSEY_NUMBERS_PER_AI_TEAM = isSport("basketball") ? 30 : 12;

export const getValueStatsRow = (ps: any) => {
	return bySport({
		basketball: (() => {
			let value = 0;
			if (typeof ps.dws === "number") {
				value += ps.dws;
			}

			if (typeof ps.ows === "number") {
				value += ps.ows;
			}

			if (typeof ps.ewa === "number") {
				value += ps.ewa;
			}

			value /= 2;
			return value;
		})(),
		football: ps.av,
		hockey: (() => {
			const g = ps.evG + ps.ppG + ps.shG;
			const a = ps.evA + ps.ppA + ps.shA;
			return (g + a) / 25 + ps.ops + ps.dps + 0.6 * ps.gps;
		})(),
	});
};

export const getMostCommonPosition = (p: Player, tid: number) => {
	const positionCounts = new Map<string, number>();
	for (const pr of p.ratings) {
		const ps = p.stats.find(ps => ps.season === pr.season && ps.tid === tid);
		if (ps) {
			const prevValue = positionCounts.get(pr.pos) || 0;
			positionCounts.set(pr.pos, prevValue + 1);
		}
	}

	let maxValue = -Infinity;
	let mostCommonPosition: string | undefined;
	for (const [pos, value] of positionCounts) {
		if (value > maxValue) {
			maxValue = value;
			mostCommonPosition = pos;
		}
	}

	return mostCommonPosition;
};

// const posCounts = {};

// score over 1 means eligible to be retired by AI
export const getScore = (p: Player, tid: number) => {
	let value = 0;
	for (const ps of p.stats) {
		if (ps.tid === tid) {
			value += getValueStatsRow(ps);
		}
	}

	let threshold;
	if (isSport("football")) {
		const mostCommonPosition = getMostCommonPosition(p, tid);

		threshold = getThreshold(mostCommonPosition);
		if (threshold > 80) {
			threshold = 80;
		}
		if (mostCommonPosition === "WR" || mostCommonPosition === "TE") {
			threshold -= 12;
		} else if (mostCommonPosition === "LB") {
			threshold -= 5;
		} else if (mostCommonPosition === "CB") {
			threshold += 4;
		}
	} else {
		threshold = 80;
	}

	const score = value / threshold;

	return score;
};

const checkJerseyNumberRetirement = async (p: Player) => {
	if (!g.get("aiJerseyRetirement")) {
		return;
	}

	let tid: number | undefined;
	let number: string | undefined;

	// Find team he played the most with
	const scoresByTid = new Map<number, number>();

	for (const ps of p.stats) {
		if (!scoresByTid.has(ps.tid)) {
			scoresByTid.set(ps.tid, getScore(p, ps.tid));
		}
	}

	if (scoresByTid.size === 0) {
		return;
	}

	let maxScore = -Infinity;
	let maxTid: number | undefined;
	for (const [tid, score] of scoresByTid) {
		if (score > maxScore) {
			maxScore = score;
			maxTid = tid;
		}
	}

	if (maxTid === undefined) {
		return;
	}

	if (maxScore > 1) {
		tid = maxTid;

		// Figure out most common jersey number
		const valuesByJerseyNumber = new Map<string, number>();
		for (const ps of p.stats) {
			if (ps.tid !== tid || !ps.jerseyNumber) {
				continue;
			}
			const value = getValueStatsRow(ps);
			const prevValue = valuesByJerseyNumber.get(ps.jerseyNumber) || 0;
			valuesByJerseyNumber.set(ps.jerseyNumber, prevValue + value);
		}

		if (valuesByJerseyNumber.size === 0) {
			return;
		}

		let maxValue = -Infinity;
		for (const [jerseyNumber, value] of valuesByJerseyNumber) {
			if (value > maxValue) {
				maxValue = value;
				number = jerseyNumber;
			}
		}
	} else {
		return;
	}

	if (tid === undefined || number === undefined) {
		return;
	}

	// Only for AI teams!
	if (
		g.get("userTids").includes(tid) &&
		!local.autoPlayUntil &&
		!g.get("spectator")
	) {
		return;
	}

	const t = await idb.cache.teams.get(tid);
	if (!t) {
		return;
	}

	if (!t.retiredJerseyNumbers) {
		t.retiredJerseyNumbers = [];
	}

	// If too many retired jerseys, delete them until we have a free space
	while (
		t.retiredJerseyNumbers.length >
		MAX_RETIRED_JERSEY_NUMBERS_PER_AI_TEAM - 1
	) {
		const sorted: NonNullable<Team["retiredJerseyNumbers"]> = orderBy(
			t.retiredJerseyNumbers,
			"score",
			"asc",
		);
		const worstRetiredJersey = sorted[0];

		if (
			worstRetiredJersey.score !== undefined &&
			worstRetiredJersey.score > maxScore
		) {
			return;
		}

		t.retiredJerseyNumbers = t.retiredJerseyNumbers.filter(
			row => row !== worstRetiredJersey,
		);
	}

	t.retiredJerseyNumbers.push({
		number,
		seasonRetired: g.get("season"),
		seasonTeamInfo: g.get("season"),
		pid: p.pid,
		text: "",
		score: maxScore,
	});

	/*if (!posCounts[mostCommonPosition]) {
		posCounts[mostCommonPosition] = 0;
	}
	posCounts[mostCommonPosition]++;
	console.log(posCounts);*/

	await idb.cache.teams.put(t);

	logEvent({
		type: "retiredJersey",
		text: `The ${t.region} ${t.name} retired <a href="${helpers.leagueUrl([
			"player",
			p.pid,
		])}">${p.firstName} ${p.lastName}</a>'s #${number}.`,
		showNotification: false,
		pids: [p.pid],
		tids: [t.tid],
		score: 20,
	});
};

export default checkJerseyNumberRetirement;
