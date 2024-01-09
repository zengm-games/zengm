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
		tradeTeams[0].pids,
		tradeTeams[0].dpids,
		tradeTeams[1].tid,
		tradeTeams[1].pids,
		tradeTeams[1].dpids,
	]);
};
