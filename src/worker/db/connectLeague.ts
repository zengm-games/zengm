import { unwrap } from "idb";
import orderBy from "lodash/orderBy";
import { MAX_SUPPORTED_LEAGUE_VERSION, PHASE, PLAYER } from "../../common";
import { player, season } from "../core";
import { idb } from ".";
import iterate from "./iterate";
import { helpers, logEvent } from "../util";
import connectIndexedDB from "./connectIndexedDB";
import type { DBSchema, IDBPDatabase, IDBPTransaction } from "idb";
import type {
	DraftLotteryResult,
	DraftPickWithoutKey,
	ReleasedPlayerWithoutKey,
	AllStars,
	EventBBGMWithoutKey,
	GameAttribute,
	Game,
	MessageWithoutKey,
	Negotiation,
	PlayerFeatWithoutKey,
	PlayerWithoutKey,
	MinimalPlayerRatings,
	PlayoffSeries,
	ScheduleGameWithoutKey,
	TeamSeasonWithoutKey,
	TeamStatsWithoutKey,
	Team,
	Trade,
	ScheduledEventWithoutKey,
} from "../../common/types";

export interface LeagueDB extends DBSchema {
	allStars: {
		key: number;
		value: AllStars;
	};
	awards: {
		key: number;
		value: any;
	};
	draftLotteryResults: {
		key: number;
		value: DraftLotteryResult;
	};
	draftPicks: {
		key: number;
		value: DraftPickWithoutKey;
		autoIncrementKeyPath: "dpid";
	};
	events: {
		key: number;
		value: EventBBGMWithoutKey;
		autoIncrementKeyPath: "eid";
		indexes: {
			pids: number;
			season: number;
		};
	};
	gameAttributes: {
		key: string;
		value: GameAttribute;
	};
	games: {
		key: number;
		value: Game;
		indexes: {
			season: number;
		};
	};
	messages: {
		key: number;
		value: MessageWithoutKey;
		autoIncrementKeyPath: "mid";
	};
	negotiations: {
		key: number;
		value: Negotiation;
	};
	playerFeats: {
		key: number;
		value: PlayerFeatWithoutKey;
		autoIncrementKeyPath: "fid";
	};
	players: {
		key: number;
		value: PlayerWithoutKey<MinimalPlayerRatings>;
		autoIncrementKeyPath: "pid";
		indexes: {
			"draft.year, retiredYear": [number, number];
			statsTids: number;
			tid: number;
		};
	};
	playoffSeries: {
		key: number;
		value: PlayoffSeries;
	};
	releasedPlayers: {
		key: number;
		value: ReleasedPlayerWithoutKey;
		autoIncrementKeyPath: "rid";
	};
	schedule: {
		key: number;
		value: ScheduleGameWithoutKey;
		autoIncrementKeyPath: "gid";
	};
	scheduledEvents: {
		key: number;
		value: ScheduledEventWithoutKey;
		autoIncrementKeyPath: "id";
		indexes: {
			season: number;
		};
	};
	teamSeasons: {
		key: number;
		value: TeamSeasonWithoutKey;
		autoIncrementKeyPath: "rid";
		indexes: {
			"season, tid": [number, number];
			"tid, season": [number, number];
		};
	};
	teamStats: {
		key: number;
		value: TeamStatsWithoutKey;
		autoIncrementKeyPath: "rid";
		indexes: {
			"season, tid": [number, number];
			tid: number;
		};
	};
	teams: {
		key: number;
		value: Team;
	};
	trade: {
		key: number;
		value: Trade;
	};
}

