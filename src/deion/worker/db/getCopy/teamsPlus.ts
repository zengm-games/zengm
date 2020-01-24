import { idb } from "..";
import {
	TeamAttr,
	TeamStatAttr,
	TeamSeasonAttr,
	TeamStatType,
} from "../../../common/types";

const getCopy = async <
	Attrs extends Readonly<TeamAttr[]> | undefined,
	SeasonAttrs extends Readonly<TeamSeasonAttr[]> | undefined,
	StatAttrs extends Readonly<TeamStatAttr[]> | undefined
>({
	tid,
	season,
	attrs,
	seasonAttrs,
	stats,
	playoffs = false,
	regularSeason = true,
	statType = "perGame",
}: {
	tid: number;
	season?: number;
	attrs?: Attrs;
	seasonAttrs?: SeasonAttrs;
	stats?: StatAttrs;
	playoffs?: boolean;
	regularSeason?: boolean;
	statType?: TeamStatType;
}) => {
	const result = await idb.getCopies.teamsPlus<Attrs, SeasonAttrs, StatAttrs>({
		tid,
		season,
		attrs,
		seasonAttrs,
		stats,
		playoffs,
		regularSeason,
		statType,
	});
	return result.length > 0 ? result[0] : undefined;
};

export default getCopy;
