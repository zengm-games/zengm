import basketballTemp from "./basketball.json";
import formatScheduledEvents from "./formatScheduledEvents";
import orderBy from "lodash/orderBy";
import type {
	DraftPickWithoutKey,
	GetLeagueOptions,
	ScheduledEventWithoutKey,
	Relative,
} from "../../../common/types";
import { overrides, helpers } from "../../util";

type Ratings = {
	slug: string;
	season: number;
	hgt: number;
	stre: number;
	spd: number;
	jmp: number;
	endu: number;
	ins: number;
	dnk: number;
	ft: number;
	fg: number;
	tp: number;
	diq: number;
	oiq: number;
	drb: number;
	pss: number;
	reb: number;
	abbrev_if_new_row?: string;
};

// Not sure why this is necessary, TypeScript should figure it out automatically
type Basketball = {
	awards: Record<
		string,
		{
			type: string;
			season: number;
		}[]
	>;
	stats: {
		slug: string;
		season: number;
		abbrev: string;
	}[];
	bios: Record<
		string,
		{
			name: string;
			bornYear: number;
			country: string;
			weight: number;
			pos: string;
			height: number;
			college: string;
			draftYear: number;
			draftRound: number;
			draftPick: number;
			draftAbbrev: string;
		}
	>;
	ratings: Ratings[];
	relatives: {
		type: "son" | "brother" | "father";
		slug: string;
		slug2: string;
	}[];
	salaries: {
		slug: string;
		start: number;
		exp: number;
		amount: number;
	}[];
	injuries: {
		slug: string;
		season: number;
		type: string;
		gamesRemaining: number;
	}[];
	scheduledEventsGameAttributes: ScheduledEventWithoutKey[];
	scheduledEventsTeams: ScheduledEventWithoutKey[];
	draftPicks2020: DraftPickWithoutKey[];
	freeAgents: any[];
};

// Convert abbrevs of current or old NBA/BBGM teams to their equivalent team in modern BBGM. This is used to track a franchise over time, if all you have is the abbrev
const oldAbbrevTo2020BBGMAbbrev = (abbrev: string) => {
	const abbrevs = {
		"": null,
		AND: "IND",
		ATL: "ATL",
		BAL: "WAS",
		BLB: "WAS",
		BOS: "BOS",
		BRK: "BKN",
		BUF: "LAC",
		CAP: "WAS",
		CHA: "CHA",
		CHH: "NOL",
		CHI: "CHI",
		CHO: "CHA",
		CHP: "WAS",
		CHS: "CHI",
		CHZ: "WAS",
		CIN: "SAC",
		CLE: "CLE",
		DAL: "DAL",
		DEN: "DEN",
		DET: "DET",
		DNN: "DEN",
		FTW: "DET",
		GSW: "GS",
		HOU: "HOU",
		IND: "IND",
		INO: "IND",
		KCK: "SAC",
		KCO: "SAC",
		LAC: "LAC",
		LAL: "LAL",
		LAS: "LAL",
		MEM: "MEM",
		MIA: "MIA",
		MIL: "MIL",
		MIN: "MIN",
		MLH: "ATL",
		MNL: "LAL",
		NJN: "BKN",
		NOH: "NOL",
		NOJ: "UTA",
		NOK: "NOL",
		NOP: "NOL",
		NYK: "NYC",
		NYN: "BKN",
		OKC: "OKC",
		ORL: "ORL",
		PHI: "PHI",
		PHO: "PHO",
		PHW: "GS",
		POR: "POR",
		ROC: "SAC",
		SAC: "SAC",
		SAS: "SA",
		SDC: "LAC",
		SDR: "HOU",
		SEA: "OKC",
		SFW: "GS",
		SHE: "MIL",
		STL: "ATL",
		SYR: "PHI",
		TOR: "TOR",
		TRI: "ATL",
		UTA: "UTA",
		VAN: "MEM",
		WAS: "WAS",
		WAT: null,
		WSB: "WAS",
		WSC: "WAS",

		// These are BBGM-only ones, which is used for when old seasons of BBGM are compared against new ones
		BKN: "BKN",
		GS: "GS",
		NOL: "NOL",
		NYC: "NYC",
		SA: "SA",
		SD: "SD",
		CHB: "NOL",
		KC: "SAC",
		MLG: "ATL",
		NJ: "BKN",
		NOM: "UTA",
		NYB: "BKN",
		PHV: "GS",
		SDA: "HOU",
	};

	if (abbrevs.hasOwnProperty(abbrev)) {
		// @ts-ignore
		return abbrevs[abbrev];
	}

	throw new Error(`Unknown abbrev "${abbrev}"`);
};

