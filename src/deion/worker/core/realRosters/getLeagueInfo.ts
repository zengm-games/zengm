import loadDataBasketball from "./loadData.basketball";
import formatScheduledEvents from "./formatScheduledEvents";

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
	if (process.env.SPORT !== "basketball") {
		throw new Error(`Not supported for ${process.env.SPORT}`);
	}

	const basketball = await loadDataBasketball();

	if (options.type === "real") {
		const { initialTeams } = formatScheduledEvents(
			basketball.scheduledEventsTeams,
			options.season,
		);

		const stores =
			options.season === 2020
				? ["teams", "players", "gameAttributes", "startingSeason", "draftPicks"]
				: [
						"teams",
						"players",
						"gameAttributes",
						"startingSeason",
						"scheduledEvents",
				  ];

		return {
			stores,
			teams: initialTeams,
		};
	}

	if (options.type === "legends") {
		const lastSeason =
			options.decade === "all" ? 2020 : parseInt(options.decade) + 9;

		const { initialTeams } = formatScheduledEvents(
			basketball.scheduledEventsTeams,
			lastSeason,
		);

		const stores = ["teams", "players", "gameAttributes", "startingSeason"];

		return {
			stores,
			teams: initialTeams,
		};
	}

	// @ts-ignore
	throw new Error(`Unknown type "${options.type}"`);
};

export default getLeagueInfo;
