import type { FaceConfig } from "facesjs";
import { MyFace } from "./MyFace.tsx";

const imgStyle = {
	maxHeight: "100%",
	maxWidth: "100%",
};

const PlayerPicture = ({
	colors,
	face,
	imgURL,
	jersey,
	lazy,
}: {
	colors?: [string, string, string];
	face?: FaceConfig;
	imgURL?: string;
	jersey?: string;
	lazy?: boolean;
}) => {
	if (imgURL) {
		return <img alt="Player" src={imgURL} style={imgStyle} />;
	}

	if (face) {
		return <MyFace colors={colors} face={face} jersey={jersey} lazy={lazy} />;
	}

	return null;
};

export default PlayerPicture;
