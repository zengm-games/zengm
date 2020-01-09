import { generate as generateFace } from "facesjs";
import { idb } from "../db";
import { MinimalPlayerRatings, Player } from "../../common/types";

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

const upgrade = async (p: Player<MinimalPlayerRatings>) => {
	if (!p.face || !p.face.accessories) {
		// $FlowFixMe
		p.face2 = p.face;
		p.face = generate();
		await idb.cache.players.put(p);
	}
};

export default {
	generate,
	upgrade,
};
