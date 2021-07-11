import getTeamInfos from "../../common/getTeamInfos";
import teamInfos from "../../common/teamInfos";
import type { Div } from "../../common/types";
import { random } from "../util";

type Clusters = number[][];

const stringifyClusters = (clusters: Clusters) => {
	const clusters2 = clusters.map(cluster => [...cluster].sort());

	return JSON.stringify(clusters2);
};

const NUM_TRIES = 100;
const ITERATION_LIMIT = 1000;

// This is normal k-means clustering, just with some very crudely imposed static cluster sizes. Still seems to work pretty well, assuing `points` is fairly small and `NUM_TRIES` is fairly large.
const kmeansFixedSize = (
	points: [number, number][],
	clusterSizes: number[],
) => {
	const minima = [0, 1].map(i => Math.min(...points.map(row => row[i])));
	const maxima = [0, 1].map(i => Math.max(...points.map(row => row[i])));

	const pointIndexes = points.map((point, i) => i);

	const getInitialCenters = () =>
		clusterSizes.map(
			() =>
				[
					random.uniform(minima[0], maxima[0]),
					random.uniform(minima[1], maxima[1]),
				] as [number, number],
		);

	const resetClusters = () => clusterSizes.map(() => [] as number[]);

	let bestClusters: Clusters | undefined;
	let bestScore = Infinity;

	for (let tryNum = 0; tryNum < NUM_TRIES; tryNum++) {
		let centers = getInitialCenters();
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
				for (let i = 0; i < centers.length; i++) {
					if (clusters[i].length >= clusterSizes[i]) {
						continue;
					}

					const center = centers[i];
					const distance = Math.sqrt(
						(point[0] - center[0]) ** 2 + (point[1] - center[1]) ** 2,
					);

					if (distance < minDistance) {
						minDistance = distance;
						clusterIndex = i;
					}
				}

				if (clusterIndex === undefined) {
					throw new Error("undefined clusterIndex");
				}

				clusters[clusterIndex].push(pointIndex);
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

			// Update centers, see if we do better next time
			centers = centers.map(() => [0, 0]);
			for (let i = 0; i < centers.length; i++) {
				const cluster = clusters[i];
				for (const pointIndex of cluster) {
					const point = points[pointIndex];
					centers[i][0] += point[0];
					centers[i][1] += point[1];
				}
				centers[i][0] /= cluster.length;
				centers[i][1] /= cluster.length;
			}

			clusters = resetClusters();
			prevClusters = clustersString;
		}

		// Calculate score, see if it is better than previous
		let score = 0;
		for (let i = 0; i < centers.length; i++) {
			const center = centers[i];
			const cluster = clusters[i];

			for (const pointIndex of cluster) {
				const point = points[pointIndex];
				score += (point[0] - center[0]) ** 2 + (point[1] - center[1]) ** 2;
			}
		}

		if (score < bestScore) {
			bestClusters = clusters;
			bestScore = score;
		}

		// console.log(tryNum, score, clusters);
	}

	if (!bestClusters) {
		throw new Error("undefind bestClusters");
	}
	// console.log(bestScore, bestClusters);

	return bestClusters;
};

const getRandomTeams = (divs: Div[], numTeamsPerDiv: number[]) => {
	let numTeamsTotal = 0;
	for (const num of numTeamsPerDiv) {
		numTeamsTotal += num;
	}

	const abbrevsAll = Object.keys(teamInfos);
	random.shuffle(abbrevsAll);

	const abbrevs = abbrevsAll.slice(0, numTeamsTotal);

	const teamInfoCluster = abbrevs.map(
		abbrev =>
			[teamInfos[abbrev].latitude, teamInfos[abbrev].longitude] as [
				number,
				number,
			],
	);

	const clusters = kmeansFixedSize(teamInfoCluster, numTeamsPerDiv);

	const teamInfosInput = [];

	for (let i = 0; i < divs.length; i++) {
		const div = divs[i];

		for (const tid of clusters[i]) {
			teamInfosInput.push({
				tid,
				cid: div.cid,
				did: div.did,
				abbrev: abbrevs[tid],
			});
		}
	}

	// Clustering to assign divisions

	return getTeamInfos(teamInfosInput);
};

export default getRandomTeams;
