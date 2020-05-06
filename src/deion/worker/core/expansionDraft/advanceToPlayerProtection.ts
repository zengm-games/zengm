import { idb } from "../../db";
import { g, logEvent } from "../../util";
import { league, team } from "..";
import type {
	GameAttributesLeague,
	Team,
	Conditions,
} from "../../../common/types";
import { PHASE } from "../../../common";
import validateExpansionDraftSetup from "./validateExpansionDraftSetup";

const advanceToPlayerProtection = async (conditions: Conditions) => {
	const {
		errors,
		expansionTeams,
		numProtectedPlayers,
	} = await validateExpansionDraftSetup();

	if (errors) {
		return errors;
	}

	// Used for some special behavior for teams created in expansion drafts after the regular season has ended - can check if g.get("season") is less than firstSeasonAfterExpansion
	let firstSeasonAfterExpansion = g.get("season");
	if (g.get("phase") > PHASE.REGULAR_SEASON) {
		firstSeasonAfterExpansion += 1;
	}

	const expansionTids: number[] = [];
	const takeControlTeams: Team[] = [];
	for (const teamInfo of expansionTeams) {
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

	const protectedPids: {
		[key: number]: number[];
	} = {};
	const teams = await idb.cache.teams.getAll();
	for (const t of teams) {
		if (!expansionTids.includes(t.tid)) {
			protectedPids[t.tid] = [];
		}
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
