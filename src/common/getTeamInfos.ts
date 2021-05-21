import teamInfos from "./teamInfos";

export const noSmallLogo = ["BOS", "DET", "LAE", "VAN"];

export const abbrevRewrites: Record<string, string | undefined> = {
	LAC: "LAE",
	LAL: "LA",
	GS: "SF",
};

const getTeamInfos = (
	teams: { tid: number; cid: number; did: number; abbrev: string }[],
) => {
	return teams.map(t => {
		const actualAbbrev = abbrevRewrites[t.abbrev] ?? t.abbrev;

		if (!teamInfos[actualAbbrev]) {
			throw new Error(`Unknown abbrev: ${actualAbbrev}`);
		}

		const info: {
			tid: number;
			cid: number;
			did: number;
			abbrev: string;
			region: string;
			name: string;
			pop: number;
			colors: [string, string, string];
			jersey: string;
			imgURL: string;
			imgURLSmall?: string;
		} = {
			...t,
			...teamInfos[actualAbbrev],
			imgURL: `/img/logos-primary/${actualAbbrev}.svg`,
		};

		if (!noSmallLogo.includes(actualAbbrev)) {
			info.imgURLSmall = `/img/logos-secondary/${actualAbbrev}.svg`;
		}

		return info;
	});
};

export default getTeamInfos;
