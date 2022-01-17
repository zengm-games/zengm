export const penaltyTypes = {
	minor: {
		minutes: 2,
		minutesReducedAfterGoal: 2,
	},
	doubleMinor: {
		minutes: 4,
		minutesReducedAfterGoal: 2,
	},
	major: {
		minutes: 5,
		minutesReducedAfterGoal: 0,
	},
};

export const penalties: {
	name: string;
	type: keyof typeof penaltyTypes;
	numPerSeason: number;
	probPerPossession: number;
	cumsumProbPerPossession: number;
}[] = [
	{
		name: "abuse of officials",
		type: "minor",
		numPerSeason: 2,
		probPerPossession: 0,
		cumsumProbPerPossession: 0,
	},
	{
		name: "abusive language",
		type: "minor",
		numPerSeason: 1,
		probPerPossession: 0,
		cumsumProbPerPossession: 0,
	},
	{
		name: "boarding",
		type: "minor",
		numPerSeason: 104,
		probPerPossession: 0,
		cumsumProbPerPossession: 0,
	},
	{
		name: "boarding",
		type: "major",
		numPerSeason: 8,
		probPerPossession: 0,
		cumsumProbPerPossession: 0,
	},
	{
		name: "broken stick",
		type: "minor",
		numPerSeason: 5,
		probPerPossession: 0,
		cumsumProbPerPossession: 0,
	},
	{
		name: "butt-ending",
		type: "major",
		numPerSeason: 1,
		probPerPossession: 0,
		cumsumProbPerPossession: 0,
	},
	{
		name: "charging",
		type: "minor",
		numPerSeason: 14,
		probPerPossession: 0,
		cumsumProbPerPossession: 0,
	},
	{
		name: "charging",
		type: "major",
		numPerSeason: 2,
		probPerPossession: 0,
		cumsumProbPerPossession: 0,
	},
	{
		name: "checking from behind",
		type: "major",
		numPerSeason: 1,
		probPerPossession: 0,
		cumsumProbPerPossession: 0,
	},
	{
		name: "closing his hand on the puck",
		type: "minor",
		numPerSeason: 18,
		probPerPossession: 0,
		cumsumProbPerPossession: 0,
	},
	{
		name: "concealing the puck",
		type: "minor",
		numPerSeason: 2,
		probPerPossession: 0,
		cumsumProbPerPossession: 0,
	},
	{
		name: "cross-checking",
		type: "doubleMinor",
		numPerSeason: 1,
		probPerPossession: 0,
		cumsumProbPerPossession: 0,
	},
	{
		name: "cross-checking",
		type: "minor",
		numPerSeason: 357,
		probPerPossession: 0,
		cumsumProbPerPossession: 0,
	},
	{
		name: "cross-checking",
		type: "major",
		numPerSeason: 4,
		probPerPossession: 0,
		cumsumProbPerPossession: 0,
	},
	{
		name: "delay of game",
		type: "minor",
		numPerSeason: 352,
		probPerPossession: 0,
		cumsumProbPerPossession: 0,
	},
	{
		name: "elbowing",
		type: "minor",
		numPerSeason: 47,
		probPerPossession: 0,
		cumsumProbPerPossession: 0,
	},
	{
		name: "elbowing",
		type: "major",
		numPerSeason: 5,
		probPerPossession: 0,
		cumsumProbPerPossession: 0,
	},
	{
		name: "embellishment",
		type: "minor",
		numPerSeason: 41,
		probPerPossession: 0,
		cumsumProbPerPossession: 0,
	},
	// Disabled for now, cause this would generally apply to 2 people
	/*{
		name: "fighting",
		type: "major",
		numPerSeason: 449,
		probPerPossession: 0,
		cumsumProbPerPossession: 0,
	},*/
	{
		name: "high-sticking",
		type: "doubleMinor",
		numPerSeason: 83,
		probPerPossession: 0,
		cumsumProbPerPossession: 0,
	},
	{
		name: "high-sticking",
		type: "minor",
		numPerSeason: 630,
		probPerPossession: 0,
		cumsumProbPerPossession: 0,
	},
	{
		name: "holding",
		type: "minor",
		numPerSeason: 749,
		probPerPossession: 0,
		cumsumProbPerPossession: 0,
	},
	{
		name: "holding the stick",
		type: "minor",
		numPerSeason: 96,
		probPerPossession: 0,
		cumsumProbPerPossession: 0,
	},
	{
		name: "hooking",
		type: "minor",
		numPerSeason: 1216,
		probPerPossession: 0,
		cumsumProbPerPossession: 0,
	},
	{
		name: "illegal check to the head",
		type: "major",
		numPerSeason: 25,
		probPerPossession: 0,
		cumsumProbPerPossession: 0,
	},
	{
		name: "illegal equipment",
		type: "minor",
		numPerSeason: 3,
		probPerPossession: 0,
		cumsumProbPerPossession: 0,
	},
	{
		name: "illegal stick",
		type: "minor",
		numPerSeason: 1,
		probPerPossession: 0,
		cumsumProbPerPossession: 0,
	},
	{
		name: "instigator",
		type: "minor",
		numPerSeason: 17,
		probPerPossession: 0,
		cumsumProbPerPossession: 0,
	},
	{
		name: "interference",
		type: "minor",
		numPerSeason: 868,
		probPerPossession: 0,
		cumsumProbPerPossession: 0,
	},
	{
		name: "interference",
		type: "major",
		numPerSeason: 6,
		probPerPossession: 0,
		cumsumProbPerPossession: 0,
	},
	{
		name: "kneeing",
		type: "minor",
		numPerSeason: 17,
		probPerPossession: 0,
		cumsumProbPerPossession: 0,
	},
	{
		name: "kneeing",
		type: "major",
		numPerSeason: 1,
		probPerPossession: 0,
		cumsumProbPerPossession: 0,
	},
	{
		name: "roughing",
		type: "minor",
		numPerSeason: 822,
		probPerPossession: 0,
		cumsumProbPerPossession: 0,
	},
	{
		name: "slashing",
		type: "minor",
		numPerSeason: 934,
		probPerPossession: 0,
		cumsumProbPerPossession: 0,
	},
	{
		name: "too many men on the ice",
		type: "minor",
		numPerSeason: 229,
		probPerPossession: 0,
		cumsumProbPerPossession: 0,
	},
	{
		name: "tripping",
		type: "minor",
		numPerSeason: 1569,
		probPerPossession: 0,
		cumsumProbPerPossession: 0,
	},
	{
		name: "unsportsmanlike conduct",
		type: "minor",
		numPerSeason: 117,
		probPerPossession: 0,
		cumsumProbPerPossession: 0,
	},
];

// Assume 60 seconds per possession, 60 minutes per game, 82 game season, 30 teams
let cumsumProbPerPossession = 0;
for (const penalty of penalties) {
	penalty.probPerPossession = penalty.numPerSeason / (60 * 82 * 30);
	cumsumProbPerPossession += penalty.probPerPossession;
	penalty.cumsumProbPerPossession = cumsumProbPerPossession;
}
