import type { Face } from "facesjs";
import { useEffect, useState } from "react";
import { displayFace } from "../util";

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
		if (face && (!imgURL || imgURL == "/img/blank-face.png") && wrapper) {
			displayFace({
				colors,
				face,
				jersey,
				wrapper,
			});
		}
	}, [face, imgURL, colors, jersey, wrapper]);

	// Order of player picture preference: (1) non-blank image > (2) Face JS > (3) blank face
	if (imgURL && imgURL !== "/img/blank-face.png") {
		return <img alt="Player" src={imgURL} style={imgStyle} />;
	}

	if (face) {
		return <div ref={setWrapper} />;
	}

	if (imgURL) {
		return <img alt="Player" src={imgURL} style={imgStyle} />;
	}

	return null;
};

export default PlayerPicture;
