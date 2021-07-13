import { PHASE } from "../../common";
import { team } from "../core";
import { idb } from "../db";
import { g, helpers } from "../util";
import type { UpdateEvents, ViewInput } from "../../common/types";
import { getAutoTicketPriceByTid } from "../core/game/attendance";

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
			showInt = parseInt(inputs.show, 10);
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
		const contracts = contractsRaw.map(contract => {
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
		});

		const salariesSeasons = [];
		for (let i = 0; i < numSeasons; i++) {
			salariesSeasons.push(season + i);
		}

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

		const keys = [
			"won",
			"hype",
			"pop",
			"att",
			"cash",
			"revenues",
			"expenses",
		] as const;

		// @ts-ignore
		const barData: Record<"won" | "hype" | "pop" | "att" | "cash", number[]> &
			Record<"revenues" | "expenses", any> = {};

		for (const key of keys) {
			if (teamSeasons.length > 0) {
				if (typeof teamSeasons[0][key] === "number") {
					barData[key] = helpers.zeroPad(
						// @ts-ignore
						teamSeasons.map(ts => ts[key]),
						showInt,
					);
				} else {
					// Handle an object in the database
					barData[key] = {};
					const tempData = teamSeasons.map(ts => ts[key]);

					for (const key2 of Object.keys(tempData[0])) {
						barData[key][key2] = helpers.zeroPad(
							// @ts-ignore
							tempData.map(x => x[key2]).map(x => x.amount),
							showInt,
						);
					}
				}
			}
		}

		// Process some values
		// eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
		if (barData.att) {
			barData.att = barData.att.map((num, i) => {
				if (teamSeasons[i] !== undefined) {
					if (!teamSeasons[i].hasOwnProperty("gpHome")) {
						teamSeasons[i].gpHome = Math.round(teamSeasons[i].gp / 2);
					}

					// See also game.js and team.js
					if (teamSeasons[i].gpHome > 0 && typeof num === "number") {
						return num / teamSeasons[i].gpHome; // per game
					}
				}

				return 0;
			});
		}

		const keys2 = ["cash"] as const;
		for (const key of keys2) {
			// eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
			if (barData[key]) {
				// convert to millions
				barData[key] = barData[key].map(num =>
					typeof num === "number" ? num / 1000 : num,
				);
			}
		}

		const barSeasons: number[] = [];
		for (let i = 0; i < showInt; i++) {
			barSeasons[i] = g.get("season") - i;
		}

		// Get stuff for the finances form
		const t = await idb.getCopy.teamsPlus({
			attrs: ["budget", "adjustForInflation", "autoTicketPrice"],
			seasonAttrs: ["expenses"],
			season: g.get("season"),
			tid: inputs.tid,
			addDummySeason: true,
		});

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
			spectator: g.get("spectator"),
			maxStadiumCapacity,
			t,
			barData,
			barSeasons,
			payroll,
			contracts,
			contractTotals,
			salariesSeasons,
			phase: g.get("phase"),
		};
	}
};

export default updateTeamFinances;
