import { idb } from "../../db";
import { g, logEvent } from "../../util";
import { league, team } from "..";
import type {
	GameAttributesLeague,
	Team,
	Conditions,
	ExpansionDraftSetupTeam,
} from "../../../common/types";
import { PHASE } from "../../../common";

const advanceToPlayerProtection = async (
	numProtectedPlayersString: string,
	expansionTeams: ExpansionDraftSetupTeam[],
	conditions: Conditions,
) => {
	const errors = [];
	const teams = await idb.cache.teams.getAll();
	const divs = await g.get("divs", Infinity);

	// Do some error checking
	const parsedExpansionTeams = expansionTeams.map(t => {
		if (t.imgURL === "") {
			t.imgURL = undefined;
		}

		const pop = parseFloat(t.pop);
		if (Number.isNaN(pop)) {
			errors.push(`Invalid population for ${t.abbrev}`);
		}

		const stadiumCapacity = parseInt(t.stadiumCapacity);
		if (Number.isNaN(stadiumCapacity)) {
			errors.push(`Invalid stadium capacity for ${t.abbrev}`);
		}

		const did = parseInt(t.did);
		let foundDiv = false;
		for (const div of divs) {
			if (did === div.did) {
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

		return {
			...t,
			did,
			pop,
			stadiumCapacity,
		};
	});

	if (parsedExpansionTeams.length === 0) {
		errors.push("No expansion teams");
	}

	const numProtectedPlayers = parseInt(numProtectedPlayersString);
	if (Number.isNaN(numProtectedPlayers)) {
		errors.push("Invalid number of protected players");
	}

	if (errors.length > 0) {
		return Array.from(new Set(errors));
	}

	// Used for some special behavior for teams created in expansion drafts after the regular season has ended - can check if g.get("season") is less than firstSeasonAfterExpansion
	let firstSeasonAfterExpansion = g.get("season");
	if (g.get("phase") > PHASE.REGULAR_SEASON) {
		firstSeasonAfterExpansion += 1;
	}

	const expansionTids: number[] = [];
	const takeControlTeams: Team[] = [];
	for (const teamInfo of parsedExpansionTeams) {
		const t = await team.addNewTeamToExistingLeague({
			...teamInfo,
			firstSeasonAfterExpansion,
		});
		expansionTids.push(t.tid);

		if (teamInfo.takeControl) {
			takeControlTeams.push(t);
		}
	}

	const gameAttributes: Partial<GameAttributesLeague> = {};

	if (takeControlTeams.length > 0) {
		const userTids = g.get("userTids");
		if (userTids.length > 1) {
			gameAttributes.userTids = [
				...userTids,
				...takeControlTeams.map(t => t.tid),
			];
		} else {
			const t = takeControlTeams[takeControlTeams.length - 1];
			gameAttributes.userTid = t.tid;
			gameAttributes.userTids = [gameAttributes.userTid];
			logEvent(
				{
					saveToDb: false,
					text: `You are now the GM of a new expansion team, the ${t.region} ${t.name}!`,
					type: "info",
				},
				conditions,
			);
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
