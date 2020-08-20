import { idb } from "..";
import type {
	TeamAttr,
	TeamStatAttr,
	TeamSeasonAttr,
	TeamStatType,
} from "../../../common/types";

const getCopy = async <
	Attrs extends Readonly<TeamAttr[]> | undefined,
	SeasonAttrs extends Readonly<TeamSeasonAttr[]> | undefined,
	StatAttrs extends Readonly<TeamStatAttr[]> | undefined,
	Season extends number | undefined = undefined
>({
	tid,
	season,
	attrs,
	seasonAttrs,
	stats,
	playoffs = false,
	regularSeason = true,
	statType = "perGame",
	addDummySeason = false,
}: {
	tid: number;
	season?: Season;
	attrs?: Attrs;
	seasonAttrs?: SeasonAttrs;
	stats?: StatAttrs;
	playoffs?: boolean;
	regularSeason?: boolean;
	statType?: TeamStatType;
	addDummySeason?: boolean;
}) => {
	const result = await idb.getCopies.teamsPlus<
		Attrs,
		SeasonAttrs,
		StatAttrs,
		Season
	>({
		tid,
		season,
		attrs,
		seasonAttrs,
		stats,
		playoffs,
		regularSeason,
		statType,
		addDummySeason,
	});
	return result.length > 0 ? result[0] : undefined;
};

export default getCopy;
