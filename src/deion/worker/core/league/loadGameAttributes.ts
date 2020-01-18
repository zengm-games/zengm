import { league } from "..";
import { idb } from "../../db";
import { defaultGameAttributes, g, toUI } from "../../util";
import { helpers } from "../../../common";

/**
 * Load game attributes from the database and update the global variable g.
 *
 * @return {Promise}
 */
const loadGameAttributes = async () => {
	const gameAttributes = await idb.cache.gameAttributes.getAll();

	for (const { key, value } of gameAttributes) {
		g.setWithoutSavingToDB(key, value);
	}

	// Shouldn't be necessary, but some upgrades fail http://www.reddit.com/r/BasketballGM/comments/2zwg24/cant_see_any_rosters_on_any_teams_in_any_of_my/cpn0j6w
	if (g.get("userTids") === undefined) {
		g.setWithoutSavingToDB("userTids", [g.get("userTid")]);
	}

	// Set defaults to avoid IndexedDB upgrade
	for (const key of helpers.keys(defaultGameAttributes)) {
		// @ts-ignore
		if (g[key] === undefined) {
			if (
				key === "numGamesPlayoffSeries" &&
				g.hasOwnProperty("numPlayoffRounds")
			) {
				// If numPlayoffRounds was set back before numGamesPlayoffSeries existed, use that
				await league.setGameAttributes({
					numGamesPlayoffSeries: league.getValidNumGamesPlayoffSeries(
						defaultGameAttributes.numGamesPlayoffSeries,
						(g as any).numPlayoffRounds,
						g.get("numTeams"),
					),
				});
				delete (g as any).numPlayoffRounds;
			} else {
				g.setWithoutSavingToDB(key, defaultGameAttributes[key]);
			}
		}
	}

	// Avoid IDB upgrade
	if ((g.get("draftType") as any) === "nba") {
		g.setWithoutSavingToDB("draftType", "nba2019");
	}

	const gToUI = { ...g };
	delete gToUI.get;
	delete gToUI.setWithoutSavingToDB;
	await toUI(["setGameAttributes", gToUI]);
};

export default loadGameAttributes;
