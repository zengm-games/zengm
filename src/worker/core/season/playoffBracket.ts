import type {
	ByConf,
	PlayInTournament,
	PlayoffSeries,
	PlayoffSeriesTeam,
} from "../../../common/types.ts";
import { helpers } from "../../../common/helpers.ts";
import { chunk } from "../../../common/utils.ts";

// Rules for how teams move through the playoff bracket. These are shared by the real playoffs and by anything that simulates them, so they don't need any game state beyond what is passed in.

// Play 2 home (true) then 2 away (false) and repeat, but ensure that the better team always gets the last game.
export const betterSeedHome = (
	numGamesPlayoffSeries: number,
	gameNum: number,
) => {
	// For series lengths like 3, 7, 11, 15, etc., special case last 3 games to ensure the home team always gets the last game
	const needsSpecialEnding = (numGamesPlayoffSeries + 1) % 4 === 0;

	if (needsSpecialEnding) {
		// Special case for last 3 games
		if (gameNum >= numGamesPlayoffSeries - 3) {
			return (
				gameNum === numGamesPlayoffSeries - 3 ||
				gameNum === numGamesPlayoffSeries - 1
			);
		}
	}

	const num = Math.floor(gameNum / 2);
	return num % 2 === 0;
};

type PlayInGame = PlayInTournament[number];

// Only for a play-in game that has been played, since each is a single game
export const getPlayInWinnerLoser = ({ home, away }: PlayInGame) => {
	return home.won > 0
		? { winner: home, loser: away }
		: { winner: away, loser: home };
};

// The last game of a play-in tournament, once its first 2 games are done: the loser of the game between the top 2 teams hosts the winner of the game between the bottom 2 teams
export const getPlayInFinalGame = (playIn: PlayInTournament): PlayInGame => {
	const resetTeam = (t: PlayoffSeriesTeam) => ({
		...helpers.deepCopy(t),
		pts: undefined,
		won: 0,
	});

	return {
		home: resetTeam(getPlayInWinnerLoser(playIn[0]).loser),
		away: resetTeam(getPlayInWinnerLoser(playIn[1]).winner),
	};
};

// The winner of the game between the top 2 teams takes the first round spot held by playIn[0].home, and the winner of the last game takes the one held by playIn[0].away. The game between the bottom 2 teams does not send anyone to the playoffs.
export const getPlayInTargetTid = (
	playIn: PlayInTournament,
	gameIndex: number,
) => {
	if (gameIndex === 0) {
		return playIn[0].home.tid;
	}
	if (gameIndex === 2) {
		return playIn[0].away.tid;
	}
};

// Mutates firstRound to put the winner of a play-in game in the spot it was playing for
export const placePlayInWinner = (
	firstRound: PlayoffSeries["series"][number],
	targetTid: number,
	winner: PlayoffSeriesTeam,
) => {
	for (const matchup of firstRound) {
		for (const type of ["home", "away"] as const) {
			const matchupTeam = matchup[type];
			if (matchupTeam?.pendingPlayIn && matchupTeam.tid === targetTid) {
				matchup[type] = {
					...winner,
					seed: matchupTeam.seed,
					won: 0,
					pts: undefined,
					pendingPlayIn: undefined,
				};
			}
		}
	}
};

/**
 * Matchups for the next round of the playoffs, from the winners of the current round in bracket order.
 *
 * orderAcrossConfs sorts teams best first. It's for when the remaining teams come from different conferences, because then their seeds are not comparable.
 */
export const getNextRoundMatchups = async <T extends PlayoffSeriesTeam>({
	orderAcrossConfs,
	playoffsByConf,
	reseed,
	teamsWon,
}: {
	orderAcrossConfs: (teams: T[]) => T[] | Promise<T[]>;
	playoffsByConf: ByConf;
	reseed: boolean;
	teamsWon: T[];
}) => {
	// Once all the intraconference rounds are done, the remaining teams are from different conferences
	const acrossConfs =
		playoffsByConf !== false && teamsWon.length <= playoffsByConf;

	let teams = teamsWon;
	if (reseed) {
		// Within the conference rounds, only reseed within each conference
		const groups =
			playoffsByConf !== false && !acrossConfs
				? chunk(teamsWon, Math.ceil(teamsWon.length / playoffsByConf))
				: [teamsWon];

		teams = [];
		for (const group of groups) {
			// This matters for more than just home/away if you have 4 conferences, because then the actual matchups in the semifinals depend on it
			const ordered = acrossConfs
				? [...(await orderAcrossConfs(group))]
				: group.toSorted((a, b) => a.seed - b.seed);

			// Each 2 teams are a matchup (best team, worst team, 2nd best team, 2nd worst team, etc)
			while (ordered.length > 0) {
				teams.push(teams.length % 2 === 0 ? ordered.shift()! : ordered.pop()!);
			}
		}
	}

	const matchups: { home: T; away: T }[] = [];
	for (const [team1, team2] of chunk(teams, 2)) {
		let firstTeamHome;
		if (acrossConfs) {
			// Needed even after reseeding above, because reseeding may be disabled
			const ordered = await orderAcrossConfs([team1!, team2!]);
			firstTeamHome = ordered[0]!.tid === team1!.tid;
		} else {
			// Seed ties should be impossible within a conference
			firstTeamHome = team1!.seed < team2!.seed;
		}

		matchups.push(
			firstTeamHome
				? { home: team1!, away: team2! }
				: { home: team2!, away: team1! },
		);
	}

	return matchups;
};
