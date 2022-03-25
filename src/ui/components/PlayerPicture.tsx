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
		if (face && !imgURL && wrapper) {
			displayFace({
				colors,
				face,
				jersey,
				wrapper,
			});
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

export default PlayerPicture;
