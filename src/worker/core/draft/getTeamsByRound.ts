import { bySport, PHASE } from "../../../common";
import { idb } from "../../db";
import { g, orderTeams } from "../../util";
import { getDivisionRanks } from "../../util/orderTeams";
import type { DraftPickWithoutKey } from "../../../common/types";
import { genPlayoffSeriesFromTeams } from "../season/genPlayoffSeries";

/**
 * Differences across sports:
 *
 * Basketball
 * - lottery is for non-playoff teams only
 * - after lottery, order is based on record, not playoff results
 * - tied teams in lottery split the total chances (handled in divideChancesOverTiedTeams.ts)
 * - tiebreaker is random - but make it deterministic so it doesn't jump when doing the lottery
 * - 2nd round tiebreaker is opposite of 1st round
 * - 2nd round order is just based on record, no lottery section for non-playoff teams
 *
 * Football
 * - order is based on playoff results
 * - tiebreaker is different than for playoffs, but i could probably get away with using the same one
 * - tied teams rotate (like 123 -> 231 -> 312 -> 123) in later rounds
 * - besides tiebreakers, order is same in all rounds
 *
 * Hockey
 * - lottery is like basketball, but sort based on points rather than winp
 * - then: playoff teams that did not win their divisions and did not make the conference finals, sorted by points
 * - then: playoff teams that won their divisions and did not make the conference finals, sorted by points
 * - then: conference finals losers sorted by points are assigned picks 29 and 30
 * - then: finals loser
 * - then: finals winner
 * - 2nd+ round same as 1st round, but with lottery teams ordered by points
 * - tiebreaker is different than for playoffs, but i could probably get away with using the same one
 * - tiebreaker order is the same in every round
 */

const FIRST_ROUND_PLAYOFF_TEAMS_ORDER = bySport<
	"record" | "playoffs" | "playoffsHockey"
>({
	basketball: "record",
	football: "playoffs",
	hockey: "playoffsHockey",
});

const TIEBREAKER = bySport<"random" | "default">({
	basketball: "random",
	football: "default",
	hockey: "default",
});

const ORDER_AFTER_FIRST_ROUND = bySport<"record" | "firstRound">({
	basketball: "record",
	football: "firstRound",
	hockey: "firstRound",
});

