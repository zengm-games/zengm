import omit from "lodash-es/omit";
import orderBy from "lodash-es/orderBy";
import range from "lodash-es/range";
import { isSport, PHASE } from "../../common";
import getTeamInfos from "../../common/getTeamInfos";
import teamInfos from "../../common/teamInfos";
import type { Div } from "../../common/types";
import { realRosters } from "../core";
import { LATEST_SEASON, MIN_SEASON } from "../core/realRosters/getLeague";
import geographicCoordinates from "../core/team/geographicCoordinates";
import { random } from "../util";
import type { NewLeagueTeamWithoutRank } from "../../ui/views/NewLeague/types";
import { groupBy } from "../../common/groupBy";
import addSeasonInfoToTeams from "../core/realRosters/addSeasonInfoToTeams";
import loadDataBasketball from "../core/realRosters/loadData.basketball";

type Clusters = {
	center: [number, number];
	pointIndexes: number[];
	distance: number;
}[];

const stringifyClusters = (clusters: Clusters) => {
	const clusters2 = clusters.map(cluster => [...cluster.pointIndexes].sort());

	return JSON.stringify(clusters2);
};

/*const calcDistance = (a: [number, number], b: [number, number]) =>
	(a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;*/

/*// Haversine distance http://www.movable-type.co.uk/scripts/gis-faq-5.1.html
const calcDistance = (x: [number, number], y: [number, number]) => {
	const lat1 = x[0] * Math.PI / 180;
	const lon1 = x[1] * Math.PI / 180;
	const lat2 = y[0] * Math.PI / 180;
	const lon2 = y[1] * Math.PI / 180;

	const dlat = lat2 - lat1;
	const dlon = lon2 - lon1;
	const a = Math.sin(dlat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dlon / 2) ** 2;
	const c = Math.asin(Math.min(1, Math.sqrt(a)));

	// Don't need to scale for the size of the earth because we're always on earth
	return 2 * c * 6371;
}*/

const calcDistance = (a: [number, number], b: [number, number]) => {
	// Factor makes it so 60 degrees (on original scale) is now 0, so that's where the discontinuity is. Not perfect for all situations, but mostly works to put Asian/Australian teams in the western conference
	const factor = 300;
	const lat1 = a[0];
	const lon1 = (a[1] + factor) % 360;
	const lat2 = b[0];
	const lon2 = (b[1] + factor) % 360;

	return (lat1 - lat2) ** 2 + (lon1 - lon2) ** 2;
};

// This is normal k-means clustering, just with some very crudely imposed static cluster sizes. Still seems to work pretty well, assuing `points` is fairly small and `NUM_TRIES` is fairly large.
const kmeansFixedSize = (
	points: [number, number][],
	clusterSizes: number[],
) => {
	const NUM_TRIES = 100;
	const ITERATION_LIMIT = 1000;

	const minima = [0, 1].map(i => Math.min(...points.map(row => row[i])));
	const maxima = [0, 1].map(i => Math.max(...points.map(row => row[i])));

	const pointIndexes = points.map((point, i) => i);

	const resetClusters = (prevClusters?: Clusters) =>
		clusterSizes.map((clusterSize, i) => {
			let center: [number, number];
			if (prevClusters) {
				// Update centers, see if we do better next time
				center = [0, 0];
				const { pointIndexes } = prevClusters[i];
				for (const pointIndex of pointIndexes) {
					const point = points[pointIndex];
					center[0] += point[0];
					center[1] += point[1];
				}
				center[0] /= pointIndexes.length;
				center[1] /= pointIndexes.length;
			} else {
				// Initialize with random center
				center = [
					random.uniform(minima[0], maxima[0]),
					random.uniform(minima[1], maxima[1]),
				];
			}

			return {
				center,
				pointIndexes: [] as number[],
				distance: 0,
			};
		});

	let bestClusters: Clusters | undefined;
	let minScore = Infinity;

	for (let tryNum = 0; tryNum < NUM_TRIES; tryNum++) {
		let clusters = resetClusters();
		let prevClusters = "";

		let iteration = 0;
		while (true) {
			// Randomize order of points, to help find different solutions given the cluster size constraint
			random.shuffle(pointIndexes);

			// Assign each point to a cluster
			for (const pointIndex of pointIndexes) {
				const point = points[pointIndex];

				let minDistance = Infinity;
				let clusterIndex: number | undefined;
				for (let i = 0; i < clusters.length; i++) {
					if (clusters[i].pointIndexes.length >= clusterSizes[i]) {
						continue;
					}

					const center = clusters[i].center;
					const distance = calcDistance(point, center);

					if (distance < minDistance) {
						minDistance = distance;
						clusterIndex = i;
					}
				}

				if (clusterIndex === undefined) {
					throw new Error("undefined clusterIndex");
				}

				clusters[clusterIndex].pointIndexes.push(pointIndex);
				clusters[clusterIndex].distance += minDistance;
			}

			const clustersString = stringifyClusters(clusters);
			if (clustersString === prevClusters) {
				break;
			}

			iteration += 1;

			if (iteration > ITERATION_LIMIT) {
				// console.log("Did not converge");
				break;
			}

			clusters = resetClusters(clusters);
			prevClusters = clustersString;
		}

		// Calculate score, see if it is better than previous
		let score = 0;
		for (const { distance } of clusters) {
			score += distance;
		}

		if (score < minScore) {
			bestClusters = clusters;
			minScore = score;
		}

		// console.log(tryNum, score, clusters);
	}

	if (!bestClusters) {
		throw new Error("undefind bestClusters");
	}
	// console.log(minScore, bestClusters);

	// Sort each cluster north to south
	// return bestClusters.map(cluster => orderBy(cluster, pointIndex => points[pointIndex][0], "desc"));
	return bestClusters;
};

