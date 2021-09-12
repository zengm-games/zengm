const dunkInfos: Record<
	"toss" | "distance" | "move",
	Record<
		string,
		{
			name: string;
			difficulty: number;
			group?: string;
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
			difficulty: 2,
		},
		"three-point": {
			name: "from the three point line, catch off the bounce",
			difficulty: 1.5,
		},
		"free-throw": {
			name: "from the free throw line, catch off the backboard",
			difficulty: 1,
		},
		side: {
			name: "off the side of the backboard",
			difficulty: 1.5,
		},
		back: {
			name: "off the back of the backboard",
			difficulty: 2,
		},
	},
	distance: {
		"at-rim": {
			name: "right at the rim",
			difficulty: 0,
		},
		"free-throw": {
			name: "15 feet (free throw line)",
			difficulty: 4,
		},
		"twelve-feet": {
			name: "12 feet",
			difficulty: 2,
		},
		"dotted-line": {
			name: "9 feet (dotted line)",
			difficulty: 1,
		},
	},
	move: {
		none: {
			name: "none",
			difficulty: 0,
		},
		windmill: {
			name: "windmill",
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
			group: "spin",
		},
		"spin-360": {
			name: "360°",
			difficulty: 2,
			group: "spin",
		},
		"spin-540": {
			name: "540°",
			difficulty: 4,
			group: "spin",
		},
		"spin-720": {
			name: "720°",
			difficulty: 8,
			group: "spin",
		},
		"over-sitting": {
			name: "jump over sitting person",
			difficulty: 1,
			group: "over",
		},
		"over-short": {
			name: "jump over a short person",
			difficulty: 2,
			group: "over",
		},
		"over-tall": {
			name: "jump over a tall person",
			difficulty: 3,
			group: "over",
		},
	},
};

export default dunkInfos;
