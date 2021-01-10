import { generate as generateFace } from "facesjs";
import { idb } from "../db";
import type {
	MinimalPlayerRatings,
	PlayerWithoutKey,
	Race,
} from "../../common/types";
import { isSport } from "../../common";

const generate = (race?: Race) => {
	const overrides: any = {
		jersey: {
			id: process.env.SPORT === "basketball" ? "jersey3" : "football",
		},
	};

	if (isSport("football")) {
		overrides.glasses = {
			id: "none",
		};
	}

	return generateFace(overrides, {
		race,
	});
};

const upgrade = async (p: PlayerWithoutKey<MinimalPlayerRatings>) => {
	// eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
	if (!p.face || !p.face.accessories) {
		// @ts-ignore
		p.face2 = p.face;
		p.face = generate();
		await idb.cache.players.put(p);
	}
};

export default {
	generate,
	upgrade,
};