// When using default divs, try to match clusters geographically with the default divs
const sortByDivs = (
	clusters: Clusters,
	divs: Div[],
	numTeamsPerDiv: number[],
) => {
	// Need all divs to be same size, otherwise it may behave strangely
	const numTeams = numTeamsPerDiv[0];
	for (const numTeams2 of numTeamsPerDiv) {
		if (numTeams !== numTeams2) {
			return clusters;
		}
	}

	// Rough estimates, see "conference coordinates.ods"
	const DEFAULT_COORDS: Record<string, [number, number]> = {
		// basketball
		Atlantic: [42.5, -74.5],
		Central: [43.3, -87.2],
		Southeast: [32.4, -82],
		Southwest: [31.9, -97.2],
		Northwest: [44.9, -112.4],
		Pacific: [35.5, -121.4],

		// football
		East: [38.3, -75.7],
		North: [42.1, -85.7],
		South: [31.5, -87.9],
		West: [38.7, -119.7],

		// hockey
		Metropolitan: [39.5, -75.2],

		// extra
		Northeast: [43.7, -74.1],
	};
	if (isSport("hockey")) {
		// Override basketball ones with same names
		DEFAULT_COORDS.Atlantic = [41.4, -81.2];
		DEFAULT_COORDS.Central = [42.5, -100.8];
		DEFAULT_COORDS.Pacific = [40.68, -123.38];
	}

	// Bail out if any div has a non-default name
	for (const div of divs) {
		if (!DEFAULT_COORDS[div.name]) {
			return clusters;
		}
	}

	// Shuffle divs, then go one at a time finding best cluster, find lowest distance

	let bestClusters: Clusters | undefined;
	let minScore = Infinity;

	const NUM_TRIES = 20; // Seems to converge pretty quick
	const divIndexes = divs.map((div, i) => i);

	for (let tryNum = 0; tryNum < NUM_TRIES; tryNum++) {
		random.shuffle(divIndexes);

		const newClusters: Clusters = [];
		let remainingClusters = [...clusters];
		random.shuffle(remainingClusters);

		let score = 0;

		for (const divIndex of divIndexes) {
			const div = divs[divIndex];
			const divCoords = DEFAULT_COORDS[div.name];

			let bestCluster: Clusters[number] | undefined;
			let minDistance = Infinity;
			for (const cluster of remainingClusters) {
				const distance = calcDistance(cluster.center, divCoords);
				if (distance < minDistance) {
					bestCluster = cluster;
					minDistance = distance;
				}
			}

			if (!bestCluster) {
				throw new Error("undefind bestCluster");
			}

			newClusters[divIndex] = bestCluster;
			remainingClusters = remainingClusters.filter(
				cluster => cluster !== bestCluster,
			);
			score += minDistance;
		}

		if (score < minScore) {
			bestClusters = newClusters;
			minScore = score;
		}
	}

	if (!bestClusters) {
		throw new Error("undefind bestClusters");
	}
	return bestClusters;
};

type MyTeam = NewLeagueTeamWithoutRank & {
	weight?: number;
};

