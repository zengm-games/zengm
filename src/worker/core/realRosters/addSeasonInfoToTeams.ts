import { helpers } from "../../util";
import type formatScheduledEvents from "./formatScheduledEvents";
import type getGameAttributes from "./getGameAttributes";
import type { Basketball } from "./loadData.basketball";
import oldAbbrevTo2020BBGMAbbrev from "./oldAbbrevTo2020BBGMAbbrev";

const addSeasonInfoToTeams = (
	teams: ReturnType<typeof formatScheduledEvents>["initialTeams"],
	basketball: Basketball,
	gameAttributes: ReturnType<typeof getGameAttributes>,
	season: number,
) => {
	const teamSeasons = basketball.teamSeasons[season];

	const teamsAugmented = teams.map(t => {
		const abbrev = oldAbbrevTo2020BBGMAbbrev(t.srID);

		const teamSeason = teamSeasons?.[abbrev];
		if (!teamSeason) {
			return t;
		}

		let roundsWonText;
		const playoffSeries = basketball.playoffSeries[season];
		if (playoffSeries) {
			let playoffRoundsWon = -1;
			for (const round of playoffSeries) {
				const index = round.abbrevs.indexOf(abbrev);
				if (index >= 0) {
					playoffRoundsWon = round.round;
					const otherIndex = index === 0 ? 1 : 0;
					if (round.wons[index] > round.wons[otherIndex]) {
						playoffRoundsWon += 1;
					}
				}
			}

			roundsWonText = helpers.roundsWonText(
				playoffRoundsWon,
				gameAttributes.numGamesPlayoffSeries!.length,
				gameAttributes.confs.length,
			);
			if (roundsWonText === "") {
				roundsWonText = "Missed playoffs";
			}
		}

		const seasonInfo = {
			won: teamSeason.won,
			lost: teamSeason.lost,
			roundsWonText,
		};

		return {
			...t,
			seasonInfo,
		};
	});

	return teamsAugmented;
};

export default addSeasonInfoToTeams;
