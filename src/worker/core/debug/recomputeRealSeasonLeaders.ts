// Run this in a new real players leauge with all stats, and it will calculate everything

import { idb } from "src/worker/db";
import { g, local } from "src/worker/util";
import { LATEST_SEASON, MIN_SEASON } from "../realRosters/getLeague";
import type { SeasonLeaders } from "src/common/types";
import gameSimPresets from "src/ui/views/Settings/gameSimPresets";
import { league, season } from "..";
import { PHASE } from "src/common";

const recomputeRealSeasonLeaders = async () => {
	// Clear any existing seasonLeaders, so it gets recomputed
	await idb.league.clear("seasonLeaders");
	local.seasonLeaders = undefined;
	await idb.cache.seasonLeaders.clear();

	const currentSeason = g.get("season");
	const currentPhase = g.get("phase");
	const output: Record<number, SeasonLeaders> = {};

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

		// Apply game sim settings
		const presets = (gameSimPresets as any)[season2];
		if (presets) {
			await league.setGameAttributes(presets);
		} else {
			console.log(`No game sim presets found for ${season2}`);
		}

		// Compute seasonLeaders
		const seasonLeaders = await season.getSeasonLeaders(season2);
		if (seasonLeaders) {
			// Season is redundant, since it's the key of the main output
			delete (seasonLeaders as any).season;
			output[season2] = seasonLeaders;
		} else {
			console.log(`No seasonLeaders found for ${season2}`);
		}
	}

	console.log(output);
	console.log(JSON.stringify(output));
};

export default recomputeRealSeasonLeaders;