const getAllRealTeamInfos = async () => {
	const teamInfos: (MyTeam & {
		weight: number;
	})[] = [];

	const seasons = range(MIN_SEASON, LATEST_SEASON + 1);

	for (const season of seasons) {
		const { teams } = await realRosters.getLeagueInfo({
			type: "real",
			season,
			phase: PHASE.PLAYOFFS,
			randomDebuts: false,
			realDraftRatings: "draft",
			realStats: "none",
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
	const regionsSeen = new Set();

	// For any team with many duplicates removed, the remaining one should have a pretty high weight;
	const infosByAbbrev: Record<string, (typeof teamInfos)[number]> = {};
	const infosByRegion: Record<string, (typeof teamInfos)[number]> = {};

	return teamInfos.filter(t => {
		if (abbrevsSeen.has(t.abbrev) || regionsSeen.has(t.region)) {
			const toAdd = [];
			if (infosByAbbrev[t.abbrev]) {
				toAdd.push(infosByAbbrev[t.abbrev]);
			}
			if (infosByRegion[t.region]) {
				toAdd.push(infosByRegion[t.region]);
			}
			for (const t of toAdd) {
				t.weight += 1 / toAdd.length;
			}

			return false;
		}
		abbrevsSeen.add(t.abbrev);
		regionsSeen.add(t.region);
		infosByAbbrev[t.abbrev] = t;
		infosByRegion[t.region] = t;
		return true;
	});
};

const augmentRealTeams = async (teams: MyTeam[]) => {
	const basketball = await loadDataBasketball();

	const output: NewLeagueTeamWithoutRank[] = [];

	const teamsBySeason = groupBy(teams, "season");
	for (const [seasonString, teamsSeason] of Object.entries(teamsBySeason)) {
		const season = parseInt(seasonString);
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
				realDraftRatings: "rookie",
				realStats: "none",
				includeSeasonInfo: true,
			},
		);

		for (const t of teamsWithSeasonInfo) {
			output.push({
				...omit(t, "weight"),
				usePlayers: true,
			});
		}
	}

	return teams.map(t => output.find(t2 => t.tid === t2.tid)!);
};

const getRandomTeams = async ({
	divs,
	numTeamsPerDiv,
	real,
	weightByPopulation,
	northAmericaOnly,
}: {
	divs: Div[];
	numTeamsPerDiv: number[];
	real: boolean;
	weightByPopulation: boolean;
	northAmericaOnly: boolean;
}) => {
	let numTeamsTotal = 0;
	for (const num of numTeamsPerDiv) {
		numTeamsTotal += num;
	}

	let allTeamInfos: MyTeam[];
	if (real) {
		allTeamInfos = await getAllRealTeamInfos();
	} else {
		allTeamInfos = getTeamInfos(
			Object.keys(teamInfos).map(abbrev => ({
				tid: 0,
				cid: 0,
				did: 0,
				abbrev,
			})),
		);
	}

	if (northAmericaOnly) {
		allTeamInfos = allTeamInfos.filter(
			t => !geographicCoordinates[t.region]?.outsideNorthAmerica,
		);
	}

	let weightFunction:
		| ((teamInfo: { pop: number; weight?: number }) => number)
		| undefined;
	if (weightByPopulation) {
		weightFunction = teamInfo => teamInfo.pop;
	} else if (real) {
		weightFunction = teamInfo => teamInfo.weight ?? 1;
	}

	const teamsRemaining = new Set(allTeamInfos);
	if (teamsRemaining.size < numTeamsTotal) {
		return `There are only ${teamsRemaining.size} built-in teams, so your current set of ${numTeamsTotal} teams cannot be replaced by random built-in teams.`;
	}
	const selectedTeamInfos: typeof allTeamInfos = [];
	for (let i = 0; i < numTeamsTotal; i++) {
		const teamInfo = random.choice(Array.from(teamsRemaining), weightFunction);
		selectedTeamInfos.push(teamInfo);
		teamsRemaining.delete(teamInfo);
	}

	const teamInfoCluster = selectedTeamInfos.map(
		teamInfo =>
			[
				geographicCoordinates[teamInfo.region].latitude,
				geographicCoordinates[teamInfo.region].longitude,
			] as [number, number],
	);

	// Clustering to assign divisions
	const clusters = sortByDivs(
		kmeansFixedSize(teamInfoCluster, numTeamsPerDiv),
		divs,
		numTeamsPerDiv,
	);

	const teamInfosInput = [];
	for (let i = 0; i < divs.length; i++) {
		const div = divs[i];

		// Sort teams within a division by region/name so they look nicer
		const tidsSorted = orderBy(clusters[i].pointIndexes, teamIndex => {
			const teamInfo = selectedTeamInfos[teamIndex];
			return `${teamInfo.region} ${teamInfo.name}`;
		});

		for (const tid of tidsSorted) {
			teamInfosInput.push({
				...selectedTeamInfos[tid],
				tid,
				cid: div.cid,
				did: div.did,
			});
		}
	}

	if (real) {
		return augmentRealTeams(teamInfosInput);
	}

	return teamInfosInput;
};

export default getRandomTeams;