// I did it this way (with the raw IDB API) because I was afraid it would read all players into memory before getting
// the stats and writing them back to the database. Promises/async/await would help, but Firefox before 60 does not like
// that.
const upgrade29 = (tx: IDBTransaction) => {
	let lastCentury = 0; // Iterate over players

	tx.objectStore("players").openCursor().onsuccess = (event: any) => {
		const cursor = event.target.result;

		if (cursor) {
			const p = cursor.value;

			if (!Array.isArray(p.relatives)) {
				p.relatives = [];
			}

			// This can be really slow, so need some UI for progress
			const century = Math.floor(p.draft.year / 100);

			if (century > lastCentury) {
				const text = `Upgrading players drafted in the ${century}00s...`;
				logEvent({
					type: "upgrade",
					text,
					saveToDb: false,
				});
				console.log(text);
				lastCentury = century;
			}

			tx
				.objectStore("playerStats")
				.index("pid, season, tid")
				.getAll(IDBKeyRange.bound([p.pid], [p.pid, ""])).onsuccess = (
				event2: any,
			) => {
				// Index brings them back maybe out of order
				p.stats = orderBy(event2.target.result, ["season", "playoffs", "psid"]);
				cursor.update(p);
				cursor.continue();
			};
		} else {
			// This seems to trigger a memory leak in Chrome, so leave playerStats behind...
			// tx.db.deleteObjectStore("playerStats");
		}
	};
};

const upgrade31 = (tx: IDBTransaction) => {
	tx.objectStore("gameAttributes").get("season").onsuccess = (event: any) => {
		if (event.target.result === undefined) {
			throw new Error("Missing season in gameAttributes during upgrade");
		}

		const season = event.target.result.value;

		if (typeof season !== "number") {
			throw new Error("Invalid season in gameAttributes during upgrade");
		}

		tx.objectStore("gameAttributes").get("phase").onsuccess = (event2: any) => {
			if (event2.target.result === undefined) {
				throw new Error("Missing phase in gameAttributes during upgrade");
			}

			const phase = event2.target.result.value;

			if (typeof phase !== "number") {
				throw new Error("Invalid phase in gameAttributes during upgrade");
			}

			tx.objectStore("draftOrder").get(0).onsuccess = (event3: any) => {
				if (event3.target.result === undefined) {
					throw new Error(
						"Missing draftOrder in gameAttributes during upgrade",
					);
				}

				const draftOrder = event3.target.result.draftOrder;

				if (!Array.isArray(draftOrder)) {
					throw new Error(
						"Invalid draftOrder in gameAttributes during upgrade",
					);
				}

				tx.objectStore("draftPicks").openCursor().onsuccess = (event4: any) => {
					const cursor = event4.target.result;

					if (cursor) {
						const dp = cursor.value;
						dp.pick = 0;
						cursor.update(dp);
						cursor.continue();
					} else {
						for (const dp2 of draftOrder) {
							if (phase === PHASE.FANTASY_DRAFT) {
								dp2.season = "fantasy";
							} else {
								dp2.season = season;
							}

							tx.objectStore("draftPicks").put(dp2);
						}
					}
				};
			};
		};
	};
};

const upgrade33 = (transaction: IDBPTransaction<LeagueDB>) => {
	const tx = unwrap(transaction);
	tx.objectStore("gameAttributes").get("season").onsuccess = (event: any) => {
		if (event.target.result === undefined) {
			throw new Error("Missing season in gameAttributes during upgrade");
		}

		const season = event.target.result.value;

		if (typeof season !== "number") {
			throw new Error("Invalid season in gameAttributes during upgrade");
		}

		tx.objectStore("gameAttributes").get("phase").onsuccess = (event2: any) => {
			if (event2.target.result === undefined) {
				throw new Error("Missing phase in gameAttributes during upgrade");
			}

			const phase = event2.target.result.value;

			if (typeof phase !== "number") {
				throw new Error("Invalid phase in gameAttributes during upgrade");
			}

			const offset = phase >= PHASE.RESIGN_PLAYERS ? 1 : 0;
			iterate(transaction.objectStore("players"), undefined, undefined, p => {
				if (p.tid === PLAYER.UNDRAFTED) {
					const draftYear = season + offset;

					if (p.ratings[0].season !== draftYear || p.draft.year !== draftYear) {
						p.ratings[0].season = draftYear;
						p.draft.year = draftYear;
						return p;
					}
				} else if (p.tid === PLAYER.UNDRAFTED_2) {
					p.tid = PLAYER.UNDRAFTED;
					p.ratings[0].season = season + 1 + offset;
					p.draft.year = p.ratings[0].season;
					return p;
				} else if (p.tid === PLAYER.UNDRAFTED_3) {
					p.tid = PLAYER.UNDRAFTED;
					p.ratings[0].season = season + 2 + offset;
					p.draft.year = p.ratings[0].season;
					return p;
				}
			});
		};
	};
};

