import basketball from "./basketball.json";
import formatScheduledEvents from "./formatScheduledEvents";

const getLeagueInfo = (
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

	throw new Error(`Unknown type "${options.type}"`);
};

export default getLeagueInfo;
