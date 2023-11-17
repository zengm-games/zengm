import { PHASE } from "../../../common";
import getTeamInfos from "../../../common/getTeamInfos";
import type { Conditions } from "../../../common/types";
import { idb } from "../../db";
import { g, updatePlayMenu, toUI, logEvent, random } from "../../util";
import expansionDraft from "../expansionDraft";
import league from "../league";
import phase from "../phase";
import { getVoteResult } from "./relocateVote";
import geographicCoordinates from "../../../common/geographicCoordinates";
import { DEFAULT_COORDS, calcDistance } from "./cluster";
import { minBy } from "../../../common/utils";

const getBestDid = (
	teams: {
		did: number;
		disabled: boolean;
		region: string;
	}[],
	region: string,
	newDids: number[],
): number => {
	// If divs are uneven size, only look at the smallest one(s) as candidate divs for the expansion team.
	// newDids is to handle multiple teams coming in at the same time - don't put them in the same div!
	const divCounts: Record<string, number> = {};
	for (const did of [...teams.map(t => t.did), ...newDids]) {
		if (divCounts[did] === undefined) {
			divCounts[did] = 1;
		} else {
			divCounts[did] += 1;
		}
	}
	const minDivSize = Math.min(...Object.values(divCounts));
	const candidateDids = Object.keys(divCounts)
		.filter(did => divCounts[did] === minDivSize)
		.map(did => parseInt(did));
	if (candidateDids.length === 0) {
		throw new Error("Should never happen");
	}

	if (candidateDids.length === 1) {
		return candidateDids[0];
	}

	// If we know the location of the current divisions (either based on their team regions, or based on averaging together all the teams), then use that information to pick the best did
	const divCenters = new Map<number, [number, number]>();
	const didsMissingCenters = new Set(candidateDids);

	// First try by team regions, since that will be more accurate
	for (const did of didsMissingCenters) {
		const divTeams = teams.filter(t => t.did === did && !t.disabled);
		if (divTeams.length > 0) {
			const center: [number, number] = [0, 0];
			let divTeamsAllHaveCoords = true;
			for (const t of divTeams) {
				const coords = geographicCoordinates[t.region];
				if (!coords) {
					divTeamsAllHaveCoords = false;
					break;
				}
				center[0] += coords.latitude;
				center[1] += coords.longitude;
			}

			if (divTeamsAllHaveCoords) {
				center[0] /= divTeams.length;
				center[1] /= divTeams.length;

				divCenters.set(did, center);
				didsMissingCenters.delete(did);
			}
		}
	}

	// If that didn't find centers for all divs, then try based on division names
	if (didsMissingCenters.size > 0) {
		const divs = g.get("divs");
		for (const did of didsMissingCenters) {
			const div = divs.find(div => div.did === did);
			if (div) {
				const divCoords = DEFAULT_COORDS[div.name];
				if (divCoords) {
					divCenters.set(did, divCoords);
					didsMissingCenters.delete(did);
				}
			}
		}
	}

	if (didsMissingCenters.size === 0) {
		// We know the coords of all the divisions, so use that to pick the closest one
		const newCenter: [number, number] = [
			geographicCoordinates[region].latitude,
			geographicCoordinates[region].longitude,
		];
		return minBy(candidateDids, did =>
			calcDistance(divCenters.get(did)!, newCenter),
		)!;
	}

	// We don't know the coords of all the divisions, so just pick one randomly
	return random.choice(candidateDids);
};

const expandVote = async (
	{
		override,
		userVote,
	}: {
		override: boolean;
		userVote: boolean;
	},
	conditions: Conditions,
) => {
	const autoExpand = g.get("autoExpand");
	if (!autoExpand) {
		throw new Error("Should never happen");
	}

	const result = getVoteResult(userVote, override);

	let eventText;

	if (result.for > result.against) {
		let maxPrevTid = g.get("numTeams") - 1;
		const teamInfos = getTeamInfos(
			autoExpand.abbrevs.map((abbrev, i) => {
				return {
					tid: g.get("numTeams") + 1 + i,
					cid: -1,
					did: -1,
					abbrev,
				};
			}),
		);
		const teams = await idb.cache.teams.getAll();
		const newDids: number[] = [];
		const expansionTeams = teamInfos.map(t => {
			// If a disabled team has this abbrev, reuse their tid
			const disabledTid = teams.findIndex(
				t2 => t2.abbrev === t.abbrev && t2.disabled,
			);
			let tid;
			if (disabledTid >= 0) {
				tid = disabledTid;
			} else {
				tid = maxPrevTid + 1;
				maxPrevTid += 1;
			}

			const did = getBestDid(teams, t.region, newDids);

			newDids.push(did);

			return {
				abbrev: t.abbrev,
				region: t.region,
				name: t.name,
				imgURL: t.imgURL,
				imgURLSmall: t.imgURLSmall,
				colors: t.colors,
				jersey: t.jersey,
				pop: String(t.pop),
				stadiumCapacity: String(g.get("defaultStadiumCapacity")),
				did: String(did),
				takeControl: false,
				tid,
			};
		});

		await league.setGameAttributes({
			expansionDraft: {
				phase: "setup",
				teams: expansionTeams,
			},
		});

		const errors = await expansionDraft.advanceToPlayerProtection(
			false,
			conditions,
		);
		if (errors) {
			throw new Error(errors.join("; "));
		}

		// Need to clear autoExpand before newPhase or autoPlay might call expandVote again
		await league.setGameAttributes({
			autoExpand: undefined,
		});

		await phase.newPhase(PHASE.EXPANSION_DRAFT, conditions);
	} else {
		const numTeams = autoExpand.abbrevs.length;
		eventText = `${
			numTeams > 1 ? `${numTeams} expansion teams` : "An expansion team"
		} wanted to join the league, but they lost the vote ${result.against}-${
			result.for
		}.`;

		logEvent({
			text: eventText,
			type: "teamExpansion",
			tids: [],
			showNotification: false,
			score: 20,
		});

		await league.setGameAttributes({
			autoExpand: undefined,
		});
	}

	await updatePlayMenu();

	await toUI("realtimeUpdate", [["team"]]);

	return result;
};

export default expandVote;
