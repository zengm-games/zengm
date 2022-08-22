import orderBy from "lodash/orderBy";
import { groupBy } from "../../../common/groupBy";
import type { GetLeagueOptions, Player } from "../../../common/types";
import { g, helpers, local } from "../../util";
import player from "../player";
import formatPlayerFactory from "./formatPlayerFactory";
import type formatScheduledEvents from "./formatScheduledEvents";
import type getGameAttributes from "./getGameAttributes";
import type { Basketball } from "./loadData.basketball";
import oldAbbrevTo2020BBGMAbbrev from "./oldAbbrevTo2020BBGMAbbrev";

const addSeasonInfoToTeams = async (
	teams: ReturnType<typeof formatScheduledEvents>["initialTeams"],
	basketball: Basketball,
	gameAttributes: ReturnType<typeof getGameAttributes>,
	options: GetLeagueOptions,
) => {
	if (options.type === "legends") {
		throw new Error("Not supported");
	}

	const teamSeasons = basketball.teamSeasons[options.season];

	const formatPlayer = await formatPlayerFactory(
		basketball,
		options,
		options.season,
		teams,
		-1,
	);

	const ratings = basketball.ratings.filter(
		row => row.season === options.season,
	);
	const players = ratings
		.map(row => formatPlayer(row))
		.filter(p => p.tid >= 0)
		.map(p => {
			const p2 = {
				...p,
				firstName: "",
				lastName: "",
			} as unknown as Player;
			delete (p2 as any).name;
			const parts = p.name.split(" ");
			p2.firstName = parts[0];
			p2.lastName = parts.slice(1, parts.length).join(" ");
			p2.stats = [];
			return p2;
		});

	g.setWithoutSavingToDB("season", options.season);
	g.setWithoutSavingToDB("numActiveTeams", 2);
	local.playerOvrMean = 48;
	local.playerOvrStd = 10;
	local.playerOvrMeanStdStale = false;
	for (const p of players) {
		await player.develop(p, 0, false, 1);
		await player.updateValues(p);
	}

	const playersByTid = groupBy(
		orderBy(players, p => p.ratings.at(-1).ovr, "desc"),
		"tid",
	);

	const teamsAugmented = teams
		.map(t => {
			const abbrev = oldAbbrevTo2020BBGMAbbrev(t.srID);

			const teamSeason = teamSeasons?.[abbrev];
			if (!teamSeason) {
				return t;
			}

			let roundsWonText;
			const playoffSeries = basketball.playoffSeries[options.season];
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
		})
		.map(t => ({
			...t,
			players: playersByTid[t.tid],
		}));
	console.log(teamsAugmented);

	return teamsAugmented;
};

export default addSeasonInfoToTeams;
