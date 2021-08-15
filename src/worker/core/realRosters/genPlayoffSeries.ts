import type { Basketball } from "./loadData.basketball";
import type formatScheduledEvents from "./formatScheduledEvents";
import oldAbbrevTo2020BBGMAbbrev from "./oldAbbrevTo2020BBGMAbbrev";
import genPlayoffSeeds from "../season/genPlayoffSeeds";
import { helpers } from "../../util";

const genPlayoffSeries = (
	basketball: Basketball,
	initialTeams: ReturnType<typeof formatScheduledEvents>["initialTeams"],
	season: number,
	completeBracket: boolean,
) => {
	// Look at first 2 rounds, to find any byes
	const firstRound = basketball.playoffSeries[season].filter(
		row => row.round === 0,
	);
	const secondRound = basketball.playoffSeries[season].filter(
		row => row.round === 1,
	);

	type MatchupTeam = {
		tid: number;
		cid: number;
		winp: number;
		seed: number;
		won: number;
	};

	const firstRoundMatchups: {
		home: MatchupTeam;
		away?: MatchupTeam;
	}[] = [];
	const firstRoundAbbrevs = new Set();

	const genTeam = (
		abbrev: string,
		series: typeof basketball.playoffSeries[number][number],
		i: number,
	) => {
		firstRoundAbbrevs.add(abbrev);
		const t = initialTeams.find(
			t => oldAbbrevTo2020BBGMAbbrev(t.srID) === abbrev,
		);
		if (!t) {
			throw new Error("Missing team");
		}
		const teamSeason = basketball.teamSeasons[season][abbrev];
		if (!teamSeason) {
			throw new Error("Missing teamSeason");
		}
		const winp = helpers.calcWinp(teamSeason);

		return {
			tid: t.tid,
			cid: t.cid,
			winp,
			seed: series.seeds[i],
			won: completeBracket ? series.wons[i] : 0,
		};
	};

	const genHomeAway = (series: typeof firstRound[number]) => {
		const teams = series.abbrevs.map((abbrev, i) => genTeam(abbrev, series, i));

		let home;
		let away;
		if (
			(teams[0].seed === teams[1].seed && teams[0].winp > teams[1].winp) ||
			teams[0].seed < teams[1].seed
		) {
			home = teams[0];
			away = teams[1];
		} else {
			home = teams[1];
			away = teams[0];
		}

		return { home, away };
	};

	for (const series of firstRound) {
		firstRoundMatchups.push(genHomeAway(series));
	}

	let numPlayoffTeams = 2 * firstRoundMatchups.length;
	let numPlayoffByes = 0;

	for (const series of secondRound) {
		for (let i = 0; i < series.abbrevs.length; i++) {
			const abbrev = series.abbrevs[i];
			if (!firstRoundAbbrevs.has(abbrev)) {
				// Appears in second round but not first... must have been a bye
				const home = genTeam(abbrev, series, i);
				firstRoundMatchups.push({
					home,
				});
				numPlayoffTeams += 1;
				numPlayoffByes += 1;
			}
		}
	}
	const numRounds = Math.log2(firstRoundMatchups.length);
	const series: typeof firstRoundMatchups[] = [];
	for (let i = 0; i <= numRounds; i++) {
		series.push([]);
	}

	// Reorder to match expected BBGM format
	if (season === 1947 || season === 1948 || season === 1950) {
		// These ones are hardcoded because their byes are weird, not like normal BBGM byes, so their seeds don't match up.

		let matchupsAbbrevs;
		// One team from each matchup
		if (season === 1947) {
			matchupsAbbrevs = ["CHI", "WSC", "NYC", "PHV"];
		} else if (season === 1948) {
			matchupsAbbrevs = ["STB", "PHV", "BLB", "CHI"];
		} else {
			matchupsAbbrevs = [
				"MNL",
				"FTW",
				"IND",
				"AND",
				"SYR",
				"PHV",
				"WSC",
				"NYC",
			];
		}

		const matchups = matchupsAbbrevs.map(abbrev => {
			const t = initialTeams.find(t => t.abbrev === abbrev);
			if (t) {
				const matchup = firstRoundMatchups.find(
					matchup =>
						t.tid === matchup.home.tid ||
						(matchup.away && t.tid === matchup.away.tid),
				);
				if (matchup) {
					return matchup;
				}
				throw new Error("Matchup not found");
			}
			throw new Error("Team not found");
		});
		series[0] = matchups;
	} else {
		const confSeeds = genPlayoffSeeds(numPlayoffTeams / 2, numPlayoffByes / 2);
		const cids = [0, 1];
		for (const cid of cids) {
			const confMatchups = firstRoundMatchups.filter(
				matchup => matchup.home.cid === cid,
			);
			for (const seeds of confSeeds) {
				const matchup = confMatchups.find(
					matchup =>
						matchup.home.seed - 1 === seeds[0] ||
						matchup.home.seed - 1 === seeds[1],
				);
				if (matchup) {
					series[0].push(matchup);
				}
			}
		}
	}

	// If necessary, add matchups for rounds after the first round
	if (completeBracket) {
		for (let i = 1; i <= numRounds; i++) {
			const currentRound = series[i];
			const matchups = basketball.playoffSeries[season]
				.filter(row => row.round === i)
				.map(genHomeAway);

			// Iterate over every other game, and find the matchup in the next round that contains one of the teams in that game. This ensures order of the bracket is maintained.
			const previousRound = series[i - 1];
			for (let i = 0; i < previousRound.length; i += 2) {
				const { away, home } = previousRound[i];
				const previousTids = [home.tid];
				if (away) {
					previousTids.push(away.tid);
				}
				const currentMatchup = matchups.find(
					matchup =>
						previousTids.includes(matchup.home.tid) ||
						previousTids.includes(matchup.away.tid),
				);
				if (!currentMatchup) {
					throw new Error("Matchup not found");
				}
				currentRound.push(currentMatchup);
			}
		}
	}

	return {
		currentRound: completeBracket ? numRounds - 1 : 0,
		season,
		series,
	};
};

export default genPlayoffSeries;
