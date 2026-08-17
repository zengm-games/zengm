import { idb } from "../../db/index.ts";
import { g, helpers, logEvent } from "../../util/index.ts";
import type {
	Conditions,
	DistributiveOmit,
	PlayerAward,
} from "../../../common/types.ts";
import addAward from "../player/addAward.ts";
import { formatPlayerAwardName } from "../../../common/awards.ts";
import { getGroupPrefix } from "./prefixes.ts";

export type AwardsByPlayer = {
	pid: number;
	tid: number;
	name: string;
	award: DistributiveOmit<PlayerAward, "season">;
}[];

export const saveAwardsByPlayer = async (
	awardsByPlayer: AwardsByPlayer,
	conditions: Conditions,
	season: number = g.get("season"),
	logEvents: boolean = true,
	allStarGID?: number,
) => {
	if (awardsByPlayer.length === 0) {
		return;
	}

	// None of this stuff needs to block, it's just notifications
	for (const p of awardsByPlayer) {
		let text = `<a href="${helpers.leagueUrl(["player", p.pid])}">${
			p.name
		}</a> (<a href="${helpers.leagueUrl([
			"roster",
			`${g.get("teamInfoCache")[p.tid]?.abbrev}_${p.tid}`,
			g.get("season"),
		])}">${g.get("teamInfoCache")[p.tid]?.abbrev}</a>) `;
		let score;

		if (p.award.type?.includes("Leader")) {
			text += `led the league in ${p.award.type
				.replace("League ", "")
				.replace(" Leader", "")
				.toLowerCase()}.`;
			score = 10;
		} else if (p.award.type === "All-Star") {
			text += "made the All-Star team.";
			score = 10;
		} else if (p.award.type === "All-Star MVP") {
			text += `won the <a href="${helpers.leagueUrl([
				"game_log",
				"special",
				season,
				allStarGID,
			])}">All-Star MVP</a> award.`;
			score = 10;
		} else if (p.award.type === "Slam Dunk Contest Winner") {
			text += "won the slam dunk contest.";
			score = 10;
		} else if (p.award.type === "Three-Point Contest Winner") {
			text += "won the three-point contest.";
			score = 10;
		} else if (p.award.type === undefined && p.award.numTeams !== undefined) {
			// Team awards - arguably should have formatAwardNamePrefix here too, idk
			const groupPrefix = getGroupPrefix(p.award, season);
			text += `made the ${formatPlayerAwardName(p.award, { groupPrefix })}.`;
			score = 10;
		} else {
			if (p.award.type !== undefined || p.award.rank === 1) {
				const groupPrefix =
					p.award.type === undefined
						? getGroupPrefix(p.award, season)
						: undefined;
				text += `won the ${formatPlayerAwardName(p.award, { groupPrefix })} award.`;
				score = 20;
			}
		}

		if (logEvents && score !== undefined) {
			logEvent(
				{
					type: "award",
					text,
					showNotification: false,
					pids: [p.pid],
					tids: [p.tid],
					score,
				},
				conditions,
			);
		}
	}
	const pids = Array.from(
		new Set(awardsByPlayer.map((award) => award.pid)),
	).filter((x) => x != undefined);
	for (const pid of pids) {
		let p = await idb.cache.players.get(pid);
		if (!p) {
			p = await idb.getCopy.players(
				{
					pid,
				},
				"noCopyCache",
			);
		}

		if (p && pid != undefined) {
			for (const awardByPlayer of awardsByPlayer) {
				if (awardByPlayer.pid === pid) {
					addAward(p, {
						...awardByPlayer.award,
						season,
					});
				}
			}
			await idb.cache.players.put(p);
		}
	}
};

export const deleteAwardsByPlayer = async (
	awardsByPlayer: {
		pid: number;
		type: string;
	}[],
	season: number,
) => {
	if (awardsByPlayer.length === 0) {
		return;
	}

	const pids = Array.from(new Set(awardsByPlayer.map((award) => award.pid)));
	const players = await idb.getCopies.players(
		{
			pids,
		},
		"noCopyCache",
	);
	for (const p of players) {
		const typesToDelete = awardsByPlayer
			.filter((award) => award.pid === p.pid)
			.map((award) => award.type);
		p.awards = p.awards.filter(
			(award) => award.season != season || !typesToDelete.includes(award.type),
		);
		await idb.cache.players.put(p);
	}
};

export const addSimpleAndTeamAwardsToAwardsByPlayer = () => {};
