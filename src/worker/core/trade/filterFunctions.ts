import _ from "lodash";
import type { OfferType } from "src/worker/api";

export interface FilterFunction {
	name: string;
	execute: (filteredPlayers: any, players: any, filterData: any) => any;
}

export const POS: FilterFunction = {
	name: "POS",
	execute(filteredPlayers: any, offer: any, filterData: any) {
		if (offer.players.length === 0)
			return {
				players: offer.players,
				qualifies: true,
			};
		else if (filterData && filterData.length > 0) {
			const qualifyingPlayers = filteredPlayers.filter((pl: any) => {
				return filterData.includes(pl.ratings.pos);
			});
			return {
				players: qualifyingPlayers,
				qualifies: qualifyingPlayers.length > 0,
			};
		} else
			return {
				players: filteredPlayers,
				qualifies: filteredPlayers.length > 0,
			};
	},
};

export const SALARY_CAP: FilterFunction = {
	name: "SALARY_CAP",
	execute(filteredPlayers: any, offer: OfferType, filterData: any) {
		if (filterData === "-1") {
			return {
				players: filteredPlayers,
				qualifies: offer.warning ? false : true,
			};
		} else if (filterData == "")
			return { players: filteredPlayers, qualifies: true };
		else {
			const qualifies =
				offer.players.reduce(
					(total: number, pl: any) => (total += pl.contract.amount),
					0,
				) <= Number(filterData);
			return { players: filteredPlayers, qualifies: qualifies };
		}
	},
};

export const SKILL: FilterFunction = {
	name: "SKILL",
	execute(filteredPlayers: any, offer: any, filterData: any) {
		if (offer.players.length === 0)
			return {
				players: offer.players,
				qualifies: true,
			};
		else if (filterData && filterData.length > 0) {
			const qualifyingPlayers = filteredPlayers.filter(
				(player: any) =>
					_.intersection(filterData, player.ratings.skills).length > 0,
			);
			return {
				players: qualifyingPlayers,
				qualifies: qualifyingPlayers.length > 0,
			};
		} else return { players: filteredPlayers, qualifies: true };
	},
};
