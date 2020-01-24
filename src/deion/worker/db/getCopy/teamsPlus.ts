import { idb } from "..";
import {
	TeamAttr,
	TeamStatAttr,
	TeamSeasonAttr,
	TeamStatType,
} from "../../../common/types";

const getCopy = async <
	Attrs extends Readonly<TeamAttr[]>,
	SeasonAttrs extends Readonly<TeamSeasonAttr[]>,
	StatAttrs extends Readonly<TeamStatAttr[]>
>({
	tid,
	season,
	attrs = ([] as never) as Attrs,
	seasonAttrs = ([] as never) as SeasonAttrs,
	stats = ([] as never) as StatAttrs,
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
