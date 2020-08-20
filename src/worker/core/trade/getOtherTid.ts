import get from "./get";

/**
 * Gets the team ID for the team that the user is trading with.
 *
 * @memberOf core.trade
 * @return {Promise<number>} Resolves to the other team's team ID.
 */
const getOtherTid = async (): Promise<number> => {
	const tr = await get();
	return tr.teams[1].tid;
};

export default getOtherTid;
