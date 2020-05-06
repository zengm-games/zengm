import { idb } from "../../db";
import { g } from "../../util";
import { league, team } from "..";
import type { GameAttributesLeague } from "../../../common/types";

const advanceToPlayerProtection = async (
	numProtectedPlayers: number,
	expansionTeams: {
		abbrev: string;
		region: string;
		name: string;
		imgURL: string | undefined;
		colors: [string, string, string];
		pop: number;
		stadiumCapacity: number;
		did: number;
		takeControl: boolean;
	}[],
) => {
	const errors = [];
	const teams = await idb.cache.teams.getAll();
	const divs = await g.get("divs", Infinity);

	// Do some error checking
	for (const t of expansionTeams) {
		console.log(t);
		if (t.imgURL === "") {
			t.imgURL = undefined;
		}

		t.pop = parseFloat((t.pop as never) as string);
		if (Number.isNaN(t.pop)) {
			errors.push(`Invalid population for ${t.abbrev}`);
		}

		t.stadiumCapacity = parseInt((t.stadiumCapacity as never) as string);
		if (Number.isNaN(t.stadiumCapacity)) {
			errors.push(`Invalid stadium capacity for ${t.abbrev}`);
		}

		t.did = parseInt((t.did as never) as string);
		let foundDiv = false;
		for (const div of divs) {
			if (t.did === div.did) {
				foundDiv = true;
				break;
			}
		}
		if (!foundDiv) {
			errors.push(`Invalid division for ${t.abbrev}`);
		}

		for (const t2 of teams) {
			if (t2.abbrev === t.abbrev) {
				errors.push(`Abbrev ${t.abbrev} is already used by an existing team`);
			}
		}

		for (const t2 of expansionTeams) {
			if (t !== t2 && t2.abbrev === t.abbrev) {
				errors.push(`Abbrev ${t.abbrev} is used by multiple expansion teams`);
			}
		}
	}

	if (expansionTeams.length === 0) {
		errors.push("No expansion teams");
	}

	numProtectedPlayers = parseInt((numProtectedPlayers as never) as string);
	if (Number.isNaN(numProtectedPlayers)) {
		errors.push("Invalid number of protected players");
	}

	if (errors.length > 0) {
		return Array.from(new Set(errors));
	}

	const expansionTids: number[] = [];
	const takeControlTids: number[] = [];
	for (const teamInfo of expansionTeams) {
		const t = await team.addNewTeamToExistingLeague(teamInfo);
		expansionTids.push(t.tid);

		if (teamInfo.takeControl) {
			takeControlTids.push(t.tid);
		}
	}

	const gameAttributes: Partial<GameAttributesLeague> = {};

	if (takeControlTids.length > 0) {
		const userTids = g.get("userTids");
		if (userTids.length > 1) {
			gameAttributes.userTids = [...userTids, ...takeControlTids];
		} else {
			gameAttributes.userTid = takeControlTids[takeControlTids.length - 1];
			gameAttributes.userTids = [gameAttributes.userTid];
		}
	}

	// teams is the previously existing teams, so they are the ones that need protection
	const protectedPids: {
		[key: number]: number[];
	} = {};
	for (const t of teams) {
		protectedPids[t.tid] = [];
	}

	gameAttributes.expansionDraft = {
		phase: "protection",
		numProtectedPlayers,
		expansionTids,
		protectedPids,
	};

	await league.setGameAttributes(gameAttributes);
};

export default advanceToPlayerProtection;
