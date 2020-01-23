import { idb } from "..";
import { TeamsPlusOptions } from "../getCopies/teamsPlus";

const getCopy = async (options: TeamsPlusOptions & { tid: number }) => {
	// $FlowFixMe http://stackoverflow.com/q/42680759/786644
	const result = await idb.getCopies.teamsPlus(options);
	return result[0];
};

export default getCopy;
