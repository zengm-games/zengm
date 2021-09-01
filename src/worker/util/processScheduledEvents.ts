import { idb } from "../db";
import g from "./g";
import helpers from "./helpers";
import logEvent from "./logEvent";
import { league, expansionDraft, phase, team } from "../core";
import type {
	ScheduledEvent,
	Conditions,
	RealTeamInfo,
} from "../../common/types";
import { PHASE, applyRealTeamInfo } from "../../common";

const processTeamInfo = async (
	info: Extract<ScheduledEvent, { type: "teamInfo" }>["info"],
	season: number,
	realTeamInfo: RealTeamInfo | undefined,
) => {
	// This happens in preseason, but after a new TeamSeason row is created, so update Team and TeamSeason

	const eventLogTexts: string[] = [];

	const teams = await idb.cache.teams.getAll();
	const t = teams.find(t2 => t2.tid === info.tid);
	if (!t) {
		throw new Error(`No team found in scheduled event: ${info.tid}`);
	}

	if (realTeamInfo) {
		applyRealTeamInfo(info, realTeamInfo, season);
	}

	const old = {
		region: t.region,
		name: t.name,
		imgURL: t.imgURL,
		imgURLSmall: t.imgURLSmall,
	};
	Object.assign(t, info);

	// If imgURL is defined in scheduled event but imgURLSmall is not, delete old imgURLSmall. Otherwise LAC wind up having a the Wings logo in imgURLSmall!
	const deleteImgURLSmall = info.imgURL && !info.imgURLSmall && t.imgURLSmall;

	if (deleteImgURLSmall) {
		delete t.imgURLSmall;
	}

	// Make sure this didn't fuck up the cid somehow, such as if the user moved a team to a new conference, but then the scheduled event only has the div because it assumes conference didn't change. THIS WOULD BE LESS LIKELY TO HAPPEN IF NEW DIVS/CONFS WERE NOT CREATED BEFORE TEAM DID/CID VALUES WERE UPDATED! https://mail.google.com/mail/u/0/#inbox/FMfcgxwKkRDqKPHCkJdLXcZvNCxhbGzn
	const divs = g.get("divs");
	const div = divs.find(div => div.did === t.did) ?? divs[0];
	if (div) {
		t.did = div.did;
		t.cid = div.cid;
	} else {
		throw new Error("No divisions");
	}

	await idb.cache.teams.put(t);

	const teamSeason = await idb.cache.teamSeasons.indexGet(
		"teamSeasonsByTidSeason",
		[info.tid, season],
	);
	if (!teamSeason) {
		throw new Error(
			`No team season found in scheduled event: ${info.tid}, ${season}`,
		);
	}
	Object.assign(teamSeason, info);
	if (deleteImgURLSmall) {
		delete teamSeason.imgURLSmall;
	}
	teamSeason.did = div.did;
	teamSeason.cid = div.cid;
	await idb.cache.teamSeasons.put(teamSeason);

	let updatedRegionName;
	if (info.region && info.region !== old.region) {
		const text = `the ${old.region} ${
			old.name
		} are now the <a href="${helpers.leagueUrl([
			"roster",
			t.abbrev,
			season,
		])}">${t.region} ${t.name}</a>.`;

		eventLogTexts.push(`<b>Team relocation:</b> ${text}`);
		updatedRegionName = true;

		logEvent({
			text: helpers.upperCaseFirstLetter(text),
			type: "teamRelocation",
			tids: [t.tid],
			showNotification: false,
			score: 20,
		});
	} else if (info.name && info.name !== old.name) {
		const text = `the ${old.region} ${
			old.name
		} are now the <a href="${helpers.leagueUrl([
			"roster",
			t.abbrev,
			season,
		])}">${t.region} ${t.name}</a>.`;

		eventLogTexts.push(`<b>Team rename:</b> ${text}`);
		updatedRegionName = true;

		logEvent({
			text: helpers.upperCaseFirstLetter(text),
			type: "teamRename",
			tids: [t.tid],
			showNotification: false,
			score: 20,
		});
	} else if (info.imgURL && info.imgURL !== old.imgURL) {
		logEvent({
			text: `The <a href="${helpers.leagueUrl(["roster", t.abbrev, season])}">${
				t.region
			} ${t.name}</a> got a new logo:<br><img src="${
				t.imgURL
			}" class="mt-2" style="max-width:120px;max-height:120px;">`,
			type: "teamLogo",
			tids: [t.tid],
			showNotification: false,
			score: 20,
		});
	}

	await league.setGameAttributes({
		teamInfoCache: teams.map(t => ({
			abbrev: t.abbrev,
			disabled: t.disabled,
			imgURL: t.imgURL,
			imgURLSmall: t.imgURLSmall,
			name: t.name,
			region: t.region,
		})),
	});

	if (info.tid === g.get("userTid") && updatedRegionName) {
		await league.updateMeta();
	}

	return eventLogTexts;
};

