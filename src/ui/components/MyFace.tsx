import type { FaceConfig } from "facesjs";
import { Face } from "facesjs/react";
import { DEFAULT_JERSEY, DEFAULT_TEAM_COLORS } from "../../common/constants.ts";
import { isSport } from "../../common/sportFunctions.ts";

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
	let overrides;
	if (isSport("baseball")) {
		const [jerseyId, accessoryId] = jersey.split(":");
		overrides = {
			teamColors: colors,
			jersey: {
				id: jerseyId!,
			},
			accessories: {
				id: accessoryId!,
			},
		};
	} else {
		overrides = {
			teamColors: colors,
			jersey: {
				id: jersey,
			},
		};
	}

	if (isChristmas()) {
		overrides.accessories = { id: "santa-hat" };
	}

	return (
		<Face
			face={face}
			ignoreDisplayErrors
			lazy={lazy}
			overrides={overrides}
			style={{
				aspectRatio: "2/3",
			}}
		/>
	);
};