const getLeague = (options: GetLeagueOptions) => {
	if (process.env.SPORT !== "basketball") {
		throw new Error(`Not supported for ${process.env.SPORT}`);
	}

	const basketball = (basketballTemp as unknown) as Basketball;

	let pid = -1;

	const formatPlayer = (
		ratings: Ratings,
		season: number,
		teams: any[],
		{
			draftProspect,
			legends,
			hasQueens,
		}: {
			draftProspect?: boolean;
			legends?: boolean;
			hasQueens?: boolean;
		} = {},
	) => {
		if (!legends) {
			if (draftProspect) {
				if (ratings.season === season) {
					throw new Error(
						"draftProspect should not be true when ratings.season === season",
					);
				}
			} else {
				if (ratings.season !== season) {
					throw new Error(
						"draftProspect should be true when ratings.season !== season",
					);
				}
			}
		}

		const slug = ratings.slug;

		const bio = basketball.bios[slug];
		if (!bio) {
			throw new Error(`No bio found for "${slug}"`);
		}

		let draft;
		if (draftProspect || legends) {
			draft = {
				tid: -1,
				originalTid: -1,
				round: 0,
				pick: 0,
				year: legends ? season - 1 : ratings.season - 1,
			};
		} else {
			let draftTid;
			const draftTeam = teams.find(
				t => oldAbbrevTo2020BBGMAbbrev(t.abbrev) === bio.draftAbbrev,
			);
			if (draftTeam) {
				draftTid = draftTeam.tid;
			} else {
				draftTid = -1;
			}
			draft = {
				tid: draftTid,
				originalTid: draftTid,
				round: bio.draftRound,
				pick: bio.draftPick,
				year: bio.draftYear,
			};
		}

		let tid: number;
		if (draftProspect) {
			tid = -2;
		} else {
			tid = -1;
			const statsRow = basketball.stats.find(
				row => row.slug === slug && row.season === ratings.season,
			);
			const abbrev = statsRow ? statsRow.abbrev : ratings.abbrev_if_new_row;
			if (legends) {
				const team = teams.find(t => {
					if (hasQueens && abbrev === "NOL" && ratings.season < 2003) {
						return oldAbbrevTo2020BBGMAbbrev(t.abbrev) === "CHA";
					}

					return oldAbbrevTo2020BBGMAbbrev(t.abbrev) === abbrev;
				});
				tid = team ? team.tid : -1;
			} else {
				if (abbrev !== undefined) {
					const t = teams.find(
						t => oldAbbrevTo2020BBGMAbbrev(t.abbrev) === abbrev,
					);
					if (t) {
						tid = t.tid;
					}
				}
			}
		}

		let injury;
		let contract;
		let awards;
		if (legends) {
			contract = {
				amount: 6000,
				exp: season + 3,
			};
		} else {
			const injuryRow = basketball.injuries.find(
				injury => injury.season === season && injury.slug === slug,
			);
			if (injuryRow) {
				injury = {
					type: injuryRow.type,
					gamesRemaining: injuryRow.gamesRemaining,
				};
			}

			let salaryRow = basketball.salaries.find(
				row => row.start <= season && row.exp >= season && row.slug === slug,
			);
			if (season === 2020) {
				// For 2020, auto-apply extensions, otherwise will feel weird
				const salaryRowExtension = basketball.salaries.find(
					row => row.start > 2020 && row.slug === slug,
				);
				if (salaryRowExtension) {
					salaryRow = salaryRowExtension;
				}
			}
			if (salaryRow && !draftProspect) {
				contract = {
					amount: salaryRow.amount / 1000,
					exp: salaryRow.exp,
				};
				if (contract.exp > season + 4) {
					// Bound at 5 year contract
					contract.exp = season + 4;
				}
			}

			awards =
				basketball.awards[slug] && !draftProspect
					? basketball.awards[slug].filter(award => award.season < season)
					: undefined;
		}

		// Whitelist, to get rid of any other columns
		const currentRatings = {
			hgt: ratings.hgt,
			stre: ratings.stre,
			spd: ratings.spd,
			jmp: ratings.jmp,
			endu: ratings.endu,
			ins: ratings.ins,
			dnk: ratings.dnk,
			ft: ratings.ft,
			fg: ratings.fg,
			tp: ratings.tp,
			diq: ratings.diq,
			oiq: ratings.oiq,
			drb: ratings.drb,
			pss: ratings.pss,
			reb: ratings.reb,
		};
		if (draftProspect) {
			const decreaseRating = (
				name: keyof typeof currentRatings,
				amount: number,
			) => {
				if (currentRatings[name] > amount) {
					currentRatings[name] -= amount;
				} else {
					currentRatings[name] = 0;
				}
			};

			// Arbitrarily copied from nicidob
			decreaseRating("endu", 5);
			decreaseRating("diq", 4);
			decreaseRating("oiq", 4);
		}

		let bornYear;
		if (legends) {
			const age = ratings.season - bio.bornYear;
			bornYear = season - age;
		} else {
			bornYear = bio.bornYear;
		}

		const name = legends ? `${bio.name} ${ratings.season}` : bio.name;

		pid += 1;

		return {
			pid,
			name,
			pos: bio.pos,
			college: bio.college,
			born: {
				year: bornYear,
				loc: bio.country,
			},
			weight: bio.weight,
			hgt: bio.height,
			tid,
			imgURL: "/img/blank-face.png",
			real: true,
			draft,
			ratings: [currentRatings],
			injury,
			contract,
			awards,
			srID: ratings.slug,
		};
	};

	const addRelatives = (
		players: {
			name: string;
			pid: number;
			srID: string;
			relatives?: Relative[];
		}[],
	) => {
		for (const p of players) {
			const relatives = basketball.relatives.filter(row => row.slug === p.srID);

			const relatives2 = [];
			for (const relative of relatives) {
				const p2 = players.find(p2 => relative.slug2 === p2.srID);
				if (p2) {
					relatives2.push({
						type: relative.type,
						name: p2.name,
						pid: p2.pid,
					});
				}
			}

			if (relatives2.length > 0) {
				p.relatives = relatives2;
			}
		}
	};

	const scheduledEventsAll = [
		...basketball.scheduledEventsGameAttributes,
		...basketball.scheduledEventsTeams,
	];

	if (options.type === "real") {
		const {
			scheduledEvents,
			initialGameAttributes,
			initialTeams,
		} = formatScheduledEvents(scheduledEventsAll, options.season);
		console.log(initialTeams);

		const players = basketball.ratings
			.filter(row => row.season === options.season)
			.map(ratings => formatPlayer(ratings, options.season, initialTeams));

		// Free agents were generated in 2020, so offset
		const numExistingFreeAgents = players.filter(p => p.tid === -1).length;
		if (numExistingFreeAgents < 50) {
			const freeAgents2 = helpers.deepCopy(
				basketball.freeAgents.slice(0, 50 - numExistingFreeAgents),
			);
			for (const p of freeAgents2) {
				let offset = 2020 - options.season;

				// Make them a bit older so they suck
				offset += 5;

				p.born.year -= offset;
				p.draft.year -= offset;
				pid += 1;
				p.pid = pid;
			}
			players.push(...freeAgents2);
		}

		const seenSlugs = new Set();
		const draftProspects = orderBy(basketball.ratings, ["slug", "season"])
			.filter(ratings => {
				// Only keep rookie seasons
				const seen = seenSlugs.has(ratings.slug);
				seenSlugs.add(ratings.slug);
				return !seen;
			})
			.filter(ratings => {
				if (ratings.season <= options.season) {
					return false;
				}

				const bio = basketball.bios[ratings.slug];
				if (!bio) {
					return false;
				}

				// This affects some of alexnoob's players, where they were part of some old draft class and never actually played in the NBA.
				return bio.draftYear > options.season;
			})
			.map(ratings =>
				formatPlayer(ratings, options.season, initialTeams, {
					draftProspect: true,
				}),
			);

		players.push(...draftProspects);

		addRelatives(players);

		const gameAttributes: {
			key: string;
			value: unknown;
		}[] = [
			{
				key: "maxRosterSize",
				value: 17,
			},
		];
		for (const [key, value] of Object.entries(initialGameAttributes)) {
			gameAttributes.push({ key, value });
		}

		if (options.season === 2020) {
			gameAttributes.push({ key: "numSeasonsFutureDraftPicks", value: 7 });
		}

		return {
			version: 37,
			startingSeason: options.season,
			players,
			teams: initialTeams,
			scheduledEvents,
			gameAttributes,
			draftPicks:
				options.season === 2020 ? basketball.draftPicks2020 : undefined,
		};
	} else if (options.type === "legends") {
		const NUM_PLAYERS_PER_TEAM = 15;

		const allTypes = {
			"1950s": {
				start: 1950,
				end: 1959,
			},
			"1960s": {
				start: 1960,
				end: 1969,
			},
			"1970s": {
				start: 1970,
				end: 1979,
			},
			"1980s": {
				start: 1980,
				end: 1989,
			},
			"1990s": {
				start: 1990,
				end: 1999,
			},
			"2000s": {
				start: 2000,
				end: 2009,
			},
			"2010s": {
				start: 2010,
				end: 2019,
			},
			all: {
				start: -Infinity,
				end: 2020,
			},
		};

		const season = allTypes[options.decade].end;
		const { initialGameAttributes, initialTeams } = formatScheduledEvents(
			scheduledEventsAll,
			season,
		);

		const hasQueens = initialTeams.some(t => t.name === "Queens");

		pid = -1;

		let players = orderBy(basketball.ratings, overrides.core.player.ovr, "desc")
			.filter(
				ratings =>
					ratings.season >= allTypes[options.decade].start &&
					ratings.season <= allTypes[options.decade].end,
			)
			.map(ratings =>
				formatPlayer(ratings, season, initialTeams, {
					legends: true,
					hasQueens,
				}),
			)
			.filter(p => p.tid >= 0);

		const keptPlayers = [];
		const numPlayersPerTeam = Array(initialTeams.length).fill(0);
		while (
			players.length > 0 &&
			keptPlayers.length < NUM_PLAYERS_PER_TEAM * initialTeams.length
		) {
			const p = players.shift();
			if (p && numPlayersPerTeam[p.tid] < NUM_PLAYERS_PER_TEAM) {
				keptPlayers.push(p);
				numPlayersPerTeam[p.tid] += 1;

				// Remove other years of this player
				players = players.filter(p2 => p2.srID !== p.srID);
			}
		}

		addRelatives(keptPlayers);

		const freeAgents2 = helpers.deepCopy(basketball.freeAgents);
		for (const p of freeAgents2) {
			let offset = 2020 - season;

			// Make them a bit older so they suck
			offset += 5;

			p.born.year -= offset;
			p.draft.year -= offset;
			pid += 1;
			p.pid = pid;
		}
		keptPlayers.push(...freeAgents2);

		const gameAttributes: {
			key: string;
			value: unknown;
		}[] = [
			{
				key: "maxRosterSize",
				value: 17,
			},
			{
				key: "aiTradesFactor",
				value: 0,
			},
		];

		const ignoreGameAttributes = [
			"salaryCap",
			"luxuryPayroll",
			"minPayroll",
			"minContract",
			"maxContract",
		];
		for (const [key, value] of Object.entries(initialGameAttributes)) {
			if (!ignoreGameAttributes.includes(key)) {
				gameAttributes.push({ key, value });
			}
		}

		return {
			version: 37,
			startingSeason: season,
			players: keptPlayers,
			teams: initialTeams,
			gameAttributes,
		};
	}

	// @ts-ignore
	throw new Error(`Unknown type "${options.type}"`);
};

export default getLeague;
