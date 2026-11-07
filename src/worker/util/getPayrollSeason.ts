import { PHASE } from "../../common/constants.ts";
import type { Phase } from "../../common/types.ts";
import g from "./g.ts";

// Season whose salaries count in payroll. Contracts of players on a team keep counting after the regular season, even though they're already fully paid, until the re-signing phase starts the next season's payroll. Released players' contracts don't, see isReleasedContractOwed. Like cap holds in real life, this means payroll doesn't drop when the playoffs start, and expiring contracts still matter for things like salary cap rules for trades during the draft.
//
// This is different than getContractStartSeason, which is about when new contracts start and which seasons are still unpaid.
export const getPayrollSeason = (phase: Phase = g.get("phase")) => {
	const season = g.get("season");
	return phase >= PHASE.RESIGN_PLAYERS ? season + 1 : season;
};
