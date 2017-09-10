// @flow

import { idb } from "../../db";
import type { TeamFiltered } from "../../../common/types";
//import type {TeamAttr, TeamFiltered, TeamSeasonAttr, TeamStatAttr, TeamStatType} from '../../../common/types';

const getCopy = async (options: {
    tid: number,
    /*    season?: number,
    attrs?: TeamAttr[],
    seasonAttrs?: TeamSeasonAttr[],
    stats?: TeamStatAttr[],
    playoffs?: boolean,
    regularSeason?: boolean,
    statType?: TeamStatType,*/
}): Promise<TeamFiltered | void> => {
    // $FlowFixMe http://stackoverflow.com/q/42680759/786644
    const result = await idb.getCopies.teamsPlus(options);
    return result[0];
};

export default getCopy;
