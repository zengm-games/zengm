import { PHASE } from "../../../common/constants.ts";
import { idb } from "../../db/index.ts";
import local from "../../util/local.ts";
import loadDataBasketball from "./loadData.basketball.ts";
import oldAbbrevTo2020BBGMAbbrev from "./oldAbbrevTo2020BBGMAbbrev.ts";

export const getPlayerActiveSeasons = async () => {
	if (local.realPlayerActiveSeasons) {
		return local.realPlayerActiveSeasons;
	}

	if (!local.realPlayerActiveSeasons) {
		const tidsByAbbrev: Record<string, number> = {};

		// Check all current and future teams for tids
		const teams = await idb.cache.teams.getAll();
		const scheduledEvents = await idb.league
			.transaction("scheduledEvents")
			.store.getAll();
		const allTeams = [
			...teams,
			...scheduledEvents
				.filter((row) => row.type === "expansionDraft")
				.flatMap((row) => row.info.teams),
		];
		for (const t of allTeams) {
			if (t.srID !== undefined) {
				tidsByAbbrev[oldAbbrevTo2020BBGMAbbrev(t.srID)] = t.tid;
			}
		}

		const basketball = await loadDataBasketball();
		local.realPlayerActiveSeasons = {};

		const addRecord = (slug: string, abbrev: string, season: number) => {
			let tidsBySeason = local.realPlayerActiveSeasons![slug];
			if (!tidsBySeason) {
				tidsBySeason = {};
				local.realPlayerActiveSeasons![slug] = tidsBySeason;
			}

			// This will keep the last tid, which is the one we want for forceHistoricalRosters. Could also be undefined if this is a weird league (missing some team) - still will work for shouldRetire then
			tidsBySeason[season] = tidsByAbbrev[abbrev];
		};

		// Handle abbrev_if_new_row, since those are not reflected in the teams array for whatever dumb reason
		for (const row of basketball.ratings) {
			if (row.abbrev_if_new_row) {
				addRecord(row.slug, row.abbrev_if_new_row, row.season);
			}
		}

		for (const row of basketball.teams) {
			if (row.phase === undefined || row.phase <= PHASE.PLAYOFFS) {
				addRecord(row.slug, row.abbrev, row.season);
			}
		}

		// Add retiredUntil - not the same as retiredUntil from basketball.ratings because we want to include anyone who is not on a team, even if not strictly "retired", but it should also pick up any retiredUntil ones
		for (const row of Object.values(local.realPlayerActiveSeasons)) {
			const seasons = Object.keys(row)
				.map((season) => Number.parseInt(season))
				.sort((a, b) => a - b);
			for (let i = 1; i < seasons.length; i++) {
				const season = seasons[i]!;
				const prevSeason = seasons[i - 1]!;
				if (season - prevSeason > 1) {
					if (!row.retiredUntil) {
						row.retiredUntil = {};
					}
					for (
						let tempSeason = prevSeason + 1;
						tempSeason < season;
						tempSeason++
					) {
						row.retiredUntil[tempSeason] = season;
					}
				}
			}
		}
	}

	return local.realPlayerActiveSeasons;
};
