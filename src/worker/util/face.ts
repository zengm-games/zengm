import { generate as generateFace } from "facesjs";
import { idb } from "../db";
import type {
	MinimalPlayerRatings,
	PlayerWithoutKey,
	Race,
} from "../../common/types";
import { bySport, DEFAULT_JERSEY, isSport } from "../../common";
import g from "./g";
import defaultGameAttributes from "../../common/defaultGameAttributes";

const generate = (race?: Race) => {
	let overrides: any;

	if (isSport("baseball")) {
		const [jersey, accessory] = DEFAULT_JERSEY.split(":");
		overrides = {
			jersey: {
				id: jersey,
			},
			accessories: {
				id: accessory,
			},
		};
	} else {
		overrides = {
			jersey: {
				id: DEFAULT_JERSEY,
			},
		};
	}

	if (!isSport("basketball")) {
		overrides.glasses = {
			id: "none",
		};
	}

	// Careful, because this can be called from the team editor before a league is created
	const gender = Object.hasOwn(g, "gender")
		? g.get("gender")
		: defaultGameAttributes.gender;

	let face = generateFace(overrides, {
		gender,
		race,
	});

	if (!isSport("baseball")) {
		const allowEyeBlack = bySport({
			baseball: false,
			basketball: false,
			football: true,
			hockey: false,
		});

		// No baseball hat
		while (
			face.accessories.id.startsWith("hat") ||
			(!allowEyeBlack && face.accessories.id === "eye-black")
		) {
			face = generateFace(overrides, {
				gender,
				race,
			});
		}
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
