import { idb } from "..";
import { TeamsPlusOptions } from "../getCopies/teamsPlus";

const getCopy = async (options: TeamsPlusOptions & { tid: number }) => {
	const result = await idb.getCopies.teamsPlus(options);
	return result.length > 0 ? result[0] : undefined;
};

export default getCopy;
