// @flow

//import countBy from "lodash/countBy";
import { PHASE } from "../../../common";
import { draft, player, trade } from "..";
import { idb } from "../../db";
import { g, helpers } from "../../util";
import type { TradePickValues } from "../../../common/types";
import getPayroll from "./getPayroll";
import updateValues from "../player/updateValues";

// estValuesCached is either a copy of estValues (defined below) or null. When it's cached, it's much faster for repeated calls (like trading block).
const valueChange = async (
	tid: number,
	pidsAdd: number[],
	pidsRemove: number[],
	dpidsAdd: number[],
	dpidsRemove: number[],
	estValuesCached?: TradePickValues,
): Promise<number> => {
	// UGLY HACK: Don't include more than 2 draft picks in a trade for AI team
	if (dpidsRemove.length > 2) {
		return -1;
	}

	// Get value and skills for each player on team or involved in the proposed transaction
	const roster = [];
	let add = [];
	let remove = [];

	const t = await idb.getCopy.teamsPlus({
		attrs: ["strategy"],
		stats: ["gp"],
		season: g.season,
		tid,
	});
	if (!t) {
		//console.log("invalid team ID");
		throw new Error("Invalid team ID");
	}

	const strategy = t.strategy;

	const gpAvg = helpers.bound(t.stats.gp, 0, g.numGames); // Ideally would be done separately for each team, but close enough
	const payroll = await getPayroll(tid);

	const difficultyFudgeFactor = helpers.bound(
		1 + 0.1 * g.difficulty,
		0,
		Infinity,
	); // 2.5% bonus for easy, 2.5% penalty for hard, 10% penalty for insane

	// Get players
	const getPlayers = async () => {
		// Fudge factor for AI overvaluing its own players
		const fudgeFactor = (tid !== g.userTid ? 1.05 : 1) * difficultyFudgeFactor;

		// Get roster and players to remove
		const players = await idb.cache.players.indexGetAll("playersByTid", tid); //get all the players on tid
		for (const p of players) {
			//for each player
			updateValues(p);
			if (!pidsRemove.includes(p.pid)) {
				//player from tid not in pidsRemove put on roster
				roster.push({
					value:
						strategy === "contending"
							? 0.75 * p.valueNoPot + 0.25 * p.value
							: p.value,
					skills: p.ratings[p.ratings.length - 1].skills,
					contract: p.contract,
					overall: p.ratings[p.ratings.length - 1].ovr,
					worth: player.genContract(p, false, false, true),
					injury: p.injury,
					age: g.season - p.born.year,
				});
			} else {
				//player from tid in pidsRemove put in remove
				remove.push({
					value:
						fudgeFactor *
						(strategy === "contending"
							? 0.75 * p.valueNoPot + 0.25 * p.value
							: p.value),
					skills: p.ratings[p.ratings.length - 1].skills,
					contract: p.contract,
					overall: p.ratings[p.ratings.length - 1].ovr,
					worth: player.genContract(p, false, false, true),
					injury: p.injury,
					age: g.season - p.born.year,
				});
			}
		}

		// Get players to add
		for (const pid of pidsAdd) {
			//add players from other team to add
			const p = await idb.cache.players.get(pid);
			updateValues(p);
			add.push({
				value:
					strategy === "contending"
						? 0.75 * p.valueNoPot + 0.25 * p.value
						: p.value,
				skills: p.ratings[p.ratings.length - 1].skills,
				contract: p.contract,
				overall: p.ratings[p.ratings.length - 1].ovr,
				worth: player.genContract(p, false, false, true),
				injury: p.injury,
				age: g.season - p.born.year,
			});
		}
	};

	const getPicks = async () => {
		// For each draft pick, estimate its value based on the recent performance of the team
		if (dpidsAdd.length > 0 || dpidsRemove.length > 0) {
			// Estimate the order of the picks by team
			const allTeamSeasons = await idb.cache.teamSeasons.indexGetAll(
				"teamSeasonsBySeasonTid",
				[[g.season - 1], [g.season, "Z"]],
			);

			// This part needs to be run every time so that gpAvg is available
			const wps = []; // Contains estimated winning percentages for all teams by the end of the season

			let gp = 0;
			for (let tid2 = 0; tid2 < g.numTeams; tid2++) {
				const teamSeasons = allTeamSeasons.filter(
					teamSeason => teamSeason.tid === tid2,
				);
				const s = teamSeasons.length;

				let rCurrent;
				let rLast;
				if (teamSeasons.length === 1) {
					// First season
					if (teamSeasons[0].won + teamSeasons[0].lost > 15) {
						rCurrent = [teamSeasons[0].won, teamSeasons[0].lost];
					} else {
						// Fix for new leagues - don't base this on record until we have some games played, and don't let the user's picks be overvalued
						rCurrent = tid2 === g.userTid ? [g.numGames, 0] : [0, g.numGames];
					}

					if (tid2 === g.userTid) {
						rLast = [
							Math.round(0.6 * g.numGames),
							Math.round(0.4 * g.numGames),
						];
					} else {
						// Assume a losing season to minimize bad trades
						rLast = [
							Math.round(0.4 * g.numGames),
							Math.round(0.6 * g.numGames),
						];
					}
				} else {
					// Second (or higher) season
					rCurrent = [teamSeasons[s - 1].won, teamSeasons[s - 1].lost];
					rLast = [teamSeasons[s - 2].won, teamSeasons[s - 2].lost];
				}

				gp = rCurrent[0] + rCurrent[1]; // Might not be "real" games played

				// If we've played half a season, just use that as an estimate. Otherwise, take a weighted sum of this and last year
				const halfSeason = Math.round(0.5 * g.numGames);
				if (gp >= halfSeason) {
					wps.push(rCurrent[0] / gp);
				} else if (gp > 0) {
					wps.push(
						((gp / halfSeason) * rCurrent[0]) / gp +
							(((halfSeason - gp) / halfSeason) * rLast[0]) / g.numGames,
					);
				} else {
					wps.push(rLast[0] / g.numGames);
				}
			}

			// Get rank order of wps http://stackoverflow.com/a/14834599/786644
			const sorted = wps.slice().sort((a, b) => a - b);
			const estPicks = wps.slice().map(v => sorted.indexOf(v) + 1); // For each team, what is their estimated draft position?

			const rookieSalaries = draft.getRookieSalaries();

			// Actually add picks after some stuff below is done
			let estValues;
			if (estValuesCached) {
				estValues = estValuesCached;
			} else {
				estValues = await trade.getPickValues();
			}

			for (const dpid of dpidsAdd) {
				const dp = await idb.cache.draftPicks.get(dpid);
				if (!dp) {
					continue;
				}
				const season = dp.season === "fantasy" ? g.season : dp.season;
				let estPick;
				if (dp.pick > 0) {
					estPick = dp.pick;
				} else {
					estPick = estPicks[dp.originalTid];
				}

				// No fudge factor, since this is coming from the user's team (or eventually, another AI)
				let value;
				if (estValues[String(season)]) {
					value =
						estValues[String(season)][
							estPick - 1 + g.numTeams * (dp.round - 1)
						];
				}
				if (value === undefined) {
					value = estValues.default[estPick - 1 + g.numTeams * (dp.round - 1)];
				}

				add.push({
					value,
					skills: [],
					contract: {
						amount: rookieSalaries[estPick - 1 + g.numTeams * (dp.round - 1)],
						exp: season + 2 + (2 - dp.round), // 3 for first round, 2 for second
					},
					worth: {
						amount: rookieSalaries[estPick - 1 + g.numTeams * (dp.round - 1)],
						exp: season + 2 + (2 - dp.round), // 3 for first round, 2 for second
					},
					injury: { type: "Healthy", gamesRemaining: 0 },
					age: 19,
					draftPick: true,
				});
			}

			for (const dpid of dpidsRemove) {
				const dp = await idb.cache.draftPicks.get(dpid);
				if (!dp) {
					continue;
				}
				const season = dp.season === "fantasy" ? g.season : dp.season;
				let estPick;
				if (dp.pick > 0) {
					estPick = dp.pick;
				} else {
					estPick = estPicks[dp.originalTid];
				}

				let value;
				if (estValues[String(season)]) {
					value =
						estValues[String(season)][
							estPick - 1 + g.numTeams * (dp.round - 1)
						];
				}
				if (value === undefined) {
					value = estValues.default[estPick - 1 + g.numTeams * (dp.round - 1)];
				}

				remove.push({
					value,
					skills: [],
					contract: {
						amount:
							rookieSalaries[estPick - 1 + g.numTeams * (dp.round - 1)] / 1000,
						exp: season + 2 + (2 - dp.round), // 3 for first round, 2 for second
					},
					worth: {
						amount:
							rookieSalaries[estPick - 1 + g.numTeams * (dp.round - 1)] / 1000,
						exp: season + 2 + (2 - dp.round), // 3 for first round, 2 for second
					},
					injury: { type: "Healthy", gamesRemaining: 0 },
					age: 19,
					draftPick: true,
				});
			}
		}
	};

	await getPlayers();
	await getPicks();

	/*
	for(let i = 0; i < add.length; i++){
		console.log(add[i]);
	}
	for(let i = 0; i < remove.length; i++){
		console.log(remove[i]);
	}
	*/

	const desiredNumOfSkills = {
		"3": 5,
		A: 5,
		B: 3,
		Di: 2,
		Dp: 2,
		Po: 2,
		Ps: 4,
		R: 3,
	};
	const rosterSkills = { "3": 0, A: 0, B: 0, Di: 0, Dp: 0, Po: 0, Ps: 0, R: 0 };
	for (const p of roster) {
		if (p.value >= 45) {
			for (const s of p.skills) {
				rosterSkills[s]++;
			}
		}
	}

	const doSkillBonuses = test => {
		test.sort((a, b) => b.value - a.value); //do higher valued players first

		for (let i = 0; i < test.length; i++) {
			if (test[i].value >= 45) {
				for (let j = 0; j < test[i].skills.length; j++) {
					const skill = test[i].skills[j];
					const teamSkillNeed = desiredNumOfSkills[skill] - rosterSkills[skill];
					//console.log(teamSkillNeed);

					if (teamSkillNeed > 0) {
						//if the team needs the skill
						test[i].value += 3 + 2 * teamSkillNeed;
					} else {
						//if the team has too much of that skill (unlikely, but just in case)
						test[i].value -= 1 + teamSkillNeed;
					}
					rosterSkills[skill] += 1; //don't recount skills
				}
			}
		}
		return test;
	};

	if (process.env.SPORT === "basketball") {
		add = doSkillBonuses(add); //adjust values in add
		remove = doSkillBonuses(remove); //adjust values in remove
	}

	const sumTradeValue = players => {
		if (players.length === 0) {
			return 0;
		}

		const valueContract = p => {
			//adjust for age
			const contractLength = p.contract.exp - g.season;
			const contractValue = 34 - p.age + contractLength * (29 - p.age);
			//young players on long contracts will get a boost
			//old players on short contracts will be penalized less

			const max = g.maxContract - g.minContract;
			const min = g.minContract - g.maxContract;
			const v = p.worth.amount - p.contract.amount; //negative == overpaid, positive == underpaid
			const worthFactor = (v - min) / (max - min) + 0.5; //overpaid --> wf < 1, underpaid --> wf > 1
			//players who are underpaid will recieve a boost in contract value
			//players who are overpaid will recieve a reduction in contract value

			return contractValue * worthFactor;
		};

		const valueInjury = p => {
			if (strategy === "contending" && p.injury.gamesRemaining >= 50) {
				return 50;
			}
			const injuryFactor = strategy === "contending" ? 0.25 : 0;
			return injuryFactor * p.injury.gamesRemaining;
		};

		let totalValue = 0;
		const contractFactor = strategy === "contending" ? 0.75 : 1;
		for (const p of players) {
			let val = p.draftPick
				? p.value
				: contractFactor * valueContract(p) + p.value - valueInjury(p); //if a pick, don't factor in contract and no injuries
			if (!p.draftPick && p.overall >= 60) {
				//false if p is a draft pick
				val *= p.overall / 45;
			}
			totalValue += val;
		}
		return totalValue;
	};

	//testing
	/*
	for(let i = 0; i < add.length; i++){
		console.log(add[i]);
	}
	for(let i = 0; i < remove.length; i++){
		console.log(remove[i]);
	}
	*/

	const valueAdded = sumTradeValue(add);
	const valueRemoved = sumTradeValue(remove);
	//console.log(valueAdded);
	//console.log(valueRemoved);
	let dv = valueAdded - valueRemoved;

	// Aversion towards losing cap space in a trade during free agency
	const sumContracts = (players, onlyThisSeason) => {
		onlyThisSeason = onlyThisSeason !== undefined ? onlyThisSeason : false;

		if (players.length === 0) {
			return 0;
		}

		return players.reduce((memo, p) => {
			if (p.draftPick) {
				return memo;
			}

			return (
				memo +
				(p.contract.amount / 1000) *
					player.contractSeasonsRemaining(p.contract.exp, g.numGames - gpAvg) **
						(0.25 - (onlyThisSeason ? 0.25 : 0))
			);
		}, 0);
	};

	if (g.phase >= PHASE.RESIGN_PLAYERS || g.phase <= PHASE.FREE_AGENCY) {
		// Only care if cap space is over 2 million
		if (payroll + 2000 < g.salaryCap) {
			const salaryAddedThisSeason =
				sumContracts(add, true) - sumContracts(remove, true);
			// Only care if cap space is being used
			if (salaryAddedThisSeason > 0) {
				//console.log("Free agency penalty: -" + (0.2 + 0.8 * g.daysLeft / 30) * salaryAddedThisSeason);
				dv -= (0.2 + (0.8 * g.daysLeft) / 30) * salaryAddedThisSeason; // 0.2 to 1 times the amount, depending on stage of free agency
			}
		}
	}

	return dv; //return the difference between the value gained and value lost
};

export default valueChange;