const upgrade38 = (transaction: IDBPTransaction<LeagueDB>) => {
	const tx = unwrap(transaction);
	const scheduleStore = tx.objectStore("schedule");
	scheduleStore.getAll().onsuccess = (event: any) => {
		const schedule = event.target.result;

		const updated = season.addDaysToSchedule(schedule);

		scheduleStore.clear().onsuccess = () => {
			for (const game of updated) {
				scheduleStore.put(game);
			}
		};
	};
};

/**
 * Create a new league database with the latest structure.
 *
 * @param {Object} event Event from onupgradeneeded, with oldVersion 0.
 * @param {number} lid Integer league ID number for new league.
 */
const create = (db: IDBPDatabase<LeagueDB>) => {
	// rid ("row id") is used as the keyPath for objects without an innate unique identifier
	db.createObjectStore("awards", {
		keyPath: "season",
	});
	db.createObjectStore("draftPicks", {
		keyPath: "dpid",
		autoIncrement: true,
	});
	const eventStore = db.createObjectStore("events", {
		keyPath: "eid",
		autoIncrement: true,
	});
	db.createObjectStore("gameAttributes", {
		keyPath: "key",
	});
	const gameStore = db.createObjectStore("games", {
		keyPath: "gid",
	});
	db.createObjectStore("messages", {
		keyPath: "mid",
		autoIncrement: true,
	});
	db.createObjectStore("negotiations", {
		keyPath: "pid",
	});
	db.createObjectStore("playerFeats", {
		keyPath: "fid",
		autoIncrement: true,
	});
	const playerStore = db.createObjectStore("players", {
		keyPath: "pid",
		autoIncrement: true,
	});
	db.createObjectStore("playoffSeries", {
		keyPath: "season",
	});
	db.createObjectStore("releasedPlayers", {
		keyPath: "rid",
		autoIncrement: true,
	});
	db.createObjectStore("schedule", {
		keyPath: "gid",
		autoIncrement: true,
	});
	const teamSeasonsStore = db.createObjectStore("teamSeasons", {
		keyPath: "rid",
		autoIncrement: true,
	});
	const teamStatsStore = db.createObjectStore("teamStats", {
		keyPath: "rid",
		autoIncrement: true,
	});
	db.createObjectStore("teams", {
		keyPath: "tid",
	});
	db.createObjectStore("trade", {
		keyPath: "rid",
	});
	db.createObjectStore("draftLotteryResults", {
		keyPath: "season",
	});
	db.createObjectStore("allStars", {
		keyPath: "season",
	});
	eventStore.createIndex("season", "season", {
		unique: false,
	});
	eventStore.createIndex("pids", "pids", {
		unique: false,
		multiEntry: true,
	});
	gameStore.createIndex("season", "season", {
		unique: false,
	});
	playerStore.createIndex(
		"draft.year, retiredYear",
		["draft.year", "retiredYear"],
		{
			unique: false,
		},
	);
	playerStore.createIndex("statsTids", "statsTids", {
		unique: false,
		multiEntry: true,
	});
	playerStore.createIndex("tid", "tid", {
		unique: false,
	});
	teamSeasonsStore.createIndex("season, tid", ["season", "tid"], {
		unique: true,
	});
	teamSeasonsStore.createIndex("tid, season", ["tid", "season"], {
		unique: false,
	});
	teamStatsStore.createIndex("season, tid", ["season", "tid"], {
		unique: false,
	});

	// Not unique because of playoffs
	teamStatsStore.createIndex("tid", "tid", {
		unique: false,
	});

	const scheduledEventsStore = db.createObjectStore("scheduledEvents", {
		keyPath: "id",
		autoIncrement: true,
	});
	scheduledEventsStore.createIndex("season", "season", {
		unique: false,
	});
};

