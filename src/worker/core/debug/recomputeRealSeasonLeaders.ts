// Run this in a new real players leauge with all stats, and it will calculate everything

import { idb } from "../../db";
import { g, local } from "../../util";
import { LATEST_SEASON, MIN_SEASON } from "../realRosters/getLeague";
import type { SeasonLeaders } from "../../../common/types";
import { league, season } from "..";
import { PHASE } from "../../../common";
import loadData from "../realRosters/loadData.basketball";

const recomputeRealSeasonLeaders = async () => {
	// Clear any existing seasonLeaders, so it gets recomputed
	await idb.league.clear("seasonLeaders");
	local.seasonLeaders = undefined;
	await idb.cache.seasonLeaders.clear();

	const currentSeason = g.get("season");
	const currentPhase = g.get("phase");
	const output: Record<number, SeasonLeaders> = {};

	const realData = await loadData();

	for (let season2 = MIN_SEASON; season2 <= LATEST_SEASON; season2++) {
		if (season2 === currentSeason && currentPhase <= PHASE.PLAYOFFS) {
			console.log(
				`Skipping current season (${season2}) because playoffs are not done yet`,
			);
			continue;
		}

		if (season2 > currentSeason) {
			throw new Error("Should never happen");
		}

		// Set season and phase, so that GamesPlayedCache uses numGames
		await league.setGameAttributes({
			season: season2,
			phase: PHASE.DRAFT_LOTTERY,
		});

		// Apply game sim settings
		// All the ones we're interested in (not confs/divs/whatever) are in phase 0 currently
		const scheduledEvent = realData.scheduledEventsGameAttributes.find(
			row => row.season === season2 && row.phase === 0,
		);
		if (scheduledEvent) {
			const presets = scheduledEvent.info as any;
			await league.setGameAttributes(presets);
			console.log(`Apply settings`, presets);
		}

		// Compute seasonLeaders
		const seasonLeaders = await season.getSeasonLeaders(season2);
		if (seasonLeaders) {
			// Season is redundant, since it's the key of the main output
			delete (seasonLeaders as any).season;

			// ratingsFuzz is useless because we don't know what fuzz is in this league
			delete (seasonLeaders as any).ratingsFuzz;

			output[season2] = seasonLeaders;
		} else {
			console.log(`No seasonLeaders found for ${season2}`);
		}
	}

	// Reset
	await league.setGameAttributes({
		season: currentSeason,
		phase: currentPhase,
	});

	console.log(output);
	console.log(JSON.stringify(output));
};

export default recomputeRealSeasonLeaders;
