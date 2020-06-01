import teamInfos from "./teamInfos";

const getTeamInfos = (
	teams: { tid: number; cid: number; did: number; abbrev: string }[],
) => {
	return teams.map(t => {
		if (!teamInfos[t.abbrev]) {
			throw new Error(`Unknown abbrev: ${t.abbrev}`);
		}

		return {
			...t,
			...teamInfos[t.abbrev],
			imgURL: `/img/logos/${t.abbrev}.png`,
		};
	});
};

export default getTeamInfos;
