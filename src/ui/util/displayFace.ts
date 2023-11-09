import { display } from "facesjs";
import type { Face } from "facesjs";
import { DEFAULT_JERSEY, DEFAULT_TEAM_COLORS, isSport } from "../../common";

const displayFace = ({
	colors = DEFAULT_TEAM_COLORS,
	face,
	jersey = DEFAULT_JERSEY,
	wrapper,
}: {
	colors?: [string, string, string];
	jersey?: string;
	face: Face;
	wrapper: HTMLDivElement;
}) => {
	let overrides;
	if (isSport("baseball")) {
		const [jerseyId, accessoryId] = jersey.split(":");
		overrides = {
			teamColors: colors,
			jersey: {
				id: jerseyId,
			},
			accessories: {
				id: accessoryId,
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

	// Don't crash if displaying face fails
	try {
		display(wrapper, face, overrides);
	} catch (error) {
		console.error(error);
	}
};

export default displayFace;
