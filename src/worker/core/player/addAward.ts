import type { PlayerAward } from "../../../common/types.ts";

const hashAward = (award: PlayerAward) => {
	if (award.type !== undefined) {
		return JSON.stringify([award.season, award.type]);
	}

	const group = award.group;
	const groupPart =
		group?.type === "conf"
			? [group.type, group.cid]
			: group?.type === "div"
				? [group?.type, group.did]
				: [];

	if (award.numTeams === undefined) {
		return JSON.stringify([
			award.season,
			award.name,
			award.shortName,
			award.index,
			award.rank,
			groupPart,
			award.actAs,
		]);
	}

	return JSON.stringify([
		award.season,
		award.name,
		award.shortName,
		award.index,
		award.rank,
		award.numTeams,
		groupPart,
	]);
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
