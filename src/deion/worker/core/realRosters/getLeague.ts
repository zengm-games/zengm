import basketballTemp from "./basketball.json";
import formatScheduledEvents from "./formatScheduledEvents";
import orderBy from "lodash/orderBy";
import type {
	DraftPickWithoutKey,
	GetLeagueOptions,
	ScheduledEventWithoutKey,
	Relative,
} from "../../../common/types";

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
		}: {
			draftProspect?: boolean;
		} = {},
	) => {
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

		const slug = ratings.slug;

		const bio = basketball.bios[slug];
		if (!bio) {
			throw new Error(`No bio found for "${slug}"`);
		}

		let draft;
		if (draftProspect) {
			draft = {
				tid: -1,
				originalTid: -1,
				round: 0,
				pick: 0,
				year: ratings.season - 1,
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
				row => row.slug === slug && row.season === season,
			);
			const abbrev = statsRow ? statsRow.abbrev : ratings.abbrev_if_new_row;
			if (abbrev !== undefined) {
				const t = teams.find(
					t => oldAbbrevTo2020BBGMAbbrev(t.abbrev) === abbrev,
				);
				if (t) {
					tid = t.tid;
				}
			}
		}

		const injuryRow = basketball.injuries.find(
			injury => injury.season === season && injury.slug === slug,
		);
		const injury = injuryRow
			? {
					type: injuryRow.type,
					gamesRemaining: injuryRow.gamesRemaining,
			  }
			: undefined;

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
		const contract =
			salaryRow && !draftProspect
				? {
						amount: salaryRow.amount / 1000,
						exp: salaryRow.exp,
				  }
				: undefined;
		if (contract && contract.exp > season + 4) {
			// Bound at 5 year contract
			contract.exp = season + 4;
		}

		const awards =
			basketball.awards[slug] && !draftProspect
				? basketball.awards[slug].filter(award => award.season < season)
				: undefined;

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

		pid += 1;

		return {
			pid,
			name: bio.name,
			pos: bio.pos,
			college: bio.college,
			born: {
				year: bio.bornYear,
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

	if (options.type === "real") {
		const {
			scheduledEvents,
			initialGameAttributes,
			initialTeams,
		} = formatScheduledEvents(
			[
				...basketball.scheduledEventsGameAttributes,
				...basketball.scheduledEventsTeams,
			],
			options.season,
		);
		console.log(initialTeams);

		const players = basketball.ratings
			.filter(row => row.season === options.season)
			.map(ratings => formatPlayer(ratings, options.season, initialTeams));

		console.log("ADD SCRUB FAs");

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
	}

	// @ts-ignore
	throw new Error(`Unknown type "${options.type}"`);
};

export default getLeague;
