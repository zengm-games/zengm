import { display } from "facesjs";
import type { Face } from "facesjs";
import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { DEFAULT_JERSEY } from "../../common";

const imgStyle = {
	maxHeight: "100%",
	maxWidth: "100%",
};

const PlayerPicture = ({
	face,
	imgURL,
	colors,
	jersey,
}: {
	face?: Face;
	imgURL?: string;
	colors?: [string, string, string];
	jersey?: string;
}) => {
	const [wrapper, setWrapper] = useState<HTMLDivElement | null>(null);
	useEffect(() => {
		if (face && !imgURL && wrapper) {
			const overrides = {
				teamColors: colors ?? ["#000000", "#cccccc", "#ffffff"],
				jersey: {
					id: jersey ?? DEFAULT_JERSEY,
				},
			};
			display(wrapper, face, overrides);
		}
	}, [face, imgURL, colors, jersey, wrapper]);

	if (imgURL) {
		return <img alt="Player" src={imgURL} style={imgStyle} />;
	}

	if (face) {
		return <div ref={setWrapper} />;
	}

	return null;
};

PlayerPicture.propTypes = {
	face: PropTypes.object,
	imgURL: PropTypes.string,
	teamColors: PropTypes.arrayOf(PropTypes.string),
};

export default PlayerPicture;
