import {
	AWARD_NAMES,
	PHASE,
	PLAYER,
	REAL_PLAYERS_INFO,
} from "../../../common/constants.ts";
import { groupByUnique, omit } from "../../../common/utils.ts";
import type {
	AwardInfo,
	AwardInfoIndividual,
	AwardInfoTeam,
	Awards2,
	GetLeagueOptionsReal,
	PlayerAward,
	TeamSeasonWithoutKey,
} from "../../../common/types.ts";
import type {
	AwardPlayer,
	AwardPlayerDefense,
	Awards,
} from "../../../common/types.basketball.ts";
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

type AwardPlayerOutput<Defensive> = Defensive extends true
	? AwardPlayerDefense
	: AwardPlayer;

const fillInPlayers = (awards: Awards<string, string>): Awards => {
	const awardPlayer = <Defensive extends true | false>(
		slug: string | undefined,
		defensive: Defensive,
		playoffs: boolean = false,
	): AwardPlayerOutput<Defensive> | undefined => {
		if (!slug || !playersBySlug) {
			return;
		}

		const p = playersBySlug[slug];
		if (!p) {
			return;
		}

		let tid: number = PLAYER.DOES_NOT_EXIST;
		let stats;
		if (p.stats) {
			for (const row of p.stats) {
				if (row.season === awards.season && row.playoffs === playoffs) {
					stats = row;
				} else if (row.season > awards.season) {
					break;
				}
			}
		}

		if (stats) {
			tid = stats.tid;
		} else {
			console.log("tid not found", awards.season, slug, defensive, playoffs, p);
		}

		const base = {
			pid: p.pid,
			name: p.name,
			tid,
		};

		let trb = 0;
		if (stats && stats.gp !== undefined && stats.gp > 0) {
			trb = ((stats.trb ?? 0) + (stats.drb ?? 0) + (stats.orb ?? 0)) / stats.gp;
		}

		if (defensive) {
			let blk = 0;
			let stl = 0;
			if (stats && stats.gp !== undefined && stats.gp > 0) {
				if (stats.blk !== undefined) {
					blk = stats.blk / stats.gp;
				}
				if (stats.stl !== undefined) {
					stl = stats.stl / stats.gp;
				}
			}

			return {
				...base,
				trb,
				blk,
				stl,
			} as AwardPlayerOutput<Defensive>;
		}

		let pts = 0;
		let ast = 0;
		if (stats && stats.gp !== undefined && stats.gp > 0) {
			if (stats.pts !== undefined) {
				pts = stats.pts / stats.gp;
			}
			if (stats.ast !== undefined) {
				ast = stats.ast / stats.gp;
			}
		}

		return {
			...base,
			pts,
			trb,
			ast,
		} as AwardPlayerOutput<Defensive>;
	};

	return {
		season: awards.season,
		bestRecord: awards.bestRecord,
		bestRecordConfs: awards.bestRecordConfs,

		roy: awardPlayer(awards.roy, false),
		allRookie: awards.allRookie.map((slug) =>
			awardPlayer(slug, false),
		) as AwardPlayer[],
		mip: awardPlayer(awards.mip, false),
		mvp: awardPlayer(awards.mvp, false),
		smoy: awardPlayer(awards.smoy, false),
		allLeague: [
			{
				title: "First Team",
				players: awards.allLeague[0].players.map((slug) =>
					awardPlayer(slug, false),
				) as AwardPlayer[],
			},
			{
				title: "Second Team",
				players: awards.allLeague[1].players.map((slug) =>
					awardPlayer(slug, false),
				) as AwardPlayer[],
			},
			{
				title: "Third Team",
				players: awards.allLeague[2].players.map((slug) =>
					awardPlayer(slug, false),
				) as AwardPlayer[],
			},
		],
		dpoy: awardPlayer(awards.dpoy, true),
		allDefensive: [
			{
				title: "First Team",
				players: awards.allDefensive[0].players.map((slug) =>
					awardPlayer(slug, true),
				) as AwardPlayerDefense[],
			},
			{
				title: "Second Team",
				players: awards.allDefensive[1].players.map((slug) =>
					awardPlayer(slug, true),
				) as AwardPlayerDefense[],
			},
			{
				title: "Third Team",
				players: awards.allDefensive[2].players.map((slug) =>
					awardPlayer(slug, true),
				) as AwardPlayerDefense[],
			},
		],
		finalsMvp: awardPlayer(awards.finalsMvp, false, true),
		sfmvp:
			awards.sfmvp && awards.sfmvp.length > 0
				? (awards.sfmvp.map((slug) =>
						awardPlayer(slug, false),
					) as AwardPlayer[])
				: undefined,
	};
};

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
			defaultGameAttributes.awards,
			"shortName",
		);

		type MyTeamAward = Omit<AwardInfoTeam, "winner"> & { winner: string[][] };
		const teamAwardsByShortName: Record<string, MyTeamAward> = {};

		const builtInAwards: (
			| (Omit<AwardInfoIndividual, "winner"> & {
					winner: string[];
			  })
			| MyTeamAward
		)[] = [];
		for (const { slug, award } of seasonAwards) {
			if (award.type !== undefined) {
				continue;
			}

			const info = defaultAwardsByShortName[award.shortName];
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
					winner: [slug],
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
					teamAwardsByShortName[info.shortName] = teamAward;
				}
				teamAward.winner[teamIndex] ??= [];
				teamAward.winner[teamIndex].push(slug);
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

		const awards = {
			season,
			bestRecord: bestRecordInfo.bestRecord.tid,
			bestRecordConfs: getBestTids(bestRecordInfo.bestRecordConfs),
			bestRecordDivs: getBestTids(bestRecordInfo.bestRecordDivs),

			awards: builtInAwards,
		};
		console.log(awards);

		allAwards.push(awards);
	}

	return allAwards.map(fillInPlayers);
};

export default getAwards;
