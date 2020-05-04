import { idb } from "../db";
import g from "./g";
import helpers from "./helpers";
import logEvent from "./logEvent";
import { league } from "../core";

const processScheduledEvents = async (season: number, phase: number) => {
	console.log("processScheduledEvents", season, phase);
	const scheduledEvents = await idb.cache.scheduledEvents.getAll();
	const processed: typeof scheduledEvents = [];
	const eventLogTexts: string[] = [];

	for (const scheduledEvent of scheduledEvents) {
		console.log("scheduledEvent", scheduledEvent);
		if (scheduledEvent.season !== season || scheduledEvent.phase !== phase) {
			continue;
		}

		if (scheduledEvent.type === "teamInfo") {
			// This happens in preseason, but after a new TeamSeason row is created, so update Team and TeamSeason

			const info = scheduledEvent.info;

			const teams = await idb.cache.teams.getAll();
			const t = teams.find(t2 => t2.tid === info.tid);
			if (!t) {
				throw new Error(`No team found in triggered event: ${info.tid}`);
			}

			const old = {
				region: t.region,
				name: t.name,
			};
			Object.assign(t, info);

			// Bullshit for pop. Really should be stored somewhere else, not without Team or TeamSeason
			// @ts-ignore
			delete t.pop;

			await idb.cache.teams.put(t);

			const teamSeason = await idb.cache.teamSeasons.indexGet(
				"teamSeasonsByTidSeason",
				[info.tid, season],
			);
			if (!t) {
				throw new Error(
					`No team season found in triggered event: ${info.tid}, ${season}`,
				);
			}
			Object.assign(teamSeason, info);
			await idb.cache.teamSeasons.put(teamSeason);

			if (info.region && info.region !== old.region) {
				eventLogTexts.push(
					`<b>Team relocation:</b> the ${old.region} ${
						old.name
					} are now the <a href="${helpers.leagueUrl([
						"roster",
						t.abbrev,
						season,
					])}">${t.region} ${t.name}</a>.`,
				);
			} else if (info.name && info.name !== old.name) {
				eventLogTexts.push(
					`<b>Team rename:</b> the ${old.region} ${
						old.name
					} are now the <a href="${helpers.leagueUrl([
						"roster",
						t.abbrev,
						season,
					])}">${t.region} ${t.name}</a>.`,
				);
			}

			await league.setGameAttributes({
				teamAbbrevsCache: teams.map(t => t.abbrev),
				teamRegionsCache: teams.map(t => t.region),
				teamNamesCache: teams.map(t => t.name),
				teamImgURLsCache: teams.map(t => t.imgURL),
			});
		} else if (scheduledEvent.type === "gameAttributes") {
			const texts = [];
			if (
				scheduledEvent.info.threePointers !== undefined &&
				scheduledEvent.info.threePointers !== g.get("threePointers")
			) {
				texts.push(
					scheduledEvent.info.threePointers
						? "Added a three point line"
						: "Removed the three point line",
				);
			}

			const prevSalaryCap = g.get("salaryCap");
			if (
				scheduledEvent.info.salaryCap !== undefined &&
				scheduledEvent.info.salaryCap !== prevSalaryCap
			) {
				const increased =
					scheduledEvent.info.salaryCap > prevSalaryCap
						? "increased"
						: "decreased";
				texts.push(
					`Salary cap ${increased} from ${helpers.formatCurrency(
						prevSalaryCap / 1000,
						"M",
					)} to ${helpers.formatCurrency(
						scheduledEvent.info.salaryCap / 1000,
						"M",
					)}`,
				);
			}

			if (texts.length === 1) {
				eventLogTexts.push(`<b>League rule change:</b> ${texts[0]}`);
			} else if (texts.length > 1) {
				eventLogTexts.push(
					`<b>League rule changes:</b><br>- ${texts.join("<br>- ")}`,
				);
			}

			await league.setGameAttributes(scheduledEvent.info);
		} else {
			throw new Error(
				`Unknown triggered event type: ${(scheduledEvent as any).type}`,
			);
		}

		await idb.cache.scheduledEvents.delete(scheduledEvent.id);

		processed.push(scheduledEvent);
	}

	if (eventLogTexts.length > 0) {
		logEvent({
			extraClass: "",
			persistent: true,
			saveToDb: false,
			text: eventLogTexts.join("<br><br>"),
			type: "info",
		});
	}
};

export default processScheduledEvents;
