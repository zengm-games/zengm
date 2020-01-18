import { PHASE } from "../../common";
import { team } from "../core";
import { idb } from "../db";
import { g, helpers, lock } from "../util";
import { UpdateEvents, ViewInput } from "../../common/types";

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
		const vars: any = {
			abbrev: inputs.abbrev,
			gamesInProgress: lock.get("gameSim"),
			hardCap: g.get("hardCap"),
			numGames: g.get("numGames"),
			tid: inputs.tid,
			show: inputs.show,
			salaryCap: g.get("salaryCap") / 1000,
			minContract: g.get("minContract"),
			minPayroll: g.get("minPayroll") / 1000,
			luxuryPayroll: g.get("luxuryPayroll") / 1000,
			luxuryTax: g.get("luxuryTax"),
			userTid: g.get("userTid"),
			budget: g.get("budget"),
		};
		const contracts: any = await team.getContracts(inputs.tid);
		const payroll = await team.getPayroll(contracts);
		vars.payroll = payroll / 1000;
		let showInt;

		if (inputs.show === "all") {
			showInt = g.get("season") - g.get("startingSeason") + 1;
		} else {
			showInt = parseInt(inputs.show, 10);
		}

		// Convert contract objects into table rows
		const contractTotals = [0, 0, 0, 0, 0];
		let season = g.get("season");

		if (g.get("phase") >= PHASE.DRAFT) {
			// After the draft, don't show old contract year
			season += 1;
		}

		for (let i = 0; i < contracts.length; i++) {
			contracts[i].amounts = [];

			for (let j = season; j <= contracts[i].exp; j++) {
				// Only look at first 5 years (edited rosters might have longer contracts)
				if (j - season >= 5) {
					break;
				}

				contracts[i].amounts.push(contracts[i].amount / 1000);
				contractTotals[j - season] += contracts[i].amount / 1000;
			}

			delete contracts[i].amount;
			delete contracts[i].exp;
		}

		vars.contracts = contracts;
		vars.contractTotals = contractTotals;
		vars.salariesSeasons = [
			season,
			season + 1,
			season + 2,
			season + 3,
			season + 4,
		];
		const teamSeasons = await idb.getCopies.teamSeasons({
			tid: inputs.tid,
		});
		teamSeasons.reverse(); // Most recent season first
		// Add in luxuryTaxShare if it's missing

		for (let i = 0; i < teamSeasons.length; i++) {
			if (!teamSeasons[i].revenues.hasOwnProperty("luxuryTaxShare")) {
				teamSeasons[i].revenues.luxuryTaxShare = {
					amount: 0,
					rank: 15,
				};
			}
		}

		let keys = ["won", "hype", "pop", "att", "cash", "revenues", "expenses"];
		const barData: any = {};

		for (let i = 0; i < keys.length; i++) {
			if (typeof teamSeasons[0][keys[i]] !== "object") {
				barData[keys[i]] = helpers.nullPad(
					teamSeasons.map(ts => ts[keys[i]]),
					showInt,
				);
			} else {
				// Handle an object in the database
				barData[keys[i]] = {};
				const tempData = teamSeasons.map(ts => ts[keys[i]]);

				for (const key of Object.keys(tempData[0])) {
					barData[keys[i]][key] = helpers.nullPad(
						tempData.map(x => x[key]).map(x => x.amount),
						showInt,
					);
				}
			}
		}

		// Process some values
		barData.att = barData.att.map((num, i) => {
			if (teamSeasons[i] !== undefined) {
				if (!teamSeasons[i].hasOwnProperty("gpHome")) {
					teamSeasons[i].gpHome = Math.round(teamSeasons[i].gp / 2);
				}

				// See also game.js and team.js
				if (teamSeasons[i].gpHome > 0) {
					return num / teamSeasons[i].gpHome; // per game
				}

				return 0;
			}
		});
		keys = ["cash"];

		for (let i = 0; i < keys.length; i++) {
			barData[keys[i]] = barData[keys[i]].map(num => num / 1000); // convert to millions
		}

		const barSeasons: number[] = [];
		for (let i = 0; i < showInt; i++) {
			barSeasons[i] = g.get("season") - i;
		}

		vars.barData = barData;
		vars.barSeasons = barSeasons; // Get stuff for the finances form

		vars.t = await idb.getCopy.teamsPlus({
			attrs: ["region", "name", "abbrev", "budget"],
			seasonAttrs: ["expenses"],
			season: g.get("season"),
			tid: inputs.tid,
		});
		vars.maxStadiumCapacity = teamSeasons.reduce((max, teamSeason) => {
			if (teamSeason.stadiumCapacity > max) {
				return teamSeason.stadiumCapacity;
			}

			return max;
		}, 0);
		return vars;
	}
};

const updateGamesInProgress = (
	inputs: ViewInput<"teamFinances">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (
		updateEvents.includes("lock.gameSim") ||
		inputs.tid !== state.tid ||
		inputs.show !== state.show
	) {
		return {
			gamesInProgress: lock.get("gameSim"),
		};
	}
};

export default async (inputs: any, updateEvents: UpdateEvents, state: any) => {
	return Object.assign(
		{},
		await updateTeamFinances(inputs, updateEvents, state),
		await updateGamesInProgress(inputs, updateEvents, state),
	);
};
