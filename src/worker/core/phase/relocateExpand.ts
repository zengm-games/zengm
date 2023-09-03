import getUnusedAbbrevs from "../../../common/getUnusedAbbrevs";
import geographicCoordinates from "../../../common/geographicCoordinates";
import getTeamInfos from "../../../common/getTeamInfos";
import { kmeansFixedSize, sortByDivs } from "../team/cluster";
import { idb } from "../../db";
import { g, random } from "../../util";
import league from "../league";
import type { GameAttributesLeague } from "../../../common/types";

const upcomingScheduledEventBlocksRelocateExpand = async () => {
	const scheduledEvents = await idb.getCopies.scheduledEvents(
		undefined,
		"noCopyCache",
	);
	return scheduledEvents.some(event => {
		return event.type === "teamInfo" || event.type === "expansionDraft";
	});
};

const getTeams = async (disabledTeamsCountAsUnused: boolean) => {
	const currentTeams = await idb.cache.teams.getAll();
	const activeTeams = currentTeams.filter(t => !t.disabled);

	const candidateAbbrevs = getUnusedAbbrevs(
		currentTeams,
		disabledTeamsCountAsUnused,
	);
	const allCandidateTeams = getTeamInfos(
		candidateAbbrevs.map(abbrev => {
			return {
				tid: -1,
				cid: -1,
				did: -1,
				abbrev,
			};
		}),
	);

	return {
		activeTeams,
		allCandidateTeams,
	};
};

const getNorthAmericaOnly = ({
	activeTeams,
	allCandidateTeams,
	geo,
	numTeams,
}: {
	activeTeams: {
		region: string;
	}[];
	allCandidateTeams: {
		region: string;
	}[];
	geo: GameAttributesLeague["autoRelocateGeo"];
	numTeams: number;
}) => {
	if (geo === "naOnly") {
		return true;
	}

	if (geo === "any") {
		return false;
	}

	// For naFirst - northAmericaOnly if all current teams are inside NA and there are enough candidate teams available inside NA

	if (
		activeTeams.some(t => geographicCoordinates[t.region]?.outsideNorthAmerica)
	) {
		return false;
	}

	let numNorthAmericanTeamsAvailable = 0;
	for (const t of allCandidateTeams) {
		const coordinates = geographicCoordinates[t.region];
		if (!coordinates) {
			throw new Error("Should never happen");
		}
		if (!coordinates.outsideNorthAmerica) {
			numNorthAmericanTeamsAvailable += 1;
			if (numNorthAmericanTeamsAvailable >= numTeams) {
				return true;
			}
		}
	}

	return false;
};

const getCandidateTeams = <T extends { region: string }>(
	allCandidateTeams: T[],
	northAmericaOnly: boolean,
) => {
	return allCandidateTeams.filter(t => {
		if (!northAmericaOnly) {
			return true;
		}

		return !geographicCoordinates[t.region].outsideNorthAmerica;
	});
};

