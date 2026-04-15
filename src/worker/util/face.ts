import { generate as generateFace, type FaceConfig } from "facesjs";
import { idb } from "../db/index.ts";
import type { PlayerWithoutKey, Race } from "../../common/types.ts";
import { DEFAULT_JERSEY } from "../../common/constants.ts";
import g from "./g.ts";
import defaultGameAttributes from "../../common/defaultGameAttributes.ts";
import { bySport, isSport } from "../../common/sportFunctions.ts";

export const generate = (
	options:
		| { race?: Race; relative?: undefined }
		| { race?: undefined; relative?: FaceConfig } = {},
) => {
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
		...options,
	});

	const allowEyeBlack = bySport({
		baseball: true, // Doesn't matter, gets replaced by hat
		basketball: false,
		football: true,
		hockey: false,
	});

	while (
		// Baseball hat is only for baseball
		(!isSport("baseball") && face.accessories.id.startsWith("hat")) ||
		(!allowEyeBlack && face.accessories.id === "eye-black") ||
		face.accessories.id === "santa-hat"
	) {
		face = generateFace(overrides, {
			gender,
			...options,
		});
	}

	return face;
};

export const upgrade = async (p: PlayerWithoutKey) => {
	// TEMP DISABLE WITH ESLINT 9 UPGRADE eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
	if (!p.face || !p.face.accessories) {
		// @ts-expect-error
		p.face2 = p.face;
		p.face = generate();
		await idb.cache.players.put(p);
	}
};
