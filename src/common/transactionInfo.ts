import type { LogEventType } from "./types";

export const categories = {
	award: {
		text: "Awards",
		className: "badge-warning",
	},
	draft: {
		text: "Draft",
		className: "badge-darkblue",
	},
	league: {
		text: "League",
		className: "badge-secondary",
	},
	injury: {
		text: "Injuries",
		className: "badge-danger",
	},
	playerFeat: {
		text: "Player Feats",
		className: "badge-info",
	},
	playoffs: {
		text: "Playoffs",
		className: "badge-orange",
	},
	rare: {
		text: "Rare Events",
		className: "badge-dark",
	},
	transaction: {
		text: "Transactions",
		className: "badge-success",
	},
	team: {
		text: "Teams",
		className: "badge-light",
	},
};

export const types: Partial<
	Record<
		LogEventType,
		{
			text: string;
			category: keyof typeof categories;
		}
	>
> = {
	injured: {
		text: "Injury",
		category: "injury",
	},
	healed: {
		text: "Recovery",
		category: "injury",
	},
	playerFeat: {
		text: "Player Feat",
		category: "playerFeat",
	},
	playoffs: {
		text: "Playoffs",
		category: "playoffs",
	},
	madePlayoffs: {
		text: "Playoffs",
		category: "playoffs",
	},
	freeAgent: {
		text: "Free Agent",
		category: "transaction",
	},
	reSigned: {
		text: "Re-signing",
		category: "transaction",
	},
	release: {
		text: "Released",
		category: "transaction",
	},
	retired: {
		text: "Retirement",
		category: "transaction",
	},
	trade: {
		text: "Trade",
		category: "transaction",
	},
	award: {
		text: "Award",
		category: "award",
	},
	hallOfFame: {
		text: "Hall of Fame",
		category: "award",
	},
	retiredJersey: {
		text: "Jersey Retirement",
		category: "award",
	},
	ageFraud: {
		text: "Fraud",
		category: "rare",
	},
	tragedy: {
		text: "Tragic Death",
		category: "rare",
	},
	teamContraction: {
		text: "Contraction",
		category: "team",
	},
	teamExpansion: {
		text: "Expansion",
		category: "team",
	},
	teamLogo: {
		text: "New Logo",
		category: "team",
	},
	teamRelocation: {
		text: "Relocation",
		category: "team",
	},
	teamRename: {
		text: "Rename",
		category: "team",
	},
	gameAttribute: {
		text: "League",
		category: "league",
	},
	draft: {
		text: "Draft",
		category: "draft",
	},
	draftLottery: {
		text: "Draft Lottery",
		category: "draft",
	},
	newLeague: {
		text: "New League",
		category: "league",
	},
	luxuryTax: {
		text: "Luxury Tax",
		category: "team",
	},
	luxuryTaxDist: {
		text: "Luxury Tax Dist",
		category: "team",
	},
	minPayroll: {
		text: "Minimum Payroll",
		category: "team",
	},
};
