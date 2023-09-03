import { PHASE } from "../../../common";
import getTeamInfos from "../../../common/getTeamInfos";
import type { Conditions } from "../../../common/types";
import { idb } from "../../db";
import { g, updatePlayMenu, toUI, logEvent, random } from "../../util";
import expansionDraft from "../expansionDraft";
import league from "../league";
import phase from "../phase";
import { getVoteResult } from "./relocateVote";

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

			const divCounts: Record<string, number> = {};
			for (const t of teams) {
				if (divCounts[t.did] === undefined) {
					divCounts[t.did] = 1;
				} else {
					divCounts[t.did] += 1;
				}
			}
			const minDivSize = Math.min(...Object.values(divCounts));
			const candidateDids = Object.keys(divCounts).filter(
				did => divCounts[did] === minDivSize,
			);
			if (candidateDids.length === 0) {
				throw new Error("Should never happen");
			}
			const did = random.choice(candidateDids);

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
				did,
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
	}

	await league.setGameAttributes({
		autoExpand: undefined,
	});

	await updatePlayMenu();

	await toUI("realtimeUpdate", [["team"]]);

	return result;
};

export default expandVote;
