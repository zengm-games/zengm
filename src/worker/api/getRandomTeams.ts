import { PHASE } from "../../common/index.ts";
import getTeamInfos from "../../common/getTeamInfos.ts";
import teamInfos from "../../common/teamInfos.ts";
import type { Conf, Div } from "../../common/types.ts";
import { realRosters } from "../core/index.ts";
import geographicCoordinates, {
	type Continent,
} from "../../common/geographicCoordinates.ts";
import { random } from "../util/index.ts";
import type { NewLeagueTeamWithoutRank } from "../../ui/views/NewLeague/types.ts";
import { groupBy, omit, orderBy, range } from "../../common/utils.ts";
import addSeasonInfoToTeams from "../core/realRosters/addSeasonInfoToTeams.ts";
import loadDataBasketball from "../core/realRosters/loadData.basketball.ts";
import { kmeansFixedSize, sortByDivs } from "../core/team/cluster.ts";
import type { PopulationFactor } from "../../ui/views/NewLeague/RandomizeTeamsModal.tsx";

type MyTeam = NewLeagueTeamWithoutRank & {
	weight?: number;
};

const getAllRealTeamInfos = async (seasonRange: [number, number]) => {
	const teamInfos: (MyTeam & {
		weight: number;
	})[] = [];

	const seasons = range(seasonRange[0], seasonRange[1] + 1);

	for (const season of seasons) {
		const { teams } = await realRosters.getLeagueInfo({
			type: "real",
			season,
			phase: PHASE.PLAYOFFS,
			randomDebuts: false,
			randomDebutsKeepCurrent: false,
			realDraftRatings: "draft",
			realStats: "none",
			includePlayers: false,
		});

		for (const t of teams) {
			teamInfos.push({
				...t,
				weight: 1,
				season,
			});
		}
	}

	// Shuffle because we only keep one team for each abbrev, so we want them in random order so it's not always the same
	random.shuffle(teamInfos);

	// Unique abbrevs - don't have to worry about rewriting due to collision, and how that impacts real team data. Unique regions - just feels right.
	const abbrevsSeen = new Set();

	// For any team with many duplicates removed, the remaining one should have a pretty high weight;
	const infosByAbbrev: Record<string, (typeof teamInfos)[number]> = {};

	return teamInfos.filter((t) => {
		// TODO - This code is mostly doing nothing and infosByAbbrev is probably not needed
		if (abbrevsSeen.has(t.abbrev)) {
			const toAdd = [];
			if (infosByAbbrev[t.abbrev]) {
				toAdd.push(infosByAbbrev[t.abbrev]!);
			}
			for (const t of toAdd) {
				t.weight += 1 / toAdd.length;
			}

			return false;
		}
		abbrevsSeen.add(t.abbrev);
		infosByAbbrev[t.abbrev] = t;
		return true;
	});
};

const augmentRealTeams = async (teams: MyTeam[]) => {
	const basketball = await loadDataBasketball();

	const output: NewLeagueTeamWithoutRank[] = [];

	const teamsBySeason = groupBy(teams, "season");
	for (const [seasonString, teamsSeason] of Object.entries(teamsBySeason)) {
		const season = Number.parseInt(seasonString);
		if (Number.isNaN(season)) {
			continue;
		}

		const teamsWithSeasonInfo = await addSeasonInfoToTeams(
			teamsSeason as (MyTeam & { srID: string })[],
			basketball,
			undefined,
			{
				type: "real",
				season,
				phase: PHASE.PLAYOFFS,
				randomDebuts: false,
				randomDebutsKeepCurrent: false,
				realDraftRatings: "rookie",
				realStats: "none",
				includeSeasonInfo: true,
				includePlayers: false,
			},
		);

		for (const t of teamsWithSeasonInfo) {
			output.push({
				...omit(t, ["weight"]),
				usePlayers: true,
			});
		}
	}

	return teams.map((t) => output.find((t2) => t.tid === t2.tid)!);
};

