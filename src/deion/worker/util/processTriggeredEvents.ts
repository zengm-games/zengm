import { idb } from "../db";
import g from "./g";
import helpers from "./helpers";
import logEvent from "./logEvent";
import { league } from "../core";

const processTriggeredEvents = async (season: number, phase: number) => {
	console.log("processTriggeredEvents", processTriggeredEvents);
	const triggeredEvents = g.get("triggeredEvents");
	const processed: typeof triggeredEvents = [];
	const eventLogTexts: string[] = [];

	for (const triggeredEvent of triggeredEvents) {
		console.log("triggeredEvent", triggeredEvent);
		if (
			triggeredEvent.season > season ||
			(triggeredEvent.season === season && triggeredEvent.phase > phase)
		) {
			continue;
		}

		const info = triggeredEvent.info;

		if (triggeredEvent.type === "teamInfo") {
			// This happens in preseason, but after a new TeamSeason row is created, so update Team and TeamSeason

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
					`<b>Team relocation</b>: the ${old.region} ${
						old.name
					} are now the <a href="${helpers.leagueUrl([
						"roster",
						t.abbrev,
						season,
					])}">${t.region} ${t.name}</a>.`,
				);
			} else if (info.name && info.name !== old.name) {
				eventLogTexts.push(
					`<b>Team rename</b>: the ${old.region} ${
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
		} else {
			throw new Error(`Unknown triggered event type: ${triggeredEvent.type}`);
		}

		processed.push(triggeredEvent);
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

	if (processed.length > 0) {
		const remaining = triggeredEvents.filter(x => !processed.includes(x));
		await league.setGameAttributes({
			triggeredEvents: remaining,
		});
	}
};

export default processTriggeredEvents;
