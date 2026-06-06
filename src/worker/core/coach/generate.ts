import { g } from "../../util/index.ts";
import { generateFace } from "../../util/face.ts";
import { randInt, truncGauss } from "../../../common/random.ts";
import { helpers } from "../../util/index.ts";
import name from "../player/name.ts";
import ovr from "./ovr.ts";
import genContract from "./genContract.ts";
import genPhilosophy from "./genPhilosophy.ts";
import type { CoachWithoutKey } from "../../../common/types.ts";

const genRating = () =>
	helpers.bound(Math.round(truncGauss(50, 18, 0, 100)), 0, 100);

// Generate a brand-new (non-ex-player) head coach for the given tid (a team, or
// PLAYER.FREE_AGENT for the available pool).
const generate = async (
	tid: number,
	{ age }: { age?: number } = {},
): Promise<CoachWithoutKey> => {
	const { firstName, lastName, country, race } = await name();

	const ratingsNoOvr = {
		development: genRating(),
		tactics: genRating(),
		adaptability: genRating(),
		motivation: genRating(),
	};
	const ratings = {
		...ratingsNoOvr,
		ovr: ovr(ratingsNoOvr),
	};

	const coachAge = age ?? randInt(38, 65);

	return {
		tid,
		firstName,
		lastName,
		face: generateFace({ race }),
		born: {
			year: g.get("season") - coachAge,
			loc: country,
		},
		contract: genContract(ratings.ovr, { randomizeExp: tid >= 0 }),
		ratings,
		philosophy: genPhilosophy(),
		awards: [],
	};
};

export default generate;
