import { generate as generateFace } from "facesjs";
import { idb } from "../db";
import type {
	MinimalPlayerRatings,
	PlayerWithoutKey,
	Race,
} from "../../common/types";
import { DEFAULT_JERSEY, isSport } from "../../common";

const generate = (race?: Race) => {
	const overrides: any = {
		jersey: {
			id: DEFAULT_JERSEY,
		},
	};

	if (!isSport("basketball")) {
		overrides.glasses = {
			id: "none",
		};
	}

	let face = generateFace(overrides, {
		race,
	});

	// No baseball hat
	while (face.accessories.id.startsWith("hat")) {
		face = generateFace(overrides, {
			race,
		});
	}

	return face;
};

const upgrade = async (p: PlayerWithoutKey<MinimalPlayerRatings>) => {
	// eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
	if (!p.face || !p.face.accessories) {
		// @ts-expect-error
		p.face2 = p.face;
		p.face = generate();
		await idb.cache.players.put(p);
	}
};

export default {
	generate,
	upgrade,
};
