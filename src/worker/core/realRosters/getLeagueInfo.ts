import loadDataBasketball from "./loadData.basketball";
import formatScheduledEvents from "./formatScheduledEvents";
import type { Conf, Div } from "../../../common/types";
import { isSport } from "../../../common";

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

const getLeagueInfo = async (
	options:
		| {
				type: "real";
				season: number;
		  }
		| {
				type: "legends";
				decade:
					| "1950s"
					| "1960s"
					| "1970s"
					| "1980s"
					| "1990s"
					| "2000s"
					| "2010s"
					| "all";
		  },
) => {
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
			options.season,
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
			confs: initialGameAttributes.confs as Conf[],
			divs: initialGameAttributes.divs as Div[],
			startingSeason: options.season,
			stores,
			teams: initialTeams,
		};
	}

	if (options.type === "legends") {
		const lastSeason =
			options.decade === "all" ? 2020 : parseInt(options.decade) + 9;

		const { initialGameAttributes, initialTeams } = formatScheduledEvents(
			scheduledEventsAll,
			lastSeason,
		);

		const stores = ["teams", "players", "gameAttributes", "startingSeason"];

		return {
			confs: initialGameAttributes.confs as Conf[],
			divs: initialGameAttributes.divs as Div[],
			startingSeason: legendsInfo[options.decade].end,
			stores,
			teams: initialTeams,
		};
	}

	// @ts-ignore
	throw new Error(`Unknown type "${options.type}"`);
};

export default getLeagueInfo;
