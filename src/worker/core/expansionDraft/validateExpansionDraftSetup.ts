import { idb } from "../../db";
import { g, helpers } from "../../util";

const validateExpansionDraftSetup = async () => {
	const expansionDraft = g.get("expansionDraft");
	if (expansionDraft.phase !== "setup") {
		throw new Error("Invalid expansion draft phase");
	}

	const expansionTeamsRaw = expansionDraft.teams ?? [];
	const numProtectedPlayersRaw =
		expansionDraft.numProtectedPlayers ??
		String(g.get("minRosterSize") - expansionTeamsRaw.length);
	const numPerTeamMinimum = helpers.getExpansionDraftMinimumPlayersPerActiveTeam(
		expansionTeamsRaw.length,
		g.get("minRosterSize"),
		g.get("numActiveTeams"),
	);
	const numPerTeamRaw =
		expansionDraft.numPerTeam ??
		expansionDraft.numPerTeam ??
		String(numPerTeamMinimum);

	const errors = [];
	const teams = await idb.cache.teams.getAll();
	const divs = await g.get("divs");

	// Do some error checking
	const expansionTeams = expansionTeamsRaw.map(t => {
		if (t.imgURL === "") {
			t.imgURL = undefined;
		}

		if (t.abbrev === "") {
			errors.push(`Abbrev cannot be blank`);
		} else {
			if (t.name === "") {
				errors.push(`Blank team name for ${t.abbrev}`);
			}
			if (t.region === "") {
				errors.push(`Blank team region for ${t.abbrev}`);
			}
		}

		const pop = parseFloat(t.pop);
		if (Number.isNaN(pop)) {
			errors.push(`Invalid population for ${t.abbrev}`);
		}

		let stadiumCapacity;
		if (t.stadiumCapacity === undefined) {
			stadiumCapacity = g.get("defaultStadiumCapacity");
		} else {
			const stadiumCapacity = parseInt(t.stadiumCapacity);
			if (Number.isNaN(stadiumCapacity)) {
				errors.push(`Invalid stadium capacity for ${t.abbrev}`);
			}
		}

		const did = parseInt(t.did);
		let foundDiv = false;
		for (const div of divs) {
			if (did === div.did) {
				foundDiv = true;
				break;
			}
		}
		if (!foundDiv) {
			errors.push(`Invalid division for ${t.abbrev}`);
		}

		let abbrevGood = false;
		const originalAbbrev = t.abbrev;
		let counter = 1;
		while (!abbrevGood) {
			abbrevGood = true;
			for (const t2 of teams) {
				const isReactivating = t.tid === t2.tid && !!t2.disabled;
				if (t2.abbrev === t.abbrev && !isReactivating) {
					counter += 1;
					t.abbrev = `${originalAbbrev}${counter}`;
					abbrevGood = false;
				}
			}

			for (const t2 of expansionTeamsRaw) {
				if (t !== t2 && t2.abbrev === t.abbrev) {
					counter += 1;
					t.abbrev = `${originalAbbrev}${counter}`;
					abbrevGood = false;
				}
			}
		}

		return {
			...t,
			did,
			pop,
			stadiumCapacity,
		};
	});

	if (expansionTeams.length === 0) {
		errors.push("No expansion teams");
	}

	const numProtectedPlayers = parseInt(numProtectedPlayersRaw);
	if (Number.isNaN(numProtectedPlayers) || numProtectedPlayers < 0) {
		errors.push("Invalid number of protected players");
	}

	const numPerTeam = parseInt(numPerTeamRaw);
	if (Number.isNaN(numPerTeam)) {
		errors.push("Invalid number of draftable players per existing team");
	} else if (numPerTeam < numPerTeamMinimum) {
		errors.push(
			`Number of draftable players per existing team must be at least ${numPerTeamMinimum} or there won't be enough available players`,
		);
	}

	const errorsOutput =
		errors.length > 0 ? Array.from(new Set(errors)) : undefined;

	return {
		errors: errorsOutput,
		expansionTeams,
		numPerTeam,
		numProtectedPlayers,
	};
};

export default validateExpansionDraftSetup;
