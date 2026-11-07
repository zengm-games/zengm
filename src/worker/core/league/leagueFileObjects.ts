// Keys in a league file that are a single object, rather than an array of objects
const cumulativeObjects = [
	"gameAttributes",
	"meta",
	"startingSeason",
	"version",
] as const;
export const CUMULATIVE_OBJECTS = new Set<string>(cumulativeObjects);
export type CumulativeObjects = (typeof cumulativeObjects)[number];