const processGameAttributes = async (
	info: Extract<ScheduledEvent, { type: "gameAttributes" }>["info"],
) => {
	const eventLogTexts: string[] = [];

	const texts: string[] = [];
	if (
		info.threePointers !== undefined &&
		info.threePointers !== g.get("threePointers")
	) {
		texts.push(
			info.threePointers
				? "Added a three point line."
				: "Removed the three point line.",
		);
	}

	const prevSalaryCap = g.get("salaryCap");
	if (info.salaryCap !== undefined && info.salaryCap !== prevSalaryCap) {
		const increased =
			info.salaryCap > prevSalaryCap ? "increased" : "decreased";
		texts.push(
			`Salary cap ${increased} from ${helpers.formatCurrency(
				prevSalaryCap / 1000,
				"M",
			)} to ${helpers.formatCurrency(info.salaryCap / 1000, "M")}.`,
		);
	}

	const prevNumPlayoffByes = g.get("numPlayoffByes", "current");
	if (
		info.numPlayoffByes !== undefined &&
		info.numPlayoffByes !== prevNumPlayoffByes
	) {
		const increased =
			info.numPlayoffByes > prevNumPlayoffByes ? "increased" : "decreased";
		texts.push(
			`Playoff byes ${increased} from ${prevNumPlayoffByes} to ${info.numPlayoffByes}.`,
		);
	}

	const prevNumGamesPlayoffSeries = g.get("numGamesPlayoffSeries", "current");
	if (
		info.numGamesPlayoffSeries !== undefined &&
		JSON.stringify(info.numGamesPlayoffSeries) !==
			JSON.stringify(prevNumGamesPlayoffSeries)
	) {
		if (
			prevNumGamesPlayoffSeries.length !== info.numGamesPlayoffSeries.length
		) {
			const increased =
				info.numGamesPlayoffSeries.length > prevNumGamesPlayoffSeries.length
					? "increased"
					: "decreased";
			texts.push(
				`Playoffs ${increased} from ${prevNumGamesPlayoffSeries.length} to ${info.numGamesPlayoffSeries.length} rounds`,
			);
		} else {
			texts.push("New number of playoff games per round.");
		}
	}

	const prevNumGames = g.get("numGames");
	if (info.numGames !== undefined && info.numGames !== prevNumGames) {
		const increased = info.numGames > prevNumGames ? "lengthened" : "shortened";
		texts.push(
			`Regular season ${increased} from ${prevNumGames} to ${info.numGames} games.`,
		);
	}

	const prevPlayIn = g.get("playIn");
	if (info.playIn !== undefined && info.playIn !== prevPlayIn) {
		if (info.playIn) {
			texts.push(`Play-in tournament added before the playoffs.`);
		} else {
			texts.push(`Play-in tournament removed.`);
		}
	}

	const prevDraftType = g.get("draftType");
	if (info.draftType !== undefined && info.draftType !== prevDraftType) {
		texts.push(
			`New <a href="${helpers.leagueUrl([
				"draft_lottery",
			])}">draft lottery</a> format.`,
		);
	}

	const prevFoulsUntilBonus = g.get("foulsUntilBonus");
	if (
		info.foulsUntilBonus !== undefined &&
		JSON.stringify(info.foulsUntilBonus) !== JSON.stringify(prevFoulsUntilBonus)
	) {
		let text = "New number of team fouls until the bonus: ";

		if (info.foulsUntilBonus[0] === info.foulsUntilBonus[1]) {
			text += `${info.foulsUntilBonus[0]} in any regulation or overtime period`;
		} else {
			text += `${info.foulsUntilBonus[0]} in regulation periods, ${info.foulsUntilBonus[1]} in overtime periods`;
		}

		if (
			info.foulsUntilBonus[2] < info.foulsUntilBonus[0] ||
			info.foulsUntilBonus[2] < info.foulsUntilBonus[1]
		) {
			// If this condition is not true, then last 2 minutes rule basically does not exist
			text += `, ${info.foulsUntilBonus[2]} in the last 2 minutes of any period`;
		}

		texts.push(text);
	}

	for (const text of texts) {
		logEvent({
			text,
			type: "gameAttribute",
			tids: [],
			showNotification: false,
			score: 20,
		});
	}

	if (texts.length === 1) {
		eventLogTexts.push(`<b>League rule change:</b> ${texts[0]}`);
	} else if (texts.length > 1) {
		eventLogTexts.push(
			`<b>League rule changes:</b><br>- ${texts.join("<br>- ")}`,
		);
	}

	await league.setGameAttributes(info);

	return eventLogTexts;
};

