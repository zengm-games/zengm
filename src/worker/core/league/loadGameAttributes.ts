import { league } from "..";
import { idb } from "../../db";
import { defaultGameAttributes, g } from "../../util";
import {
	gameAttributeHasHistory,
	helpers,
	unwrapGameAttribute,
} from "../../../common";
import gameAttributesToUI from "./gameAttributesToUI";

export const ALWAYS_WRAP = [
	"confs",
	"divs",
	"numGamesPlayoffSeries",
	"numPlayoffByes",
	"otl",
	"playoffsNumTeamsDiv",
	"pointsFormula",
	"tiebreakers",
	"ties",
	"userTid",
];

/**
 * Load game attributes from the database and update the global variable g.
 *
 * @return {Promise}
 */
const loadGameAttributes = async () => {
	const gameAttributes = await idb.cache.gameAttributes.getAll();

	for (const { key, value } of gameAttributes) {
		if (ALWAYS_WRAP.includes(key) && !gameAttributeHasHistory(value)) {
			// Wrap on load to avoid IndexedDB upgrade
			g.setWithoutSavingToDB(key, [
				{
					// @ts-ignore
					start: -Infinity,
					value,
				},
			]);
		} else {
			g.setWithoutSavingToDB(key, value);
		}
	}

	// Shouldn't be necessary, but some upgrades fail http://www.reddit.com/r/BasketballGM/comments/2zwg24/cant_see_any_rosters_on_any_teams_in_any_of_my/cpn0j6w
	if (g.get("userTids") === undefined) {
		g.setWithoutSavingToDB("userTids", [g.get("userTid")]);
	}

	// Set defaults to avoid IndexedDB upgrade
	for (const key of helpers.keys(defaultGameAttributes)) {
		// @ts-ignore
		if (g[key] === undefined) {
			if (key === "teamInfoCache") {
				g.setWithoutSavingToDB(
					"teamInfoCache",
					(await idb.cache.teams.getAll()).map(t => ({
						abbrev: t.abbrev,
						disabled: t.disabled,
						imgURL: t.imgURL,
						name: t.name,
						region: t.region,
					})),
				);
			} else if (key === "numActiveTeams") {
				g.setWithoutSavingToDB(
					"numActiveTeams",
					(await idb.cache.teams.getAll()).filter(t => !t.disabled).length,
				);
			} else if (
				key === "numGamesPlayoffSeries" &&
				g.hasOwnProperty("numPlayoffRounds")
			) {
				// If numPlayoffRounds was set back before numGamesPlayoffSeries existed, use that
				await league.setGameAttributes({
					numGamesPlayoffSeries: league.getValidNumGamesPlayoffSeries(
						unwrapGameAttribute(defaultGameAttributes, "numGamesPlayoffSeries"),
						(g as any).numPlayoffRounds,
						g.get("numActiveTeams"),
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
	if ((g.get("draftType") as any) === "nba") {
		g.setWithoutSavingToDB("draftType", "nba2019");
	}

	await gameAttributesToUI(g as any);
};

export default loadGameAttributes;