const getRandomTeams = async ({
	divInfo,
	real,
	populationFactor,
	continents,
	seasonRange,
}: {
	divInfo:
		| {
				type: "explicit";
				confs: Conf[];
				divs: Div[];
				numTeamsPerDiv: number[];
		  }
		| {
				type: "autoSeasonRange";
		  };
	real: boolean;
	populationFactor: PopulationFactor;
	continents: ReadonlyArray<Continent>;
	seasonRange: [number, number]; // Only does something if real is true
}) => {
	let confs;
	let divs;
	let numTeamsPerDiv;
	if (divInfo.type === "explicit") {
		confs = divInfo.confs;
		divs = divInfo.divs;
		numTeamsPerDiv = divInfo.numTeamsPerDiv;
	} else {
		// Automatically get info for a real players league started at the end of seasonRange
		const { gameAttributes, teams } = await realRosters.getLeagueInfo({
			type: "real",
			season: seasonRange[1],
			phase: PHASE.PLAYOFFS,
			randomDebuts: false,
			randomDebutsKeepCurrent: false,
			realDraftRatings: "draft",
			realStats: "none",
			includePlayers: false,
		});
		confs = gameAttributes.confs;
		divs = gameAttributes.divs;
		numTeamsPerDiv = divs.map(
			(div) => teams.filter((t) => t.did === div.did).length,
		);
	}

	let numTeamsTotal = 0;
	for (const num of numTeamsPerDiv) {
		numTeamsTotal += num;
	}

	let allTeamInfos: MyTeam[];
	if (real) {
		allTeamInfos = await getAllRealTeamInfos(seasonRange);
	} else {
		allTeamInfos = getTeamInfos(
			Object.keys(teamInfos).map((abbrev) => ({
				tid: 0,
				cid: 0,
				did: 0,
				abbrev,
			})),
		);
	}

	const continentsSet = new Set(continents);
	allTeamInfos = allTeamInfos.filter((t) =>
		continentsSet.has(geographicCoordinates[t.region]?.continent ?? "Unknown"),
	);

	if (allTeamInfos.length < numTeamsTotal) {
		return `There are only ${allTeamInfos.length} teams available to select based on your settings, but your league has ${numTeamsTotal} teams in it. Either make your league smaller or change your settings to create more candidate teams.`;
	}

	let selectedTeamInfos: typeof allTeamInfos;
	if (populationFactor === "largest" || populationFactor === "smallest") {
		selectedTeamInfos = orderBy(
			allTeamInfos,
			"pop",
			populationFactor === "largest" ? "desc" : "asc",
		).slice(0, numTeamsTotal);
	} else {
		let weightFunction:
			| ((teamInfo: { pop: number; weight?: number }) => number)
			| undefined;
		if (populationFactor === "randomWeighted") {
			weightFunction = (teamInfo) => teamInfo.pop;
		} else if (real) {
			weightFunction = (teamInfo) => teamInfo.weight ?? 1;
		}

		selectedTeamInfos = [];
		const teamsRemaining = new Set(allTeamInfos);
		for (let i = 0; i < numTeamsTotal; i++) {
			const teamInfo = random.choice(
				Array.from(teamsRemaining),
				weightFunction,
			);
			selectedTeamInfos.push(teamInfo);
			teamsRemaining.delete(teamInfo);
		}
	}

	const teamInfoCluster = selectedTeamInfos.map(
		(teamInfo) =>
			[
				geographicCoordinates[teamInfo.region]!.latitude,
				geographicCoordinates[teamInfo.region]!.longitude,
			] as [number, number],
	);

	// Clustering to assign divisions
	const clusters = sortByDivs(
		kmeansFixedSize(teamInfoCluster, numTeamsPerDiv),
		divs,
		numTeamsPerDiv,
	).clusters;

	let teamsOutput = [];
	for (const [i, div] of divs.entries()) {
		// Sort teams within a division by region/name so they look nicer
		const tidsSorted = orderBy(clusters[i]!.pointIndexes, (teamIndex) => {
			const teamInfo = selectedTeamInfos[teamIndex]!;
			return `${teamInfo.region} ${teamInfo.name}`;
		});

		for (const tid of tidsSorted) {
			teamsOutput.push({
				...selectedTeamInfos[tid]!,
				tid,
				cid: div.cid,
				did: div.did,
			});
		}
	}

	if (real) {
		teamsOutput = await augmentRealTeams(teamsOutput);
	}

	return {
		confs,
		divs,
		teams: teamsOutput,
	};
};

export default getRandomTeams;
