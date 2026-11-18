import helpers from "../../util/helpers.ts";
import { PLAYER_AND_TEAM_RAW_STATS } from "../player/stats.football.ts";

const raw = [
	"drives",
	"totStartYds",
	"timePos",
	"pts",

	...PLAYER_AND_TEAM_RAW_STATS,

	// Two point conversions are only recorded for teams
	"tp",
	"tpa",
] as const;

// raw: recorded directly in game sim
// derived: still stored in database, but not directly recorded in game sim
// not present in this file: transiently derived things, like FG%
const stats = {
	derived: [],
	raw: [
		"gp",
		"min",
		...raw,
		...raw.map((stat) => `opp${helpers.upperCaseFirstLetter(stat)}` as const),
	] as const,
};

export default stats;
