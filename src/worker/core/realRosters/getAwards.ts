import { AWARD_NAMES, PHASE, PLAYER } from "../../../common";
import { groupByUnique } from "../../../common/groupBy";
import type {
	GetLeagueOptionsReal,
	TeamSeasonWithoutKey,
	ThenArg,
} from "../../../common/types";
import type {
	AwardPlayer,
	AwardPlayerDefense,
	Awards,
} from "../../../common/types.basketball";
import type formatPlayerFactory from "./formatPlayerFactory";
import type formatScheduledEvents from "./formatScheduledEvents";
import type { Basketball } from "./loadData.basketball";

type Teams = ReturnType<typeof formatScheduledEvents>["initialTeams"];

type Player = ReturnType<ThenArg<ReturnType<typeof formatPlayerFactory>>>;

type AwardsBySeason = Record<
	number,
	{
		slug: string;
		type: string;
	}[]
>;

let awardsBySeason: AwardsBySeason | undefined;

const initAwardsBySeason = (awards: Basketball["awards"]) => {
	const bySeason: AwardsBySeason = {};

	for (const [slug, awardsPlayer] of Object.entries(awards)) {
		if (awardsPlayer) {
			for (const { season, type } of awardsPlayer) {
				if (!bySeason[season]) {
					bySeason[season] = [];
				}

				bySeason[season].push({
					slug,
					type,
				});
			}
		}
	}

	return bySeason;
};

let playersBySlug: Record<string, Player> | undefined;

const awardTeam = (teamSeason: TeamSeasonWithoutKey) => {
	return {
		tid: teamSeason.tid,
		abbrev: teamSeason.abbrev,
		region: teamSeason.region,
		name: teamSeason.name,
		won: teamSeason.won,
		lost: teamSeason.lost,
		tied: teamSeason.tied,
		otl: teamSeason.otl,
	};
};

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

		let tid = PLAYER.DOES_NOT_EXIST;
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
			if (stats.drb !== undefined) {
				trb = (stats.drb + (stats.orb ?? 0)) / stats.gp;
			}
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
		allRookie: awards.allRookie.map(slug =>
			awardPlayer(slug, false),
		) as AwardPlayer[],
		mip: awardPlayer(awards.mip, false),
		mvp: awardPlayer(awards.mvp, false),
		smoy: awardPlayer(awards.smoy, false),
		allLeague: [
			{
				title: "First Team",
				players: awards.allLeague[0].players.map(slug =>
					awardPlayer(slug, false),
				) as AwardPlayer[],
			},
			{
				title: "Second Team",
				players: awards.allLeague[1].players.map(slug =>
					awardPlayer(slug, false),
				) as AwardPlayer[],
			},
			{
				title: "Third Team",
				players: awards.allLeague[2].players.map(slug =>
					awardPlayer(slug, false),
				) as AwardPlayer[],
			},
		],
		dpoy: awardPlayer(awards.dpoy, true),
		allDefensive: [
			{
				title: "First Team",
				players: awards.allDefensive[0].players.map(slug =>
					awardPlayer(slug, true),
				) as AwardPlayerDefense[],
			},
			{
				title: "Second Team",
				players: awards.allDefensive[1].players.map(slug =>
					awardPlayer(slug, true),
				) as AwardPlayerDefense[],
			},
			{
				title: "Third Team",
				players: awards.allDefensive[2].players.map(slug =>
					awardPlayer(slug, true),
				) as AwardPlayerDefense[],
			},
		],
		finalsMvp: awardPlayer(awards.finalsMvp, false, true),
	};
};

const getAwards = (
	awards: Basketball["awards"],
	players: Player[],
	teams: Teams,
	options: GetLeagueOptionsReal,
) => {
	if (options.realStats !== "all") {
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

	const seasonsRange = [1947, options.season - 1];
	if (options.phase > PHASE.PLAYOFFS) {
		seasonsRange[1] += 1;
	}

	const allAwards = [];

	const bestRecordInfoBySeason: Record<
		number,
		{
			best: TeamSeasonWithoutKey;
			bestConfs: TeamSeasonWithoutKey[];
		}
	> = {};

	for (const t of teams) {
		if (!t.seasons) {
			continue;
		}
		for (const teamSeason of t.seasons) {
			const { cid, season } = teamSeason;
			if (!bestRecordInfoBySeason[season]) {
				bestRecordInfoBySeason[season] = {
					best: teamSeason,
					bestConfs: [],
				};
			} else {
				if (teamSeason.won > bestRecordInfoBySeason[season].best.won) {
					bestRecordInfoBySeason[season].best = teamSeason;
				}
			}

			if (!bestRecordInfoBySeason[season].bestConfs[cid]) {
				bestRecordInfoBySeason[season].bestConfs[cid] = teamSeason;
			} else {
				if (
					teamSeason.won > bestRecordInfoBySeason[season].bestConfs[cid].won
				) {
					bestRecordInfoBySeason[season].bestConfs[cid] = teamSeason;
				}
			}
		}
	}

	for (let season = seasonsRange[0]; season <= seasonsRange[1]; season++) {
		const seasonAwards = awardsBySeason[season] ?? [];
		const simple: Record<string, string | undefined> = {
			roy: undefined,
			mip: undefined,
			mvp: undefined,
			smoy: undefined,
			dpoy: undefined,
			finalsMvp: undefined,
		};
		const allLeague1: string[] = [];
		const allLeague2: string[] = [];
		const allLeague3: string[] = [];
		const allDefensive1: string[] = [];
		const allDefensive2: string[] = [];
		const allDefensive3: string[] = [];
		const allRookie: string[] = [];

		for (const { slug, type } of seasonAwards) {
			const short = invertedAwardNames[type];
			if (short && simple.hasOwnProperty(short)) {
				simple[short] = slug;
			} else if (type === "First Team All-League") {
				allLeague1.push(slug);
			} else if (type === "Second Team All-League") {
				allLeague2.push(slug);
			} else if (type === "Third Team All-League") {
				allLeague3.push(slug);
			} else if (type === "First Team All-Defensive") {
				allDefensive1.push(slug);
			} else if (type === "Second Team All-Defensive") {
				allDefensive2.push(slug);
			} else if (type === "Third Team All-Defensive") {
				allDefensive3.push(slug);
			} else if (type === AWARD_NAMES.allRookie) {
				allRookie.push(slug);
			}
		}

		const awards: Awards<string, string> = {
			season,
			bestRecord: awardTeam(bestRecordInfoBySeason[season].best),
			bestRecordConfs: bestRecordInfoBySeason[season].bestConfs.map(awardTeam),

			roy: simple.roy,
			allRookie,
			mip: simple.mip,
			mvp: simple.mvp,
			smoy: simple.smoy,
			allLeague: [
				{
					title: "First Team",
					players: allLeague1,
				},
				{
					title: "Second Team",
					players: allLeague2,
				},
				{
					title: "Third Team",
					players: allLeague3,
				},
			],
			dpoy: simple.dpoy,
			allDefensive: [
				{
					title: "First Team",
					players: allDefensive1,
				},
				{
					title: "Second Team",
					players: allDefensive2,
				},
				{
					title: "Third Team",
					players: allDefensive3,
				},
			],
			finalsMvp: simple.finalsMvp,
		};

		allAwards.push(awards);
	}

	return allAwards.map(fillInPlayers);
};

export default getAwards;
