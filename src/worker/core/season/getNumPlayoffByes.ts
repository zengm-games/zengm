import type { ByConf } from "../../../common/types.ts";

export const getNumPlayoffByes = ({
	numPlayoffByes,
	byConf,
}: {
	numPlayoffByes: number;
	byConf: ByConf;
}) => {
	if (byConf === false) {
		return numPlayoffByes;
	}

	const extra = numPlayoffByes % byConf;
	if (extra === 0) {
		return numPlayoffByes;
	}

	// Round up to a multiple of the number of conferences - so all conferences get the same number of byes
	return numPlayoffByes + (byConf - extra);
};
