import loadDataBasketball from "./loadData.basketball.ts";
import formatScheduledEvents from "./formatScheduledEvents.ts";
import { isSport, REAL_PLAYERS_INFO } from "../../../common/index.ts";
import getGameAttributes from "./getGameAttributes.ts";
import type { GetLeagueOptions } from "../../../common/types.ts";
import addSeasonInfoToTeams from "./addSeasonInfoToTeams.ts";

export const legendsInfo = {
	"1950s": {
		start: 1950,
		end: 1959,
	},
	"1960s": {
		start: 1960,
		end: 1969,
	},
	"1970s": {
		start: 1970,
		end: 1979,
	},
	"1980s": {
		start: 1980,
		end: 1989,
	},
	"1990s": {
		start: 1990,
		end: 1999,
	},
	"2000s": {
		start: 2000,
		end: 2009,
	},
	"2010s": {
		start: 2010,
		end: 2019,
	},
	"2020s": {
		start: 2020,
		end: 2029,
	},
	all: {
		start: -Infinity,
		end: REAL_PLAYERS_INFO?.MAX_SEASON ?? Infinity,
	},
};

const getLeagueInfo = async (options: GetLeagueOptions) => {
	if (!isSport("basketball")) {
		throw new Error(`Not supported for ${process.env.SPORT}`);
	}

	const basketball = await loadDataBasketball();

	const scheduledEventsAll = [
		...basketball.scheduledEventsGameAttributes,
		...basketball.scheduledEventsTeams,
	];

	if (options.type === "real") {
		const { initialGameAttributes, initialTeams } = formatScheduledEvents(
			scheduledEventsAll,
			{
				keepAllTeams: options.realStats === "all",
				season: options.season,
				phase: options.phase,
			},
		);

		const stores = [
			"teams",
			"players",
			"gameAttributes",
			"startingSeason",
			"seasonLeaders",
			"scheduledEvents",
		];

		if (options.season >= 2020) {
			// Future draft pick data only in alexnoob files
			stores.push("draftPicks");
		}

		const gameAttributes = getGameAttributes(initialGameAttributes, options);
		const teams = initialTeams.filter((t) => !t.disabled);

		if (options.includeSeasonInfo) {
			return {
				gameAttributes,
				startingSeason: options.season,
				stores,
				teams: await addSeasonInfoToTeams(
					teams,
					basketball,
					gameAttributes,
					options,
				),
			};
		}

		return {
			gameAttributes,
			startingSeason: options.season,
			stores,
			teams,
		};
	}

	if (options.type === "legends") {
		const lastSeason =
			options.decade === "all" ? 2020 : Number.parseInt(options.decade) + 9;

		const { initialGameAttributes, initialTeams } = formatScheduledEvents(
			scheduledEventsAll,
			{
				keepAllTeams: false,
				season: lastSeason,
			},
		);

		const stores = ["teams", "players", "gameAttributes", "startingSeason"];

		return {
			gameAttributes: getGameAttributes(initialGameAttributes, options),
			startingSeason: legendsInfo[options.decade].end,
			stores,
			teams: initialTeams,
		};
	}

	// @ts-expect-error
	throw new Error(`Unknown type "${options.type}"`);
};

export default getLeagueInfo;
