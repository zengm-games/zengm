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

		for (const key of ["hof", "watch"]) {
			if (p[key]) {
				p[key] = 1;
			} else {
				delete p[key];
			}
		}

		if (p.note) {
			p.noteBool = 1;
		} else {
			delete p.note;
		}

		cursor.update(p);
		numDone += 1;
		lastPid = p.pid;
		lastDraftYear = p.draft.year;

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
		const db = await idb.openDB(`league${lid}`, 50, {
			async upgrade(db, oldVersion, newVerison, transaction) {
				log("Creating new indexes...");
				const playerStore = transaction.objectStore("players");

				if (oldVersion <= 48) {
					playerStore.createIndex("hof", "hof", {
						unique: false,
					});
				}
				playerStore.createIndex("noteBool", "noteBool", {
					unique: false,
				});
				playerStore.createIndex("watch", "watch", {
					unique: false,
				});
			},
		});
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

		log(
			"You should now be able to play your league like normal. Sorry for the trouble!",
		);
	});
};

initForm();
