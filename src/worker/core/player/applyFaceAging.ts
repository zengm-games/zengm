import {
	ageFace,
	applyFaceBase,
	getFaceBase,
} from "../../../common/ageFace.ts";
import type { PlayerWithoutKey } from "../../../common/types.ts";
import { g } from "../../util/index.ts";

// Update a player's face for his age in a season. Faces made or edited by the user and real player photos are left alone.
const applyFaceAging = (
	p: PlayerWithoutKey & { pid: number },
	season: number,
) => {
	if (!g.get("faceAging") || p.faceEdited || p.imgURL) {
		return;
	}

	if (!p.faceBase) {
		p.faceBase = getFaceBase(p.face);
	}

	p.face = ageFace(
		applyFaceBase(p.face, p.faceBase),
		p.pid,
		season - p.born.year,
	);
};

export default applyFaceAging;
