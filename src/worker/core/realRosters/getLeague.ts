import loadDataBasketball from "./loadData.basketball";
import formatScheduledEvents from "./formatScheduledEvents";
import orderBy from "lodash/orderBy";
import type {
	GetLeagueOptions,
	Relative,
	DraftPickWithoutKey,
} from "../../../common/types";
import type { Ratings } from "./loadData.basketball";
import oldAbbrevTo2020BBGMAbbrev from "./oldAbbrevTo2020BBGMAbbrev";
import { helpers, random } from "../../util";
import { PLAYER } from "../../../common";
import { player } from "..";
import { legendsInfo } from "./getLeagueInfo";

const getOnlyRatings = (ratings: Ratings) => {
	return {
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
};

const nerfDraftProspect = (ratings: {
	endu: number;
	diq: number;
	oiq: number;
}) => {
	const decreaseRating = (name: keyof typeof ratings, amount: number) => {
		if (ratings[name] > amount) {
			ratings[name] -= amount;
		} else {
			ratings[name] = 0;
		}
	};

	// Arbitrarily copied from nicidob
	decreaseRating("endu", 5);
	decreaseRating("diq", 4);
	decreaseRating("oiq", 4);
};

const getLeague = async (options: GetLeagueOptions) => {
	if (process.env.SPORT !== "basketball") {
		throw new Error(`Not supported for ${process.env.SPORT}`);
	}

	const basketball = await loadDataBasketball();

	let pid = -1;

	const formatPlayer = (
		ratings: Ratings,
		season: number,
		teams: any[],
		{
			draftProspect,
			legends,
			hasQueens,
			randomDebuts,
		}: {
			draftProspect?: boolean;
			legends?: boolean;
			hasQueens?: boolean;
			randomDebuts?: boolean;
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
			tid = PLAYER.UNDRAFTED;
		} else {
			tid = PLAYER.FREE_AGENT;
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
				tid = team ? team.tid : PLAYER.FREE_AGENT;
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

		if (tid >= PLAYER.FREE_AGENT && !draftProspect) {
			// Ensure draft year is before the current season, because for some players like Irv Rothenberg this is not true
			if (draft.year >= season) {
				draft = {
					tid: -1,
					originalTid: -1,
					round: 0,
					pick: 0,
					year: season - 1,
				};
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
		} else if (!randomDebuts) {
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

			const allAwards = basketball.awards[slug];

			awards =
				allAwards && !draftProspect
					? helpers.deepCopy(allAwards.filter(award => award.season < season))
					: undefined;
		}

		// Whitelist, to get rid of any other columns
		const currentRatings = getOnlyRatings(ratings);
		if (draftProspect) {
			nerfDraftProspect(currentRatings);
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

		const players = basketball.ratings
			.filter(row => row.season === options.season)
			.map(ratings => formatPlayer(ratings, options.season, initialTeams));

		// Free agents were generated in 2020, so offset
		const numExistingFreeAgents = players.filter(
			p => p.tid === PLAYER.FREE_AGENT,
		).length;
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
			.filter(ratings => ratings.season > options.season)
			.map(ratings =>
				formatPlayer(ratings, options.season, initialTeams, {
					draftProspect: true,
				}),
			);

		players.push(...draftProspects);

		addRelatives(players);

		if (options.randomDebuts) {
			const toRandomize = players.filter(p => p.tid !== PLAYER.FREE_AGENT);

			const draftYears = toRandomize.map(p => p.draft.year);
			random.shuffle(draftYears);

			const tids = toRandomize.filter(p => p.tid >= 0).map(p => p.tid);
			random.shuffle(tids);

			for (let i = 0; i < toRandomize.length; i++) {
				const p = toRandomize[i];
				const diff = draftYears[i] - p.draft.year;
				p.draft.year = draftYears[i];
				p.born.year += diff;

				if (p.draft.year < options.season) {
					// Active player on a team
					const tid = tids.pop();
					if (tid === undefined) {
						throw new Error("Not enough tids");
					}

					p.tid = tid;

					const targetRatingsSeason = options.season - diff;

					const rows = basketball.ratings.filter(row => row.slug === p.srID);
					if (rows.length === 0) {
						throw new Error(`No ratings found for "${p.srID}"`);
					}

					// If possible, use ratings from exact age
					let ratings = rows.find(row => row.season === targetRatingsSeason);

					// Otherwise, find closest
					if (!ratings) {
						const sorted = orderBy(
							rows,
							row => Math.abs(row.season - targetRatingsSeason),
							"asc",
						);
						ratings = sorted[0];
					}

					p.ratings = [getOnlyRatings(ratings)];
				} else {
					// Draft prospect
					p.tid = PLAYER.UNDRAFTED;

					const rookieRatings = basketball.ratings.find(
						row => row.slug === p.srID,
					);
					if (!rookieRatings) {
						throw new Error(`No ratings found for "${p.srID}"`);
					}
					const ratings = getOnlyRatings(rookieRatings);
					nerfDraftProspect(ratings);
					p.ratings = [ratings];
				}
			}
		}

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

		if (options.season === 2020 && !options.randomDebuts) {
			gameAttributes.push({ key: "numSeasonsFutureDraftPicks", value: 7 });
		}

		let draftPicks: DraftPickWithoutKey[] | undefined;
		if (options.season === 2020 && !options.randomDebuts) {
			draftPicks = helpers.deepCopy(basketball.draftPicks2020).map(dp => {
				const t = initialTeams.find(
					t => oldAbbrevTo2020BBGMAbbrev(t.abbrev) === dp.abbrev,
				);
				if (!t) {
					throw new Error(`Team not found for draft pick abbrev ${dp.abbrev}`);
				}
				const t2 = initialTeams.find(
					t => oldAbbrevTo2020BBGMAbbrev(t.abbrev) === dp.originalAbbrev,
				);
				if (!t2) {
					throw new Error(
						`Team not found for draft pick abbrev ${dp.originalAbbrev}`,
					);
				}

				return {
					tid: t.tid,
					originalTid: t2.tid,
					round: dp.round,
					pick: dp.pick,
					season: dp.season,
				};
			});
		}

		return {
			version: 37,
			startingSeason: options.season,
			players,
			teams: initialTeams,
			scheduledEvents,
			gameAttributes,
			draftPicks,
		};
	} else if (options.type === "legends") {
		const NUM_PLAYERS_PER_TEAM = 15;

		const season = legendsInfo[options.decade].end;
		const { initialGameAttributes, initialTeams } = formatScheduledEvents(
			scheduledEventsAll,
			season,
		);

		const hasQueens = initialTeams.some(t => t.name === "Queens");

		pid = -1;

		let players = orderBy(
			basketball.ratings,
			ratings => player.ovr(ratings as any),
			"desc",
		)
			.filter(
				ratings =>
					ratings.season >= legendsInfo[options.decade].start &&
					ratings.season <= legendsInfo[options.decade].end,
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
