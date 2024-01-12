export const hashSavedTrade = (
	tradeTeams: [
		{
			tid: number;
			pids: number[];
			dpids: number[];
		},
		{
			tid: number;
			pids: number[];
			dpids: number[];
		},
	],
) => {
	return JSON.stringify([
		tradeTeams[0].tid,
		tradeTeams[0].pids.sort((a, b) => a - b),
		tradeTeams[0].dpids.sort((a, b) => a - b),
		tradeTeams[1].tid,
		tradeTeams[1].pids.sort((a, b) => a - b),
		tradeTeams[1].dpids.sort((a, b) => a - b),
	]);
};
