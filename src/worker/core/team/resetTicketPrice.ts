import type { Team } from "../../../common/types";
import { g, helpers } from "../../util";
import { getAutoTicketPriceByTid } from "../game/attendance";

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
