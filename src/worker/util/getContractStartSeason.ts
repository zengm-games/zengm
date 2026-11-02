import { PHASE } from "../../common/constants.ts";
import type { Phase } from "../../common/types.ts";
import g from "./g.ts";

// First season that a contract signed right now would pay salary for. Salaries are not paid during the playoffs, so once the playoffs start, a new contract starts next season.
//
// This is also the first season still owed on an existing contract, so a contract with exp less than this has already been fully paid.
export const getContractStartSeason = (phase: Phase = g.get("phase")) => {
	const season = g.get("season");
	return phase >= PHASE.PLAYOFFS ? season + 1 : season;
};
