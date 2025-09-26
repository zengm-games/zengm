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

	// Round up to a multiple of the number of conferences - so all conferences get the same number of byes
	const extra = numPlayoffByes % byConf;
	return numPlayoffByes + extra;
};
