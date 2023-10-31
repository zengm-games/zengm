import type { PlayerAward } from "../../../common/types";

const hashAward = (award: PlayerAward) => {
	return JSON.stringify([award.season, award.type]);
};

const addAward = (
	p: {
		awards: PlayerAward[];
	},
	award: PlayerAward,
) => {
	const hash = hashAward(award);

	for (const award of p.awards) {
		if (hashAward(award) === hash) {
			// Don't add the same award twice, in case some weird situation leads to that happening
			return;
		}
	}

	p.awards.push(award);
};

export default addAward;
