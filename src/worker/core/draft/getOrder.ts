import orderBy from "lodash-es/orderBy";
import { PHASE } from "../../../common";
import { idb } from "../../db";
import { g } from "../../util";

/**
 * Retrieve the current remaining draft order.
 *
 * @memberOf core.draft
 * @return {Promise} Resolves to an ordered array of pick objects.
 */
const getOrder = async () => {
	const season =
		g.get("phase") === PHASE.FANTASY_DRAFT
			? "fantasy"
			: g.get("phase") === PHASE.EXPANSION_DRAFT
			? "expansion"
			: g.get("season");
	const draftPicks = await idb.cache.draftPicks.indexGetAll(
		"draftPicksBySeason",
		season,
	);
	return orderBy(draftPicks, ["round", "pick"]);
};

export default getOrder;
