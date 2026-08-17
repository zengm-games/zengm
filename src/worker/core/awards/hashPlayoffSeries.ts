export const hashPlayoffSeries = (group: {
	type: "playoffSeries";
	tids: Readonly<[number, number]>;
}) => {
	return JSON.stringify(group.tids);
};