export const doRelocate = async () => {
	const autoRelocateProb = g.get("autoRelocateProb");

	if (Math.random() > autoRelocateProb) {
		return;
	}

	if (await upcomingScheduledEventBlocksRelocateExpand()) {
		return;
	}

	const { activeTeams, allCandidateTeams } = await getTeams(false);

	const autoRelocateGeo = g.get("autoRelocateGeo");

	const northAmericaOnly = getNorthAmericaOnly({
		activeTeams,
		allCandidateTeams,
		geo: autoRelocateGeo,
		numTeams: 1,
	});

	const candidateTeams = getCandidateTeams(allCandidateTeams, northAmericaOnly);

	if (candidateTeams.length === 0) {
		return;
	}

	const currentTeam = random.choice(activeTeams, t => 1 / (t.pop ?? 1));

	const newTeam = random.choice(
		candidateTeams.filter(t => t.region !== currentTeam.region),
		t => t.pop,
	);

	// Could happen if the region check results in no candidate teams working
	if (!newTeam) {
		return;
	}

	const getRealignedDivs = () => {
		// We can only automatically realign divisions if we know where every region is
		const canRealign = activeTeams.every(
			t => !!geographicCoordinates[t.region] || t.tid === currentTeam.tid,
		);

		if (!canRealign) {
			return;
		}

		// List of team IDs in each division, indexed by did
		let realigned: number[][] = [];

		const divs = g.get("divs");
		const numTeamsPerDiv = divs.map(
			div => activeTeams.filter(t => t.did === div.did).length,
		);

		const coordinates = activeTeams.map(temp => {
			const t = temp.tid === newTeam.tid ? newTeam : temp;
			return [
				geographicCoordinates[t.region].latitude,
				geographicCoordinates[t.region].longitude,
			] as [number, number];
		});

		const { clusters, geoSorted } = sortByDivs(
			kmeansFixedSize(coordinates, numTeamsPerDiv),
			divs,
			numTeamsPerDiv,
		);

		for (let i = 0; i < divs.length; i++) {
			const pointIndexes = clusters[i].pointIndexes;
			if (pointIndexes) {
				// Map to tids
				realigned[i] = pointIndexes.map(i => activeTeams[i].tid);
			}
		}

		if (!geoSorted) {
			// If, for whatever reason, we can't sort clusters geographically (like knowing the location of Atlantic vs Pacific), then try to keep as many teams in the same division as they were previously. Ideally we would test all permutations, but for many divisions that would be slow, so do it a shittier way.
			const original = divs.map(() => [] as number[]);
			for (const t of activeTeams) {
				const divIndex = divs.findIndex(div => t.did === div.did);
				original[divIndex].push(t.tid);
			}

			const divIndexes = divs.map((div, i) => i);

			const getBestDid = (tids: number[], didsUsed: Set<number>) => {
				let bestScore2 = -Infinity;
				let bestDid: number | undefined;
				for (let divIndex = 0; divIndex < original.length; divIndex++) {
					const did = divs[divIndex].did;

					if (didsUsed.has(did)) {
						continue;
					}

					let score = 0;
					for (const tid of tids) {
						if (original[divIndex].includes(tid)) {
							score += 1;
						}
					}

					if (score > bestScore2) {
						bestScore2 = score;
						bestDid = did;
					}
				}

				if (bestDid === undefined) {
					throw new Error("Should never happen");
				}

				return {
					did: bestDid,
					divIndex: divs.findIndex(div => div.did === bestDid),
					score: bestScore2,
				};
			};

			let bestScore = -Infinity;
			let bestRealigned;

			// Try a few times with random ordered dids, that's probably good enough
			for (let iteration = 0; iteration < 20; iteration++) {
				random.shuffle(divIndexes);

				let score = 0;
				const attempt = divs.map(() => [] as number[]);
				const didsUsed = new Set<number>();

				for (const divIndex of divIndexes) {
					const tids = realigned[divIndex];
					const result = getBestDid(tids, didsUsed);
					didsUsed.add(result.did);
					attempt[result.divIndex] = tids;
					score += result.score;
				}

				if (score > bestScore) {
					bestScore = score;
					bestRealigned = attempt;
				}
			}

			if (bestRealigned === undefined) {
				throw new Error("Should never happen");
			}

			realigned = bestRealigned;
		}

		return realigned;
	};

	const realigned = getRealignedDivs();

	// console.log(`${currentTeam.region} ${currentTeam.name} -> ${newTeam.region} ${newTeam.name}`);
	await league.setGameAttributes({
		autoRelocate: {
			phase: "vote",
			tid: currentTeam.tid,
			abbrev: newTeam.abbrev,
			realigned,
		},
	});

	return true;
};

export const doExpand = async () => {
	const autoExpandProb = g.get("autoExpandProb");

	if (Math.random() > autoExpandProb) {
		return;
	}

	if (await upcomingScheduledEventBlocksRelocateExpand()) {
		return;
	}

	const { activeTeams, allCandidateTeams } = await getTeams(true);

	const numTeamsUntilLimit =
		g.get("autoExpandMaxNumTeams") - activeTeams.length;
	if (numTeamsUntilLimit <= 0) {
		return;
	}

	const autoExpandGeo = g.get("autoExpandGeo");

	// autoExpandNumTeams can never put us over numTeamsUntilLimit
	let autoExpandNumTeams = Math.min(
		numTeamsUntilLimit,
		g.get("autoExpandNumTeams"),
	);

	let candidateTeams: typeof allCandidateTeams = [];

	// Even with above check for numTeamsUntilLimit, we still could have a situation where expansion is constrained by the number of candidate teams, which is influenced by northAmericaOnly
	while (autoExpandNumTeams > 0) {
		const northAmericaOnly = getNorthAmericaOnly({
			activeTeams,
			allCandidateTeams,
			geo: autoExpandGeo,
			numTeams: autoExpandNumTeams,
		});

		candidateTeams = getCandidateTeams(allCandidateTeams, northAmericaOnly);

		if (candidateTeams.length < autoExpandNumTeams) {
			autoExpandNumTeams -= 1;
		} else {
			break;
		}
	}

	if (candidateTeams.length === 0 || autoExpandNumTeams === 0) {
		return;
	}

	const newTeams = [];
	while (newTeams.length < autoExpandNumTeams) {
		const newTeam = random.choice(candidateTeams, t => t.pop);
		candidateTeams = candidateTeams.filter(t => t !== newTeam);
		newTeams.push(newTeam);
	}

	// I think this is impossible, but whatever
	if (newTeams.length < autoExpandNumTeams) {
		return;
	}

	await league.setGameAttributes({
		autoExpand: {
			phase: "vote",
			abbrevs: newTeams.map(t => t.abbrev),
		},
	});

	return true;
};
