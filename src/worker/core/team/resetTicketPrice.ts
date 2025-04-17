import type { Team } from "../../../common/types.ts";
import { g, helpers } from "../../util/index.ts";
import { getAutoTicketPriceByTid } from "../game/attendance.ts";

const resetTicketPrice = async (
	t: Team,
	popRank: number,
	salaryCap: number = g.get("salaryCap"),
) => {
	if (t.autoTicketPrice !== false) {
		t.budget.ticketPrice = await getAutoTicketPriceByTid(t.tid);
	} else {
		t.budget.ticketPrice = helpers.defaultTicketPrice(popRank, salaryCap);
	}
};

export default resetTicketPrice;
