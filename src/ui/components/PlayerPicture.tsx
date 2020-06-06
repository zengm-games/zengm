import { display, Face } from "facesjs";
import PropTypes from "prop-types";
import React, { useEffect, useState } from "react";

const imgStyle = {
	maxHeight: "100%",
	maxWidth: "100%",
};

const PlayerPicture = ({
	face,
	imgURL,
	teamColors,
}: {
	face?: Face;
	imgURL?: string | undefined;
	teamColors?: [string, string, string] | undefined;
}) => {
	const [wrapper, setWrapper] = useState<HTMLDivElement | null>(null);
	useEffect(() => {
		if (face && !imgURL && wrapper) {
			const overrides = {
				teamColors: teamColors ? teamColors : ["#000000", "#cccccc", "#ffffff"],
			};
			display(wrapper, face, overrides);
		}
	}, [face, imgURL, teamColors, wrapper]);

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
