import { PHASE } from "../../common";
import { team } from "../core";
import { idb } from "../db";
import { g, helpers } from "../util";
import type { TeamSeason, UpdateEvents, ViewInput } from "../../common/types";
import { getAutoTicketPriceByTid } from "../core/game/attendance";
import addFirstNameShort from "../util/addFirstNameShort";

const updateTeamFinances = async (
	inputs: ViewInput<"teamFinances">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (
		updateEvents.includes("gameSim") ||
		updateEvents.includes("playerMovement") ||
		updateEvents.includes("teamFinances") ||
		inputs.tid !== state.tid ||
		inputs.show !== state.show
	) {
		const contractsRaw = await team.getContracts(inputs.tid);
		const payroll = (await team.getPayroll(contractsRaw)) / 1000;
		let showInt;

		if (inputs.show === "all") {
			showInt = g.get("season") - g.get("startingSeason") + 1;
		} else {
			showInt = parseInt(inputs.show);
		}

		let season = g.get("season");
		if (g.get("phase") >= PHASE.DRAFT) {
			// After the draft, don't show old contract year
			season += 1;
		}

		// How many seasons into the future are contracts?
		let maxContractExp = -Infinity;
		for (const contract of contractsRaw) {
			if (contract.exp > maxContractExp) {
				maxContractExp = contract.exp;
			}
		}
		const numSeasons = Math.max(
			g.get("maxContractLength"),
			maxContractExp - season + 1,
		);

		// Convert contract objects into table rows
		const contractTotals = Array(numSeasons).fill(0);
		const contracts = addFirstNameShort(
			contractsRaw.map(contract => {
				const amounts: number[] = [];

				for (let i = season; i <= contract.exp; i++) {
					amounts.push(contract.amount / 1000);
					if (contractTotals[i - season] !== undefined) {
						contractTotals[i - season] += contract.amount / 1000;
					}
				}

				return {
					pid: contract.pid,
					firstName: contract.firstName,
					lastName: contract.lastName,
					skills: contract.skills,
					pos: contract.pos,
					injury: contract.injury,
					jerseyNumber: contract.jerseyNumber,
					watch: contract.watch,
					released: contract.released,
					amounts,
				};
			}),
		);

		const salariesSeasons = [];
		for (let i = 0; i < numSeasons; i++) {
			salariesSeasons.push(season + i);
		}

		const teamSeasons = await idb.getCopies.teamSeasons({
			tid: inputs.tid,
		});
		teamSeasons.reverse(); // Most recent season first

		// Add in luxuryTaxShare if it's missing
		for (const teamSeason of teamSeasons) {
			if (!teamSeason.revenues.luxuryTaxShare) {
				teamSeason.revenues.luxuryTaxShare = {
					amount: 0,
					rank: 15,
				};
			}
		}

		const formatRevenueExpenses = (teamSeason: TeamSeason) => {
			const output = {} as Record<
				| `expenses${Capitalize<keyof TeamSeason["expenses"]>}`
				| `revenues${Capitalize<keyof TeamSeason["revenues"]>}`,
				number
			>;
			for (const key of helpers.keys(teamSeason.revenues)) {
				const outputKey = `revenues${helpers.upperCaseFirstLetter(
					key,
				)}` as const;
				output[outputKey] = teamSeason.revenues[key].amount;
			}
			for (const key of helpers.keys(teamSeason.expenses)) {
				const outputKey = `expenses${helpers.upperCaseFirstLetter(
					key,
				)}` as const;
				output[outputKey] = teamSeason.expenses[key].amount;
			}
			return output;
		};

		const barData = teamSeasons.slice(0, showInt).map(teamSeason => {
			const gpHome = teamSeason.gpHome ?? Math.round(teamSeason.gp / 2);
			const att = teamSeason.att / gpHome;

			const numPlayoffRounds = g.get(
				"numGamesPlayoffSeries",
				teamSeason.season,
			).length;

			const champ = teamSeason.playoffRoundsWon === numPlayoffRounds;

			const row = {
				season: teamSeason.season,
				champ,
				att,
				cash: teamSeason.cash / 1000, // convert to millions
				won: teamSeason.won,
				hype: teamSeason.hype,
				pop: teamSeason.pop,
				...formatRevenueExpenses(teamSeason),
			};

			return row;
		});

		// Pad with 0s
		while (barData.length > 0 && barData.length < showInt) {
			const row = helpers.deepCopy(barData.at(-1)!);
			row.season -= 1;
			for (const key of helpers.keys(row)) {
				if (key !== "season" && key !== "champ") {
					row[key] = 0;
				}
			}
			barData.push(row);
		}

		// Get stuff for the finances form
		const t = await idb.getCopy.teamsPlus(
			{
				attrs: ["budget", "adjustForInflation", "autoTicketPrice"],
				seasonAttrs: ["expenses"],
				season: g.get("season"),
				tid: inputs.tid,
				addDummySeason: true,
			},
			"noCopyCache",
		);

		if (!t) {
			throw new Error("Team not found");
		}

		// undefined is true (for upgrades), and AI teams are always true
		t.autoTicketPrice =
			t.autoTicketPrice !== false || !g.get("userTids").includes(inputs.tid);

		const maxStadiumCapacity = teamSeasons.reduce((max, teamSeason) => {
			if (teamSeason.stadiumCapacity > max) {
				return teamSeason.stadiumCapacity;
			}

			return max;
		}, 0);

		const autoTicketPrice = await getAutoTicketPriceByTid(inputs.tid);

		return {
			abbrev: inputs.abbrev,
			autoTicketPrice,
			challengeNoRatings: g.get("challengeNoRatings"),
			salaryCapType: g.get("salaryCapType"),
			numGames: g.get("numGames"),
			tid: inputs.tid,
			show: inputs.show,
			salaryCap: g.get("salaryCap") / 1000,
			minContract: g.get("minContract") / 1000,
			minPayroll: g.get("minPayroll") / 1000,
			luxuryPayroll: g.get("luxuryPayroll") / 1000,
			luxuryTax: g.get("luxuryTax"),
			userTid: g.get("userTid"),
			budget: g.get("budget"),
			spectator: g.get("spectator"),
			maxStadiumCapacity,
			t,
			barData,
			payroll,
			contracts,
			contractTotals,
			salariesSeasons,
			phase: g.get("phase"),
		};
	}
};

export default updateTeamFinances;
