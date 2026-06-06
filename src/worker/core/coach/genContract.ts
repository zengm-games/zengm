import { g, helpers } from "../../util/index.ts";
import { randInt } from "../../../common/random.ts";
import type { PlayerContract } from "../../../common/types.ts";

// Coach salaries are a team expense (not part of the player salary cap). Scaled
// by salaryCap so they track league settings, and by the coach's overall rating.
const genContract = (
	ovr: number,
	{ randomizeExp = false }: { randomizeExp?: boolean } = {},
): PlayerContract => {
	const factor = g.get("salaryCap") / 90000;

	// ~$3M for a replacement-level coach up to ~$13M for an elite one.
	const amount = Math.round((factor * (2500 + ovr * 110)) / 50) * 50;

	const season = g.get("season");
	const length = randInt(2, 5);
	const exp = season + (randomizeExp ? randInt(0, length) : length);

	return {
		amount: helpers.bound(amount, 0, Infinity),
		exp,
	};
};

export default genContract;
