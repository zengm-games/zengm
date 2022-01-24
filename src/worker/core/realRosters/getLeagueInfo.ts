import loadDataBasketball from "./loadData.basketball";
import formatScheduledEvents from "./formatScheduledEvents";
import { isSport } from "../../../common";
import getGameAttributes from "./getGameAttributes";
import type { GetLeagueOptions } from "../../../common/types";

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
	all: {
		start: -Infinity,
		end: 2020,
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

		const stores =
			options.season >= 2020
				? ["teams", "players", "gameAttributes", "startingSeason", "draftPicks"]
				: [
						"teams",
						"players",
						"gameAttributes",
						"startingSeason",
						"scheduledEvents",
				  ];
		return {
			gameAttributes: getGameAttributes(initialGameAttributes, options),
			startingSeason: options.season,
			stores,
			teams: initialTeams.filter(t => !t.disabled),
		};
	}

	if (options.type === "legends") {
		const lastSeason =
			options.decade === "all" ? 2020 : parseInt(options.decade) + 9;

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
