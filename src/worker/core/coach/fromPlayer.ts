import { PLAYER } from "../../../common/constants.ts";
import { gauss } from "../../../common/random.ts";
import { helpers } from "../../util/index.ts";
import { last } from "../../../common/utils.ts";
import ovr from "./ovr.ts";
import genContract from "./genContract.ts";
import type { CoachWithoutKey, Player } from "../../../common/types.ts";

const clampRating = (x: number) => helpers.bound(Math.round(x), 0, 100);

// Convert a 0-100 player rating into a style dial in [-1, 1].
const toDial = (rating: number, scale = 0.7) =>
	Math.round(
		helpers.bound(((rating - 50) / 50) * scale + gauss(0, 0.12), -1, 1) * 10,
	) / 10;

// Seed a coach from a retiring player. Smart players (high oiq/diq) make better
// coaches; their philosophy echoes how they played.
const fromPlayer = (p: Player): CoachWithoutKey => {
	const r = last(p.ratings) as any;

	const oiq = r.oiq ?? 50;
	const diq = r.diq ?? 50;
	const tp = r.tp ?? 50;
	const spd = r.spd ?? 50;
	const hgt = r.hgt ?? 50;
	const reb = r.reb ?? 50;

	const awardsBonus = Math.min(
		15,
		(p.awards?.length ?? 0) * 2 + (p.hof ? 8 : 0),
	);

	const ratingsNoOvr = {
		development: clampRating(0.5 * oiq + 0.5 * diq + gauss(0, 8)),
		tactics: clampRating(0.55 * oiq + 0.45 * diq + gauss(0, 8)),
		adaptability: clampRating(40 + 0.3 * oiq + gauss(0, 12)),
		motivation: clampRating(45 + awardsBonus + gauss(0, 12)),
	};
	const ratings = {
		...ratingsNoOvr,
		ovr: ovr(ratingsNoOvr),
	};

	return {
		tid: PLAYER.FREE_AGENT,
		firstName: p.firstName,
		lastName: p.lastName,
		face: p.face,
		born: { ...p.born },
		contract: genContract(ratings.ovr, { randomizeExp: false }),
		ratings,
		philosophy: {
			threePointTendency: toDial(tp),
			pace: toDial(spd, 0.5),
			crashOffensiveGlass: toDial(reb, 0.5),
			// Taller/slower bigs lean toward packing the paint; quick guards toward the perimeter.
			paintDefense: toDial(50 + (hgt - spd) / 2),
			defensiveAggression: toDial((diq + spd) / 2, 0.5),
		},
		fromPid: p.pid,
		awards: [],
	};
};

export default fromPlayer;