const getTeamsByRound = async (draftPicksIndexed: DraftPickWithoutKey[][]) => {
	const allTeams = await idb.getCopies.teamsPlus({
		attrs: ["tid"],
		seasonAttrs: [
			"playoffRoundsWon",
			"cid",
			"did",
			"won",
			"lost",
			"tied",
			"otl",
			"winp",
			"pts",
			"wonDiv",
			"lostDiv",
			"tiedDiv",
			"otlDiv",
			"wonConf",
			"lostConf",
			"tiedConf",
			"otlConf",
		],
		stats: ["pts", "oppPts", "gp"],
		season: g.get("season"),
		addDummySeason: true,
		active: true,
	});

	// If the playoffs haven't started yet, need to project who would be in the playoffs
	let tidPlayoffs: number[] = [];
	if (g.get("phase") < PHASE.PLAYOFFS) {
		tidPlayoffs = (await genPlayoffSeriesFromTeams(allTeams)).tidPlayoffs;
	}

	// Handle teams without draft picks (for challengeNoDraftPicks)
	const teams = allTeams.filter(t => !!draftPicksIndexed[t.tid]);

	// Expansion teams and re-activated teams who did not play this season
	for (const t of teams) {
		if (
			t.seasonAttrs.won === 0 &&
			t.seasonAttrs.lost === 0 &&
			t.seasonAttrs.tied === 0
		) {
			t.seasonAttrs.winp = 0.5;
		}
	}

	type MyTeam = typeof teams[number];

	const usePts = g.get("pointsFormula", "current") !== "";

	const orderTeamsSettings: Parameters<typeof orderTeams>[2] =
		TIEBREAKER === "random"
			? {
					tiebreakersOverride: ["coinFlip"],
			  }
			: undefined;

	////
	// Many special cases in first round
	////

	const ties: Record<
		string,
		{
			// Some ties might not appear until the 2nd round, due to 1st round sorting factoring in playoffs
			rounds: number[];
			teams: MyTeam[];
		}
	> = {};

	const addTie = (tiedTeams: MyTeam[], round: number) => {
		const key = JSON.stringify(tiedTeams.map(t => t.tid).sort((a, b) => a - b));

		if (!ties[key]) {
			ties[key] = {
				rounds: [round],
				teams: tiedTeams,
			};
		} else {
			ties[key].rounds.push(round);
		}
	};

	const checkForTies = (teamsToCheck: MyTeam[], round: number) => {
		let tiedValue;
		let tiedTeams: MyTeam[] = [];
		for (const t of teamsToCheck) {
			const newTiedValue = usePts ? t.seasonAttrs.pts : t.seasonAttrs.winp;
			if (newTiedValue === tiedValue) {
				tiedTeams.push(t);
			} else {
				if (tiedTeams.length > 0) {
					addTie(tiedTeams, round);
				}

				tiedValue = newTiedValue;
				tiedTeams = [t];
			}
		}

		if (tiedTeams.length > 0) {
			addTie(tiedTeams, round);
		}
	};

	const firstRound: MyTeam[] = [];

	const nonPlayoffTeams = teams.filter(
		t => t.seasonAttrs.playoffRoundsWon < 0 && !tidPlayoffs.includes(t.tid),
	);
	const nonPlayoffTeamsOrdered = (
		await orderTeams(nonPlayoffTeams, allTeams, {
			...orderTeamsSettings,

			// If division leaders matter for playoff seeding, then they should not matter here. But for expansion teams, that can cause a problem, if a new division is added at the same time, they will appear as the only member because they have no entry there
			skipDivisionLeaders: true,
		})
	).reverse();
	checkForTies(nonPlayoffTeamsOrdered, 1);
	firstRound.push(...nonPlayoffTeamsOrdered);

	const playoffTeams = teams.filter(
		t => t.seasonAttrs.playoffRoundsWon >= 0 || tidPlayoffs.includes(t.tid),
	);
	if (playoffTeams.length > 0) {
		if (FIRST_ROUND_PLAYOFF_TEAMS_ORDER === "record") {
			const playoffTeamsOrdered = (
				await orderTeams(playoffTeams, allTeams, orderTeamsSettings)
			).reverse();
			checkForTies(playoffTeamsOrdered, 1);
			firstRound.push(...playoffTeamsOrdered);
		} else if (FIRST_ROUND_PLAYOFF_TEAMS_ORDER === "playoffs") {
			let minPlayoffRoundsWon = Infinity;
			let maxPlayoffRoundsWon = -Infinity;
			for (const t of playoffTeams) {
				if (t.seasonAttrs.playoffRoundsWon < minPlayoffRoundsWon) {
					minPlayoffRoundsWon = t.seasonAttrs.playoffRoundsWon;
				}
				if (t.seasonAttrs.playoffRoundsWon > maxPlayoffRoundsWon) {
					maxPlayoffRoundsWon = t.seasonAttrs.playoffRoundsWon;
				}
			}

			for (
				let playoffRoundsWon = minPlayoffRoundsWon;
				playoffRoundsWon <= maxPlayoffRoundsWon;
				playoffRoundsWon++
			) {
				const playoffRoundTeams = playoffTeams.filter(
					t => t.seasonAttrs.playoffRoundsWon === playoffRoundsWon,
				);
				const playoffRoundTeamsOrdered = (
					await orderTeams(playoffRoundTeams, allTeams, orderTeamsSettings)
				).reverse();
				checkForTies(playoffRoundTeamsOrdered, 1);
				firstRound.push(...playoffRoundTeamsOrdered);
			}
		} else {
			// playoffsHockey
			const divisionRanks = await getDivisionRanks(
				// Pass allTeams rather than teams because there is currently a bug in getDivisionLeaders where only teams in the first arg can be selected. This works around that bug, and also will continue to work after the bug is fixed.
				allTeams,
				allTeams,
			);
			const divisionWinners = new Set<number>();
			for (const [tid, rank] of divisionRanks) {
				if (rank === 1) {
					divisionWinners.add(tid);
				}
			}

			const numPlayoffRounds = g.get("numGamesPlayoffSeries", "current").length;

			// group 0: playoff teams that did not win their divisions and did not make the conference finals, sorted by points
			// group 1: playoff teams that won their divisions and did not make the conference finals, sorted by points
			// group 2: conference finals losers sorted by points are assigned picks 29 and 30
			// group 3: finals loser
			// group 4: finals winner
			const groups: [MyTeam[], MyTeam[], MyTeam[], MyTeam[], MyTeam[]] = [
				[],
				[],
				[],
				[],
				[],
			];

			for (const t of playoffTeams) {
				const playoffRoundsWon = t.seasonAttrs.playoffRoundsWon;
				if (playoffRoundsWon === numPlayoffRounds) {
					groups[4].push(t);
				} else if (playoffRoundsWon === numPlayoffRounds - 1) {
					groups[3].push(t);
				} else if (playoffRoundsWon === numPlayoffRounds - 2) {
					groups[2].push(t);
				} else if (divisionWinners.has(t.tid)) {
					groups[1].push(t);
				} else {
					groups[0].push(t);
				}
			}

			for (const group of groups) {
				const groupOrdered = (
					await orderTeams(group, allTeams, orderTeamsSettings)
				).reverse();
				checkForTies(group, 1);
				firstRound.push(...groupOrdered);
			}
		}
	}

	// Still needs to be adjusted for tiebreakers each round
	const nthRound =
		ORDER_AFTER_FIRST_ROUND === "firstRound"
			? firstRound
			: (await orderTeams(teams, allTeams, orderTeamsSettings)).reverse();

	const teamsByRound: MyTeam[][] = [];
	const numDraftRounds = g.get("numDraftRounds");
	for (let i = 0; i < numDraftRounds; i++) {
		if (i === 0) {
			teamsByRound.push([...firstRound]);
		} else {
			checkForTies(nthRound, i + 1);
			teamsByRound.push([...nthRound]);
		}
	}

	return {
		allTeams,
		teamsByRound,
		ties,
	};
};

export default getTeamsByRound;
