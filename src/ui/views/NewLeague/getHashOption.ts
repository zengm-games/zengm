import type { GameAttributesLeague } from "../../../common/types.ts";

// Options that can be passed to the new league page in the URL hash, like #rebuild=... These are mutually exclusive, only one can be used at a time.
export type HashOption =
	| {
			type: "rebuild";
			abbrev: string;
			season: number;
	  }
	| {
			type: "gender";
			gender: GameAttributesLeague["gender"];
	  }
	| {
			type: "url";
			url: string;
	  };

const parseHash = (hash: string) => {
	const index = hash.indexOf("=");
	if (!hash.startsWith("#") || index < 0) {
		return;
	}

	// Decode the whole rest of the hash as the value, rather than using URLSearchParams, so that an unescaped URL containing & or + still works
	let value;
	try {
		value = decodeURIComponent(hash.slice(index + 1));
	} catch {
		// Malformed percent encoding
		return;
	}

	return {
		key: hash.slice(1, index),
		value,
	};
};

export const getHashOption = (): HashOption | undefined => {
	const parsed = parseHash(location.hash);
	if (!parsed) {
		return;
	}
	const { key, value } = parsed;

	if (key === "rebuild") {
		const parts = value.split("_");
		const abbrev = parts[1]?.toUpperCase();
		const season = Number.parseInt(parts[2]!);
		if (abbrev && !Number.isNaN(season)) {
			return {
				type: "rebuild",
				abbrev,
				season,
			};
		}
	} else if (key === "gender") {
		if (value === "male" || value === "female") {
			return {
				type: "gender",
				gender: value,
			};
		}
	} else if (key === "url") {
		if (value !== "") {
			return {
				type: "url",
				url: value,
			};
		}
	}
};
