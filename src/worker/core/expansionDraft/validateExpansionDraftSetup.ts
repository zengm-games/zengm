import { idb } from "../../db";
import { g } from "../../util";

const validateExpansionDraftSetup = async () => {
	const expansionDraft = g.get("expansionDraft");
	if (expansionDraft.phase !== "setup") {
		throw new Error("Invalid expansion draft phase");
	}

	const expansionTeamsRaw = expansionDraft.teams || [];
	const numProtectedPlayersRaw =
		expansionDraft.numProtectedPlayers ||
		String(g.get("minRosterSize") - expansionTeamsRaw.length);

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

	const errorsOutput =
		errors.length > 0 ? Array.from(new Set(errors)) : undefined;

	return {
		errors: errorsOutput,
		expansionTeams,
		numProtectedPlayers,
	};
};

export default validateExpansionDraftSetup;