const processExpansionDraft = async (
	info: Extract<ScheduledEvent, { type: "expansionDraft" }>["info"],
	season: number,
	realTeamInfo: RealTeamInfo | undefined,
	conditions: Conditions,
) => {
	const numProtectedPlayers =
		info.numProtectedPlayers !== undefined
			? info.numProtectedPlayers
			: g.get("minRosterSize") - info.teams.length;

	const teams = await idb.cache.teams.getAll();
	const expansionTeams = info.teams.filter(t => {
		if (t.tid === undefined) {
			return true;
		}

		// eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
		if (!teams[t.tid]) {
			return true;
		}

		// If team is already enabled, no need for expansion draft
		return teams[t.tid].disabled;
	});

	if (realTeamInfo) {
		for (const t of expansionTeams) {
			applyRealTeamInfo(t as any, realTeamInfo, season);
		}
	}

	if (expansionTeams.length === 0) {
		return [];
	}

	await league.setGameAttributes({
		expansionDraft: {
			phase: "setup",
			teams: expansionTeams,
			numProtectedPlayers: String(numProtectedPlayers),
		},
	});

	const errors = await expansionDraft.advanceToPlayerProtection(
		true,
		conditions,
	);
	if (errors) {
		throw new Error(errors.join("; "));
	}

	await phase.newPhase(PHASE.EXPANSION_DRAFT, conditions);

	return [
		`<b>Expansion draft!</b> ${expansionTeams.length} new team${
			expansionTeams.length > 1 ? "s are" : " is"
		} joining the league.`,
	];
};

const processContraction = async (
	info: Extract<ScheduledEvent, { type: "contraction" }>["info"],
) => {
	const t = await idb.cache.teams.get(info.tid);
	if (!t) {
		throw new Error(`No team found in scheduled event: ${info.tid}`);
	}

	await team.disable(t.tid);

	const text = `<b>Contraction!</b> The ${t.region} ${t.name} franchise is disbanding. All their players will become free agents.`;

	return [text];
};

const processScheduledEvents = async (
	season: number,
	phase: number,
	conditions: Conditions,
) => {
	if (g.get("repeatSeason")) {
		return;
	}

	const scheduledEvents = await idb.cache.scheduledEvents.getAll();
	const processed: typeof scheduledEvents = [];
	const eventLogTexts: string[] = [];

	const realTeamInfo = (await idb.meta.get("attributes", "realTeamInfo")) as
		| RealTeamInfo
		| undefined;

	for (const scheduledEvent of scheduledEvents) {
		if (scheduledEvent.season !== season || scheduledEvent.phase !== phase) {
			if (
				scheduledEvent.season < season ||
				(scheduledEvent.season === season && scheduledEvent.phase < phase)
			) {
				await idb.cache.scheduledEvents.delete(scheduledEvent.id);
			}
			continue;
		}

		if (scheduledEvent.type === "teamInfo") {
			eventLogTexts.push(
				...(await processTeamInfo(scheduledEvent.info, season, realTeamInfo)),
			);
		} else if (scheduledEvent.type === "gameAttributes") {
			eventLogTexts.push(...(await processGameAttributes(scheduledEvent.info)));
		} else if (scheduledEvent.type === "expansionDraft") {
			eventLogTexts.push(
				...(await processExpansionDraft(
					scheduledEvent.info,
					season,
					realTeamInfo,
					conditions,
				)),
			);
		} else if (scheduledEvent.type === "contraction") {
			eventLogTexts.push(...(await processContraction(scheduledEvent.info)));
		} else {
			throw new Error(
				`Unknown scheduled event type: ${(scheduledEvent as any).type}`,
			);
		}

		await idb.cache.scheduledEvents.delete(scheduledEvent.id);

		processed.push(scheduledEvent);
	}

	if (eventLogTexts.length > 0) {
		logEvent({
			saveToDb: false,
			text: eventLogTexts.join("<br><br>"),
			type: "info",
		});
	}
};

export default processScheduledEvents;