const migrate = ({
	db,
	lid,
	oldVersion,
	transaction,
}: {
	db: IDBPDatabase<LeagueDB>;
	lid: number;
	oldVersion: number;
	transaction: IDBPTransaction<LeagueDB>;
}) => {
	console.log(db, lid, oldVersion, transaction);
	let upgradeMsg = `Upgrading league${lid} database from version ${oldVersion} to version ${db.version}.`;
	let slowUpgradeCalled = false;

	const slowUpgrade = () => {
		if (slowUpgradeCalled) {
			return;
		}

		slowUpgradeCalled = true;
		upgradeMsg += " For large leagues, this can take several minutes or more.";
		console.log(upgradeMsg);
		logEvent({
			type: "upgrade",
			text: upgradeMsg,
			saveToDb: false,
		});
	};

	if (oldVersion <= 15) {
		throw new Error(`League is too old to upgrade (version ${oldVersion})`);
	}

	if (oldVersion <= 16) {
		const teamSeasonsStore = db.createObjectStore("teamSeasons", {
			keyPath: "rid",
			autoIncrement: true,
		});
		const teamStatsStore = db.createObjectStore("teamStats", {
			keyPath: "rid",
			autoIncrement: true,
		});
		teamSeasonsStore.createIndex("tid, season", ["tid", "season"], {
			unique: false,
		});
		teamSeasonsStore.createIndex("season, tid", ["season", "tid"], {
			unique: true,
		});
		teamStatsStore.createIndex("tid", "tid", {
			unique: false,
		});
		teamStatsStore.createIndex("season, tid", ["season", "tid"], {
			unique: false,
		});

		iterate(transaction.objectStore("teams"), undefined, undefined, t => {
			for (const teamStats of (t as any).stats) {
				teamStats.tid = t.tid;

				if (!teamStats.hasOwnProperty("ba")) {
					teamStats.ba = 0;
				}

				teamStatsStore.add(teamStats);
			}

			for (const teamSeason of (t as any).seasons) {
				teamSeason.tid = t.tid;
				teamSeasonsStore.add(teamSeason);
			}

			delete (t as any).stats;
			delete (t as any).seasons;
			return t;
		});
	}

	if (oldVersion <= 17) {
		// This used to upgrade team logos to the new ones, but Firefox
	}

	if (oldVersion <= 18) {
		// Split old single string p.name into two names
		iterate(transaction.objectStore("players"), undefined, undefined, p => {
			if ((p as any).name) {
				const bothNames = (p as any).name.split(" ");
				p.firstName = bothNames[0];
				p.lastName = bothNames[1];
				delete (p as any).name;
			}

			return p;
		});
	}

	if (oldVersion <= 19) {
		// New best records format in awards
		iterate(transaction.objectStore("awards"), undefined, undefined, a => {
			if (a.bre && a.brw) {
				a.bestRecordConfs = [a.bre, a.brw];
				a.bestRecord = a.bre.won >= a.brw.won ? a.bre : a.brw;
				delete a.bre;
				delete a.brw;
				return a;
			}
		});
	}

	if (oldVersion <= 20) {
		// Removing indexes when upgrading to cache version
		transaction.objectStore("draftPicks").deleteIndex("season");
		transaction.objectStore("draftPicks").deleteIndex("tid");
		transaction.objectStore("playerFeats").deleteIndex("pid");
		transaction.objectStore("playerFeats").deleteIndex("tid");
		transaction.objectStore("players").deleteIndex("draft.year");
		transaction.objectStore("players").deleteIndex("retiredYear");
		transaction.objectStore("releasedPlayers").deleteIndex("tid");
		transaction.objectStore("releasedPlayers").deleteIndex("contract.exp");
	}

	if (oldVersion <= 21) {
		transaction
			.objectStore("players")
			.createIndex("draft.year, retiredYear", ["draft.year", "retiredYear"], {
				unique: false,
			});
		iterate(transaction.objectStore("players"), undefined, undefined, p => {
			if (p.retiredYear === null || p.retiredYear === undefined) {
				p.retiredYear = Infinity;
				return p;
			}
		});
	}

	if (oldVersion <= 22) {
		db.createObjectStore("draftLotteryResults", {
			keyPath: "season",
		});
	}

	if (oldVersion <= 23) {
		iterate(transaction.objectStore("players"), undefined, undefined, p => {
			for (const r of p.ratings) {
				r.hgt = player.heightToRating(p.hgt);
			}

			return p;
		});
	}

	if (oldVersion <= 24) {
		iterate(transaction.objectStore("teamStats"), undefined, undefined, ts => {
			ts.oppBlk = ts.ba;
			delete ts.ba;
			return ts;
		});
	}

	if (oldVersion <= 25) {
		iterate(transaction.objectStore("games"), undefined, undefined, gm => {
			for (const t of gm.teams) {
				delete t.trb;

				for (const p of t.players) {
					delete p.trb;
				}
			}

			return gm;
		});
		iterate(
			transaction.objectStore("playerStats" as any),
			undefined,
			undefined,
			ps => {
				delete ps.trb;
				return ps;
			},
		);
		iterate(transaction.objectStore("teamStats"), undefined, undefined, ts => {
			delete ts.trb;
			delete ts.oppTrb;
			return ts;
		});
	}

	if (oldVersion <= 26) {
		slowUpgrade();

		// Only non-retired players, for efficiency
		iterate(
			transaction.objectStore("players"),
			undefined,
			undefined,
			(p: any) => {
				for (const r of p.ratings) {
					// Replace blk/stl with diq
					if (typeof r.diq !== "number") {
						if (typeof r.blk === "number" && typeof r.stl === "number") {
							r.diq = Math.round((r.blk + r.stl) / 2);
							delete r.blk;
							delete r.stl;
						} else {
							r.diq = 50;
						}
					}

					// Add oiq
					if (typeof r.oiq !== "number") {
						r.oiq = Math.round((r.drb + r.pss + r.tp + r.ins) / 4);

						if (typeof r.oiq !== "number") {
							r.oiq = 50;
						}
					}

					// Scale ratings
					const ratingKeys = [
						"stre",
						"spd",
						"jmp",
						"endu",
						"ins",
						"dnk",
						"ft",
						"fg",
						"tp",
						"oiq",
						"diq",
						"drb",
						"pss",
						"reb",
					];

					for (const key of ratingKeys) {
						if (typeof r[key] === "number") {
							// 100 -> 80
							// 0 -> 20
							// Linear in between
							r[key] -= (20 * (r[key] - 50)) / 50;
						} else {
							console.log(p);
							throw new Error(`Missing rating: ${key}`);
						}
					}

					r.ovr = player.ovr(r);
					r.skills = player.skills(r);

					// Don't want to deal with bootstrapPot now being async
					r.pot = r.ovr;

					if (p.draft.year === r.season) {
						p.draft.ovr = r.ovr;
						p.draft.skills = r.skills;
						p.draft.pot = r.pot;
					}
				}

				if (!Array.isArray(p.relatives)) {
					p.relatives = [];
				}

				return p;
			},
		);
	}

	if (oldVersion <= 27) {
		iterate(
			transaction.objectStore("teamSeasons"),
			undefined,
			undefined,
			teamSeason => {
				if (typeof teamSeason.stadiumCapacity !== "number") {
					teamSeason.stadiumCapacity = 25000;
					return teamSeason;
				}
			},
		);
	}

	if (oldVersion <= 28) {
		slowUpgrade();
		upgrade29(unwrap(transaction));
	}

	if (oldVersion === 29) {
		// === rather than <= is to prevent the 30 and 27/29 upgrades from having a race condition on updating players
		iterate(transaction.objectStore("players"), undefined, undefined, p => {
			if (!Array.isArray(p.relatives)) {
				p.relatives = [];
				return p;
			}
		});
	}

	if (oldVersion <= 30) {
		upgrade31(unwrap(transaction));
	}

	if (oldVersion <= 31) {
		// Gets need to use raw IDB API because Firefox < 60
		const tx = unwrap(transaction);

		tx.objectStore("gameAttributes").get("difficulty").onsuccess = (
			event: any,
		) => {
			let difficulty =
				event.target.result !== undefined
					? event.target.result.value
					: undefined;

			if (typeof difficulty === "number") {
				// Migrating from initial test implementation
				difficulty -= 0.5;
			} else {
				difficulty = 0;
			}

			tx.objectStore("gameAttributes").put({
				key: "difficulty",
				value: difficulty,
			});

			unwrap(idb.meta.transaction("leagues").objectStore("leagues")).get(
				lid,
			).onsuccess = (event2: any) => {
				const l = event2.target.result;
				l.difficulty = difficulty;
				idb.meta.put("leagues", l);
			};
		};
	}

	if (oldVersion <= 32) {
		upgrade33(transaction);
	}

	if (oldVersion <= 33) {
		db.createObjectStore("allStars", {
			keyPath: "season",
		});
	}

	if (oldVersion <= 34) {
		const teamsDefault = helpers.getTeamsDefault();
		iterate(transaction.objectStore("teams"), undefined, undefined, t => {
			if (!(t as any).colors) {
				if (
					(teamsDefault as any)[t.tid] &&
					teamsDefault[t.tid].region === t.region &&
					teamsDefault[t.tid].name === t.name
				) {
					t.colors = teamsDefault[t.tid].colors;
				} else {
					t.colors = ["#000000", "#cccccc", "#ffffff"];
				}

				return t;
			}
		});
	}

	if (oldVersion <= 35) {
		slowUpgrade();
		iterate(transaction.objectStore("players"), undefined, undefined, p => {
			if (!(p as any).injuries) {
				p.injuries = [];
				return p;
			}
		});
	}

	if (oldVersion <= 36) {
		const scheduledEventsStore = db.createObjectStore("scheduledEvents", {
			keyPath: "id",
			autoIncrement: true,
		});
		scheduledEventsStore.createIndex("season", "season", {
			unique: false,
		});
	}

	if (oldVersion <= 37) {
		upgrade38(transaction);
	}

	if (oldVersion <= 38) {
		slowUpgrade();

		let lastCentury = 0; // Iterate over players

		iterate(transaction.objectStore("players"), undefined, undefined, p => {
			// This can be really slow, so need some UI for progress
			const century = Math.floor(p.draft.year / 100);
			if (century > lastCentury) {
				const text = `Upgrading players drafted in the ${century}00s...`;
				logEvent({
					type: "upgrade",
					text,
					saveToDb: false,
				});
				console.log(text);
				lastCentury = century;
			}

			delete (p as any).freeAgentMood;
			p.moodTraits = player.genMoodTraits();
			p.numDaysFreeAgent = 0;
			return p;
		});
		iterate(
			transaction.objectStore("teamSeasons"),
			undefined,
			undefined,
			teamSeason => {
				teamSeason.numPlayersTradedAway = 0;
				return teamSeason;
			},
		);
	}

	// Next time I need to do an upgrade, would be nice to finalize obsolete gameAttributes (see types.js) - would require coordination with league import
};

const connectLeague = (lid: number) =>
	connectIndexedDB<LeagueDB>({
		name: `league${lid}`,
		version: MAX_SUPPORTED_LEAGUE_VERSION,
		lid,
		create,
		migrate,
	});

export default connectLeague;
