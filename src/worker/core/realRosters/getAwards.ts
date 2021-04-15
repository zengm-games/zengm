import { PHASE } from "../../../common";
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
		const awards: Awards = {
			season,
			bestRecord: awardTeam(bestRecordInfoBySeason[season].best),
			bestRecordConfs: bestRecordInfoBySeason[season].bestConfs.map(awardTeam),

			roy: undefined,
			allRookie: [],
			mip: undefined,
			mvp: undefined,
			smoy: undefined,
			allLeague: [
				{
					title: "First Team",
					players: [],
				},
				{
					title: "Second Team",
					players: [],
				},
				{
					title: "Third Team",
					players: [],
				},
			],
			dpoy: undefined,
			allDefensive: [
				{
					title: "First Team",
					players: [],
				},
				{
					title: "Second Team",
					players: [],
				},
				{
					title: "Third Team",
					players: [],
				},
			],
			finalsMvp: undefined,
		};

		allAwards.push(awards);
	}

	return allAwards;
};

export default getAwards;
