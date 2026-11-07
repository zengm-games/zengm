import teamInfos from "./teamInfos.ts";
import { abbrevRewrites } from "./getTeamInfos.ts";

const getUnusedAbbrevs = (
	currentTeams: {
		abbrev: string;
		region: string;
		name: string;
		disabled?: boolean;
	}[],
	disabledTeamsCountAsUnused: boolean = false,
): string[] => {
	const abbrevs: string[] = [];
	for (const [abbrev, t] of Object.entries(teamInfos)) {
		const blacklist = new Set(
			[
				...abbrevs,
				...currentTeams
					.filter((t2) => !disabledTeamsCountAsUnused || !t2.disabled)
					.map((t2) => t2.abbrev),
			].map((abbrev2) => abbrevRewrites[abbrev2] ?? abbrev2),
		);

		if (blacklist.has(abbrev)) {
			continue;
		}

		const currentTeam = currentTeams.find(
			(t2) =>
				t2.region === t.region &&
				t2.name === t.name &&
				(!disabledTeamsCountAsUnused || !t2.disabled),
		);
		if (currentTeam) {
			continue;
		}

		abbrevs.push(abbrev);
	}
	return abbrevs;
};

export default getUnusedAbbrevs;
