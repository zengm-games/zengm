import { idb } from "..";
import { TeamFiltered } from "../../../common/types"; //import type {TeamAttr, TeamFiltered, TeamSeasonAttr, TeamStatAttr, TeamStatType} from '../../../../deion/common/types';
import { TeamsPlusOptions } from "../getCopies/teamsPlus";

const getCopy = async (
	options: TeamsPlusOptions & { tid: number },
): Promise<TeamFiltered | void> => {
	// $FlowFixMe http://stackoverflow.com/q/42680759/786644
	const result = await idb.getCopies.teamsPlus(options);
	return result[0];
};

export default getCopy;
