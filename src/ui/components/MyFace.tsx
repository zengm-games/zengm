import type { FaceConfig, Overrides } from "facesjs";
import { Face } from "facesjs/react";
import fastDeepEqual from "fast-deep-equal";
import { useMemo, useState } from "react";
import { DEFAULT_JERSEY, DEFAULT_TEAM_COLORS } from "../../common/constants.ts";

const isChristmas = () => {
	const now = new Date();
	return now.getMonth() === 11 && now.getDate() === 25;
};

export const MyFace = ({
	colors = DEFAULT_TEAM_COLORS,
	face,
	jersey = DEFAULT_JERSEY,
	lazy,
}: {
	colors?: [string, string, string];
	face: FaceConfig;
	jersey?: string;
	lazy?: boolean;
}) => {
	// Face redraws the whole SVG, which is slow, whenever face or overrides is a new object. Data from the worker is a new object on every update even if nothing changed, so keep the previous face while its contents are the same.
	const [stableFace, setStableFace] = useState(face);
	if (face !== stableFace && !fastDeepEqual(face, stableFace)) {
		setStableFace(face);
	}

	// Built from the individual colors, because the colors array is also a new object on every update
	const [color0, color1, color2] = colors;
	const christmas = isChristmas();
	const overrides = useMemo(() => {
		const teamColors: [string, string, string] = [color0, color1, color2];

		let overrides: Overrides;
		if (__SPORT === "baseball") {
			const [jerseyId, accessoryId] = jersey.split(":");
			overrides = {
				teamColors,
				jersey: {
					id: jerseyId!,
				},
				accessories: {
					id: accessoryId!,
				},
			};
		} else {
			overrides = {
				teamColors,
				jersey: {
					id: jersey,
				},
			};
		}

		if (christmas) {
			overrides.accessories = { id: "santa-hat" };
		}

		return overrides;
	}, [christmas, color0, color1, color2, jersey]);

	return (
		<Face
			face={stableFace}
			ignoreDisplayErrors
			lazy={lazy}
			overrides={overrides}
			style={{
				aspectRatio: "2/3",
			}}
		/>
	);
};
