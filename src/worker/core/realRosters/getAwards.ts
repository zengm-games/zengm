import {
	AWARD_NAMES,
	PHASE,
	REAL_PLAYERS_INFO,
} from "../../../common/constants.ts";
import { groupByUnique, omit, orderBy } from "../../../common/utils.ts";
import type {
	AwardInfoTeam,
	Awards2,
	GetLeagueOptionsReal,
	PlayerAward,
	TeamSeasonWithoutKey,
} from "../../../common/types.ts";
import type formatPlayerFactory from "./formatPlayerFactory.ts";
import type formatScheduledEvents from "./formatScheduledEvents.ts";
import type { Basketball } from "./loadData.basketball.ts";
import { defaultGameAttributes } from "../../../common/defaultGameAttributes.ts";

type Teams = ReturnType<typeof formatScheduledEvents>["initialTeams"];

type Player = ReturnType<Awaited<ReturnType<typeof formatPlayerFactory>>>;

type AwardsBySeason = Record<
	number,
	{
		slug: string;
		award: PlayerAward;
	}[]
>;

let awardsBySeason: AwardsBySeason | undefined;

const initAwardsBySeason = (awards: Basketball["awards"]) => {
	const bySeason: AwardsBySeason = {};

	for (const [slug, awardsPlayer] of Object.entries(awards)) {
		if (awardsPlayer) {
			for (const award of awardsPlayer) {
				const season = award.season;
				if (!bySeason[season]) {
					bySeason[season] = [];
				}

				bySeason[season].push({
					slug,
					award,
				});
			}
		}
	}

	return bySeason;
};

let playersBySlug: Record<string, Player> | undefined;

const getAwards = (
	awards: Basketball["awards"],
	players: Player[],
	teams: Teams,
	options: GetLeagueOptionsReal,
) => {
	if (
		(options.realStats !== "all" && options.phase <= PHASE.PLAYOFFS) ||
		options.randomDebuts
	) {
		return;
	}

	const invertedAwardNames: Record<string, string> = {};
	for (const [short, long] of Object.entries(AWARD_NAMES)) {
		invertedAwardNames[long] = short;
	}

	if (!awardsBySeason) {
		awardsBySeason = initAwardsBySeason(awards);
	}
	if (!playersBySlug) {
		playersBySlug = groupByUnique(players, "srID");
	}

	const seasonsRange: [number, number] = [
		options.realStats === "all"
			? REAL_PLAYERS_INFO!.MIN_SEASON
			: options.season,
		options.season - 1,
	];
	if (options.phase > PHASE.PLAYOFFS) {
		seasonsRange[1] += 1;
	}

	const allAwards = [];

	const bestRecordInfoBySeason: Record<
		number,
		{
			bestRecord: TeamSeasonWithoutKey;
			bestRecordConfs: Map<number, TeamSeasonWithoutKey>;
			bestRecordDivs: Map<number, TeamSeasonWithoutKey>;
		}
	> = {};

	for (const t of teams) {
		if (!t.seasons) {
			continue;
		}
		for (const teamSeason of t.seasons) {
			const { cid, did, season } = teamSeason;

			if (options.realStats === "all" || options.season === season) {
				if (!bestRecordInfoBySeason[season]) {
					bestRecordInfoBySeason[season] = {
						bestRecord: teamSeason,
						bestRecordConfs: new Map(),
						bestRecordDivs: new Map(),
					};
				} else {
					if (teamSeason.won > bestRecordInfoBySeason[season].bestRecord.won) {
						bestRecordInfoBySeason[season].bestRecord = teamSeason;
					}
				}

				const bestRecordConf =
					bestRecordInfoBySeason[season].bestRecordConfs.get(cid);
				if (!bestRecordConf || teamSeason.won > bestRecordConf.won) {
					bestRecordInfoBySeason[season].bestRecordConfs.set(cid, teamSeason);
				}

				const bestRecordDiv =
					bestRecordInfoBySeason[season].bestRecordDivs.get(did);
				if (!bestRecordDiv || teamSeason.won > bestRecordDiv.won) {
					bestRecordInfoBySeason[season].bestRecordDivs.set(did, teamSeason);
				}
			}
		}
	}

	for (let season = seasonsRange[0]; season <= seasonsRange[1]; season++) {
		const seasonAwards = awardsBySeason[season] ?? [];

		const defaultAwardsByShortName = groupByUnique(
			defaultGameAttributes.awards.map((award, index) => {
				return {
					award,
					index,
				};
			}),
			(row) => row.award.shortName,
		);

		if (!playersBySlug) {
			throw new Error("Should never happen");
		}

		const teamAwardsByShortName: Record<string, AwardInfoTeam> = {};

		const builtInAwards: Awards2["awards"] = [];
		for (const { slug, award } of seasonAwards) {
			if (award.type !== undefined) {
				continue;
			}

			const info = defaultAwardsByShortName[award.shortName]?.award;
			if (!info) {
				throw new Error("Should never happen");
			}

			const common = omit(info, ["group"]);

			const numTeams = award.numTeams;
			if (numTeams === undefined) {
				// Individual award
				builtInAwards.push({
					...common,
					numTeams: undefined,
					winner: [{ pid: playersBySlug[slug]!.pid }],
				});
			} else {
				// Team award
				const teamIndex = award.rank - 1;
				let teamAward = teamAwardsByShortName[info.shortName];
				if (!teamAward) {
					teamAward = {
						...common,
						numTeams,
						winner: [],
					};
					builtInAwards.push(teamAward);
					teamAwardsByShortName[info.shortName] = teamAward;
				}
				teamAward.winner[teamIndex] ??= [];
				teamAward.winner[teamIndex].push({ pid: playersBySlug[slug]!.pid });
			}
		}

		const getBestTids = (record: Map<number, TeamSeasonWithoutKey>) => {
			const output: Record<number, number> = {};
			for (const [key, t] of record) {
				output[key] = t.tid;
			}

			return output;
		};

		const bestRecordInfo = bestRecordInfoBySeason[season]!;

		const awards: Awards2 = {
			season,
			bestRecord: bestRecordInfo.bestRecord.tid,
			bestRecordConfs: getBestTids(bestRecordInfo.bestRecordConfs),
			bestRecordDivs: getBestTids(bestRecordInfo.bestRecordDivs),

			awards: orderBy(
				builtInAwards,
				(award) => defaultAwardsByShortName[award.shortName]?.index ?? Infinity,
				"asc",
			),
		};

		allAwards.push(awards);
	}

	return allAwards;
};

export default getAwards;
