import type { Team } from "../../../common/types";
import { g, helpers } from "../../util";

const BUDGET_KEYS: (keyof Team["budget"])[] = [
	"scouting",
	"coaching",
	"health",
	"facilities",
];

const autoBudgetSettings = (
	t: Team,
	popRank: number,
	salaryCap: number = g.get("salaryCap"),
) => {
	let updated = false;

	const defaultTicketPrice = helpers.defaultTicketPrice(popRank, salaryCap);
	const defaultBudgetAmount = helpers.defaultBudgetAmount(popRank, salaryCap);

	if (t.budget.ticketPrice.amount !== defaultTicketPrice) {
		t.budget.ticketPrice.amount = defaultTicketPrice;
		updated = true;
	}

	for (const key of BUDGET_KEYS) {
		if (t.budget[key].amount !== defaultBudgetAmount) {
			t.budget[key].amount = defaultBudgetAmount;
			updated = true;
		}
	}

	return updated;
};

export default autoBudgetSettings;
