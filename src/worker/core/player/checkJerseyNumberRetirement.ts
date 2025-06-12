import { bySport, isSport } from "../../../common/index.ts";
import type { Player, PlayerStats, Team } from "../../../common/types.ts";
import { maxBy, orderBy } from "../../../common/utils.ts";
import { idb } from "../../db/index.ts";
import { g, local, logEvent, helpers } from "../../util/index.ts";
import { getThreshold } from "./madeHof.football.ts";

// Higher in basketball, because real player leagues have a lot
const MAX_RETIRED_JERSEY_NUMBERS_PER_AI_TEAM = isSport("basketball") ? 30 : 12;

export const getValueStatsRow = (ps: any) => {
	return bySport({
		baseball: ps.war,
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

// Ideally p should be a Player object, but a processed player object works too if it's in the right format
export const getBestPos = (
	p: {
		ratings: {
			pos: string;
			season: number;
		}[];
		stats: PlayerStats[];
	},
	tid: number | undefined,
): string => {
	const posBySeason: Record<number, string> = {};

	for (const row of p.ratings) {
		if (row.pos !== undefined && row.season !== undefined) {
			posBySeason[row.season] = row.pos;
		}
	}

	const posByEWA: Record<string, number> = {};
	for (const ps of p.stats) {
		if (ps.tid === tid || tid === undefined) {
			const ewa = bySport({
				baseball: ps.war,
				basketball: ps.ewa,
				football: ps.av,
				hockey: ps.ps,
			});
			const pos = posBySeason[ps.season];
			if (pos !== undefined) {
				//console.log(ps.pos, ps)
				if (posByEWA[pos] === undefined) {
					posByEWA[pos] = ewa;
				} else {
					posByEWA[pos] += ewa;
				}
			}
		}
	}

	return (
		maxBy(Object.entries(posByEWA), ([, ewa]) => ewa)?.[0] ??
		p.ratings.at(-1)?.pos ??
		"?"
	);
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

	const threshold = bySport({
		baseball: 40,
		basketball: 80,
		football: (() => {
			const mostCommonPosition = getBestPos(p, tid);

			let threshold = getThreshold(mostCommonPosition);
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

			return threshold;
		})(),
		hockey: 80,
	});

	const score =
		value /
		(helpers.gameAndSeasonLengthScaleFactor() * g.get("hofFactor") * threshold);

	return score;
};

const retireJerseyNumber = async ({
	number,
	p,
	score,
	tid,
}: {
	number: string;
	p: Player;
	score: number;
	tid: number;
}) => {
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
		const worstRetiredJersey = sorted[0]!;

		if (
			worstRetiredJersey.score !== undefined &&
			worstRetiredJersey.score > score
		) {
			return;
		}

		t.retiredJerseyNumbers = t.retiredJerseyNumbers.filter(
			(row) => row !== worstRetiredJersey,
		);
	}

	const seasonRetired = g.get("season");

	// Last season player played for team
	const seasonTeamInfo =
		p.stats.findLast((row) => row.tid === t.tid)?.season ?? seasonRetired;

	t.retiredJerseyNumbers.push({
		number,
		seasonRetired,
		seasonTeamInfo,
		pid: p.pid,
		text: "",
		score,
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

const checkJerseyNumberRetirement = async (p: Player) => {
	if (!g.get("aiJerseyRetirement")) {
		return;
	}

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

	for (const [tid, score] of scoresByTid) {
		if (score <= 1) {
			continue;
		}

		let number;

		// Figure out most common jersey number
		const valuesByJerseyNumber = new Map<string, number>();
		for (const ps of p.stats) {
			if (ps.tid !== tid || ps.jerseyNumber === undefined) {
				continue;
			}
			const value = getValueStatsRow(ps);
			const prevValue = valuesByJerseyNumber.get(ps.jerseyNumber) ?? 0;
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

		if (number === undefined) {
			continue;
		}

		// Only for AI teams!
		if (
			g.get("userTids").includes(tid) &&
			!local.autoPlayUntil &&
			!g.get("spectator")
		) {
			continue;
		}

		await retireJerseyNumber({
			number,
			p,
			score,
			tid,
		});
	}
};

export default checkJerseyNumberRetirement;
