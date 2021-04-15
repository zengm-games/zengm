import { AWARD_NAMES, PHASE } from "../../../common";
import type {
	GetLeagueOptionsReal,
	TeamSeasonWithoutKey,
} from "../../../common/types";
import type { Awards } from "../../../common/types.basketball";
import type formatScheduledEvents from "./formatScheduledEvents";
import type { Basketball } from "./loadData.basketball";

type Teams = ReturnType<typeof formatScheduledEvents>["initialTeams"];

type AwardsBySeason = Record<
	number,
	{
		slug: string;
		type: string;
	}[]
>;

let awardsBySeason: AwardsBySeason | undefined;

const initAwardsBySeason = (awards: Basketball["awards"]): AwardsBySeason => {
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

const getAwards = (
	awards: Basketball["awards"],
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
			}
		}
		console.log(season, simple);

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

	console.log(allAwards);
	return allAwards;
};

export default getAwards;
