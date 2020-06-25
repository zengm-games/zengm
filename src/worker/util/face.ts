import { generate as generateFace } from "facesjs";
import { idb } from "../db";
import type {
	MinimalPlayerRatings,
	PlayerWithoutKey,
} from "../../common/types";

const generate = () => {
	const overrides: any = {
		jersey: {
			id: process.env.SPORT === "basketball" ? "jersey3" : "football",
		},
	};

	if (process.env.SPORT === "football") {
		overrides.glasses = {
			id: "none",
		};
	}

	return generateFace(overrides);
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
