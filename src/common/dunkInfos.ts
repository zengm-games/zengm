const dunkInfos: Record<
	"toss" | "distance" | "move",
	Record<
		string,
		{
			name: string;
			difficulty: number;
		}
	>
> = {
	toss: {
		none: {
			name: "none",
			difficulty: 0,
		},
		"half-court": {
			name: "from half court, catch off the bounce",
			difficulty: 3,
		},
		"three-point": {
			name: "from the three point line, catch off the bounce",
			difficulty: 2,
		},
		"free-throw": {
			name: "from the free throw line, catch off the backboard",
			difficulty: 1,
		},
		side: {
			name: "off the side of the backboard",
			difficulty: 2,
		},
		back: {
			name: "off the back of the backboard",
			difficulty: 3,
		},
	},
	distance: {
		"at-rim": {
			name: "right at the rim",
			difficulty: 0,
		},
		"free-throw": {
			name: "15 feet (free throw line distance)",
			difficulty: 3,
		},
		"twelve-feet": {
			name: "12 feet",
			difficulty: 2,
		},
		"dotted-line": {
			name: "9 feet (dotted line distance)",
			difficulty: 1,
		},
	},
	move: {
		none: {
			name: "none",
			difficulty: 0,
		},
		windmill: {
			name: "windmil",
			difficulty: 1,
		},
		"between-legs": {
			name: "between the legs",
			difficulty: 3,
		},
		"behind-back": {
			name: "behind the back",
			difficulty: 2,
		},
		"double-clutch": {
			name: "double clutch",
			difficulty: 1,
		},
		"honey-dip": {
			name: "honey dip",
			difficulty: 3,
		},
		"spin-180": {
			name: "180°",
			difficulty: 1,
		},
		"spin-360": {
			name: "360°",
			difficulty: 2,
		},
		"spin-540": {
			name: "540°",
			difficulty: 4,
		},
		"spin-720": {
			name: "720°",
			difficulty: 8,
		},
		"over-sitting": {
			name: "jump over sitting person",
			difficulty: 1,
		},
		"over-short": {
			name: "jump over a short person",
			difficulty: 2,
		},
		"over-tall": {
			name: "jump over a tall person",
			difficulty: 4,
		},
	},
};

export default dunkInfos;
