const choice = x => {
	return x[Math.floor(Math.random() * x.length)];
};

const MOOD_TRAIT_KEYS = ["F", "L", "$", "W"];

const genMoodTraits = () => {
	const moodTraits = [choice(MOOD_TRAIT_KEYS)];
	if (Math.random() < 0.5) {
		moodTraits.push(
			choice(MOOD_TRAIT_KEYS.filter(trait => trait !== moodTraits[0])),
		);
	}
	moodTraits.sort();

	return moodTraits;
};

const logDiv = document.getElementById("status");
const log = text => {
	logDiv.innerHTML += `${text}<br>`;
};

const upgrade1000 = async (db, lastPidInput, lastDraftYearInput) => {
	log(
		lastPidInput !== undefined
			? `Upgrading next 1000 players, starting with ${lastPidInput} from draft year ${lastDraftYearInput}...`
			: "Upgrading first 1000 players...",
	);

	const tx = db.transaction("players", "readwrite");

	const range =
		lastPidInput === undefined
			? undefined
			: IDBKeyRange.lowerBound(lastPidInput);

	let cursor = await tx.store.openCursor(range);
	let numDone = 0;
	let doneAllPlayers = true;
	let lastPid = undefined;
	let lastDraftYear = undefined;
	while (cursor) {
		const p = cursor.value;
		if (!p.moodTraits) {
			delete p.freeAgentMood;
			p.moodTraits = genMoodTraits();
			p.numDaysFreeAgent = 0;
			cursor.update(p);
			numDone += 1;

			lastPid = p.pid;
			lastDraftYear = p.draft.year;
		}

		if (numDone >= 1000) {
			doneAllPlayers = false;
			break;
		}

		cursor = await cursor.continue();
	}

	await tx.done;

	return {
		doneAllPlayers,
		lastPid,
		lastDraftYear,
	};
};

const upgradeTeamSeasons = async db => {
	log("Upgrading teamSeasons...");
	const tx = db.transaction("teamSeasons", "readwrite");

	let cursor = await tx.store.openCursor();
	while (cursor) {
		const teamSeason = cursor.value;
		if (typeof teamSeason.numPlayersTradedAway !== "number") {
			teamSeason.numPlayersTradedAway = 0;
			cursor.update(teamSeason);
		}
		cursor = await cursor.continue();
	}

	await tx.done;
};

const initForm = async () => {
	const dbMeta = await idb.openDB("meta", 8);

	const leagues = await dbMeta.getAll("leagues");

	const leagueSelect = document.getElementById("league");

	for (const league of leagues) {
		const option = document.createElement("option");
		option.appendChild(
			document.createTextNode(`${league.lid}: ${league.name}`),
		);
		option.value = league.lid;
		leagueSelect.appendChild(option);
	}

	document.getElementById("form").addEventListener("submit", async event => {
		event.preventDefault();

		const lid = parseInt(leagueSelect.value);

		log(`Attempting to connect to league ${lid}`);
		const db = await idb.openDB(`league${lid}`, 39);
		log("Connected!");

		log("Upgrading players...");
		let doneAllPlayers = false;
		let lastPid;
		let lastDraftYear;
		while (!doneAllPlayers) {
			const output = await upgrade1000(db, lastPid, lastDraftYear);
			doneAllPlayers = output.doneAllPlayers;
			lastPid = output.lastPid;
			lastDraftYear = output.lastDraftYear;
		}
		log("Done!");

		await upgradeTeamSeasons(db);
		log("Done!");
		log(
			"You should now be able to play your league like normal. Sorry for the trouble!",
		);
	});
};

initForm();
