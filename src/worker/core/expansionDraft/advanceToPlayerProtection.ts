import { idb } from "../../db";
import { g, logEvent, helpers } from "../../util";
import { league, team } from "..";
import type {
	GameAttributesLeague,
	Team,
	Conditions,
} from "../../../common/types";
import { PHASE } from "../../../common";
import validateExpansionDraftSetup from "./validateExpansionDraftSetup";

const advanceToPlayerProtection = async (
	fromScheduledEvent: boolean,
	conditions: Conditions,
) => {
	const { errors, expansionTeams, numPerTeam, numProtectedPlayers } =
		await validateExpansionDraftSetup();

	if (errors) {
		return errors;
	}

	// Used for some special behavior for teams created in expansion drafts after the regular season has ended - can check if g.get("season") is less than firstSeasonAfterExpansion
	let firstSeasonAfterExpansion = g.get("season");
	if (g.get("phase") >= PHASE.PLAYOFFS) {
		firstSeasonAfterExpansion += 1;
	}

	const expansionTids: number[] = [];
	const takeControlTeams: Team[] = [];
	for (const teamInfo of expansionTeams) {
		const t = await team.addNewTeamToExistingLeague(
			{
				...teamInfo,
				firstSeasonAfterExpansion,
			},
			{
				expansionDraft: true,
				fromScheduledEvent,
			},
		);
		expansionTids.push(t.tid);

		if (teamInfo.takeControl) {
			takeControlTeams.push(t);
		}

		const text = `The <a href="${helpers.leagueUrl([
			"team_history",
			`${t.abbrev}_${t.tid}`,
		])}">${t.region} ${t.name}</a> are joining the league.`;
		logEvent({
			text,
			type: "teamExpansion",
			tids: [t.tid],
			showNotification: false,
			score: 20,
		});
	}

	const gameAttributes: Partial<GameAttributesLeague> = {};

	if (takeControlTeams.length > 0) {
		const userTids = g.get("userTids");
		let tid: number;
		let tids: number[] | undefined;
		if (userTids.length > 1) {
			tid = g.get("userTid");
			tids = [...userTids, ...takeControlTeams.map(t => t.tid)];
		} else {
			const t = takeControlTeams.at(-1);
			tid = t.tid;
			logEvent(
				{
					saveToDb: false,
					text: `You are now the GM of a new expansion team, the ${t.region} ${t.name}!`,
					type: "info",
				},
				conditions,
			);
		}
		await team.switchTo(tid, tids);
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
		numPerTeam,
		expansionTids,
		protectedPids,
		allowSwitchTeam: fromScheduledEvent,
	};

	await league.setGameAttributes(gameAttributes);
};

export default advanceToPlayerProtection;
