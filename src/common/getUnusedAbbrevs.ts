import teamInfos from "./teamInfos";

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
		const blacklist = [
			...abbrevs,
			...currentTeams
				.filter(t2 => !disabledTeamsCountAsUnused || !t2.disabled)
				.map(t2 => t2.abbrev),
		];

		// Handle a couple teams with multiple abbrevs
		if (blacklist.includes("LA") && abbrev === "LAL") {
			continue;
		}
		if (blacklist.includes("LAL") && abbrev === "LA") {
			continue;
		}
		if (blacklist.includes("LAC") && abbrev === "LAE") {
			continue;
		}
		if (blacklist.includes("LAE") && abbrev === "LAC") {
			continue;
		}
		if (blacklist.includes("GS") && abbrev === "SF") {
			continue;
		}
		if (blacklist.includes("SF") && abbrev === "GS") {
			continue;
		}

		if (blacklist.includes(abbrev)) {
			continue;
		}

		const currentTeam = currentTeams.find(
			t2 =>
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
