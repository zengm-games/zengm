import loadStatsBasketball, {
	type BasketballStats,
} from "./loadStats.basketball";
import { PHASE, PLAYER } from "../../../common";
import type {
	GetLeagueOptions,
	PlayerContract,
	PlayerInjury,
} from "../../../common/types";
import { LATEST_SEASON } from "./getLeague";
import getOnlyRatings from "./getOnlyRatings";
import type { Basketball, Ratings } from "./loadData.basketball";
import nerfDraftProspect from "./nerfDraftProspect";
import oldAbbrevTo2020BBGMAbbrev from "./oldAbbrevTo2020BBGMAbbrev";
import setDraftProspectRatingsBasedOnDraftPosition from "./setDraftProspectRatingsBasedOnDraftPosition";
import { getEWA } from "../../util/advStats.basketball";
import { averageSalary } from "./averageSalary";
import { helpers } from "../../util";

const MINUTES_PER_GAME = 48;

const hasPhoto = ["seemebo01"];

const formatPlayerFactory = async (
	basketball: Basketball,
	options: GetLeagueOptions,
	season: number,
	teams: {
		tid: number;
		srID?: string;
	}[],
	initialPid: number,
) => {
	let pid = initialPid;

	let basketballStats: BasketballStats | undefined;
	if (options.type === "real" && options.realStats !== "none") {
		basketballStats = await loadStatsBasketball();
	}

	const tidCache: Record<string, number | undefined> = {};
	const getTidNormal = (abbrev?: string): number | undefined => {
		if (abbrev === undefined) {
			return;
		}
		if (Object.hasOwn(tidCache, abbrev)) {
			return tidCache[abbrev];
		}

		const t = teams.find(
			t => t.srID !== undefined && oldAbbrevTo2020BBGMAbbrev(t.srID) === abbrev,
		);

		const tid = t?.tid;

		tidCache[abbrev] = tid;

		return tid;
	};

	return (
		ratingsInput: Ratings[] | Ratings,
		{
			draftProspect,
			hasQueens,
		}: {
			draftProspect?: boolean;
			hasQueens?: boolean;
		} = {},
	) => {
		const allRatings = Array.isArray(ratingsInput)
			? ratingsInput
			: [ratingsInput];

		const ratings = allRatings.at(-1)!;

		const slug = ratings.slug;

		const bio = basketball.bios[slug];
		if (!bio) {
			throw new Error(`No bio found for "${slug}"`);
		}

		// For alexnoob draft prospects who already have their draft ratings set for the correct season, as opposed to other rookies who need them set based on their rookie ratings
		const draftRatingsAlreadySet = bio.draftYear === ratings.season;

		const legends = options.type === "legends";

		let draft;
		if (draftProspect || legends) {
			draft = {
				tid: -1,
				originalTid: -1,
				round: 0,
				pick: 0,
				year: legends
					? season - 1
					: draftRatingsAlreadySet
					? ratings.season
					: ratings.season - 1,
			};
		} else {
			let draftTid;
			const draftTeam = teams.find(
				t =>
					t.srID !== undefined &&
					oldAbbrevTo2020BBGMAbbrev(t.srID) === bio.draftAbbrev,
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
		let jerseyNumber: string | undefined;
		if (ratings.retiredUntil !== undefined) {
			tid = PLAYER.RETIRED;
		} else if (draftProspect) {
			tid = PLAYER.UNDRAFTED;
		} else if (!legends && ratings.season < season) {
			tid = PLAYER.RETIRED;
		} else {
			tid = PLAYER.FREE_AGENT;
			let statsRow;
			if (options.type === "real" && options.phase >= PHASE.PLAYOFFS) {
				// Search backwards - last team a player was on that season
				for (let i = basketball.teams.length - 1; i >= 0; i--) {
					const row = basketball.teams[i];
					if (
						row.slug === slug &&
						row.season === ratings.season &&
						(row.phase === undefined || options.phase >= row.phase)
					) {
						statsRow = row;
						break;
					}
				}
			} else {
				// Search forwards - first team a player was on that season
				statsRow = basketball.teams.find(
					row => row.slug === slug && row.season === ratings.season,
				);
			}
			const abbrev = statsRow ? statsRow.abbrev : ratings.abbrev_if_new_row;

			if (statsRow) {
				jerseyNumber = statsRow.jerseyNumber;
			}

			if (legends) {
				const team = teams.find(t => {
					if (hasQueens && abbrev === "NOL" && ratings.season < 2003) {
						return (
							t.srID !== undefined &&
							oldAbbrevTo2020BBGMAbbrev(t.srID) === "CHA"
						);
					}

					return (
						t.srID !== undefined && oldAbbrevTo2020BBGMAbbrev(t.srID) === abbrev
					);
				});
				tid = team ? team.tid : PLAYER.FREE_AGENT;
			} else {
				const newTid = getTidNormal(abbrev);
				if (newTid !== undefined) {
					tid = newTid;
				}
			}
		}

		if (jerseyNumber === undefined && tid !== PLAYER.RETIRED) {
			// Fallback (mostly for draft prospects) - pick first number in database
			const statsRow2 = basketball.teams.find(row => row.slug === slug);
			if (statsRow2) {
				jerseyNumber = statsRow2.jerseyNumber;
			}
		}

		if (tid >= PLAYER.FREE_AGENT && !draftProspect) {
			// Ensure draft year is before the current season, because for some players like Irv Rothenberg this is not true
			if (
				draft.year > season ||
				(draft.year === season &&
					(options.type === "legends" || options.phase <= PHASE.DRAFT))
			) {
				draft = {
					tid: -1,
					originalTid: -1,
					round: 0,
					pick: 0,
					year: season - 1,
				};
			}
		}

		let contract: PlayerContract | undefined;
		let awards;
		let salaries;
		if (options.type === "legends") {
			contract = {
				amount: 6000,
				exp: season + 3,
			};
		} else if (!options.randomDebuts || options.randomDebutsKeepCurrent) {
			const salaryRows = basketball.salaries.filter(row => {
				if (row.slug !== slug) {
					return false;
				}

				// Auto-apply extensions, otherwise will feel weird
				if (season >= LATEST_SEASON) {
					return true;
				}

				return row.start <= season;
			});

			if (salaryRows.length > 0 && !draftProspect) {
				// Complicated stuff rather than just taking last entry because these can be out of order, particularly due to merging data sources. But still search backwards
				let salaryRow;
				for (let i = salaryRows.length - 1; i >= 0; i--) {
					const row = salaryRows[i];

					if (row.start <= season && row.exp >= season) {
						salaryRow = row;
						break;
					}
				}
				if (season >= LATEST_SEASON) {
					// Auto-apply extensions, otherwise will feel weird
					const salaryRowExtension = salaryRows.find(row => row.start > season);
					if (salaryRowExtension) {
						salaryRow = salaryRowExtension;
					}
				}

				if (salaryRow) {
					// Bound at 5 year contract
					const exp = Math.min(salaryRow.exp, season + 4);
					contract = {
						amount: averageSalary(salaryRow, season, exp),
						exp,
					};

					if (salaryRow.start === draft.year + 1) {
						contract.rookie = true;
					}
				}

				const maxSalaryHistorySeason = contract?.exp ?? season - 1;
				salaries = [];
				for (const row of salaryRows) {
					const maxSeason = Math.min(row.exp, maxSalaryHistorySeason);

					for (let season2 = row.start; season2 <= maxSeason; season2++) {
						if (contract && row === salaryRow && season2 >= season) {
							// Current contract, use averageSalary output from above for current season or later
							salaries.push({
								amount: contract.amount,
								season: season2,
							});
						} else {
							const i = season2 - row.start;

							// Historical salary, use exact value every year
							salaries.push({
								amount: helpers.roundContract(row.amounts[i] / 1000),
								season: season2,
							});
						}
					}
				}
			}

			const allAwards = basketball.awards[slug];

			const awardsCutoffSeason =
				options.type === "real" && options.phase > PHASE.PLAYOFFS
					? season + 1
					: season;
			awards =
				allAwards && !draftProspect
					? helpers.deepCopy(
							allAwards.filter(
								award =>
									award.season < awardsCutoffSeason ||
									(options.type === "real" &&
										options.phase === PHASE.PLAYOFFS &&
										award.season < awardsCutoffSeason + 1 &&
										(award.type.includes("All-Star") ||
											award.type === "Slam Dunk Contest Winner" ||
											award.type === "Three-Point Contest Winner")),
							),
					  )
					: undefined;
		}

		let bornYear;
		if (legends) {
			const age = ratings.season - bio.bornYear;
			bornYear = season - age;
		} else {
			bornYear = bio.bornYear;
		}

		// Whitelist, to get rid of any other columns
		const processedRatings = allRatings.map(row => getOnlyRatings(row, true));

		const addDummyRookieRatings =
			!draftProspect &&
			options.type === "real" &&
			(options.realStats === "all" ||
				options.realStats === "allActive" ||
				options.realStats === "allActiveHOF") &&
			processedRatings[0].season !== draft.year;
		if (addDummyRookieRatings) {
			processedRatings.unshift({
				...processedRatings[0],
				season: draft.year,
			});
		}

		if (draftProspect || addDummyRookieRatings) {
			const currentRatings = processedRatings[0];

			if (!draftRatingsAlreadySet) {
				nerfDraftProspect(currentRatings);
			}

			if (options.type === "real" && options.realDraftRatings === "draft") {
				const age = currentRatings.season! - bornYear;
				setDraftProspectRatingsBasedOnDraftPosition(currentRatings, age, bio);
			}
		}

		const name = legends ? `${bio.name} ${ratings.season}` : bio.name;

		type StatsRow = Omit<
			BasketballStats["stats"][number],
			"slug" | "abbrev" | "playoffs"
		> & {
			playoffs: boolean;
			tid: number;
			minAvailable: number;
			ewa: number;
		};
		let stats: StatsRow[] | undefined;
		if (options.type === "real" && basketballStats) {
			let statsTemp: BasketballStats["stats"] | undefined;

			const statsSeason =
				options.phase > PHASE.REGULAR_SEASON
					? options.season
					: options.season - 1;
			const includePlayoffs = options.phase !== PHASE.PLAYOFFS;

			if (options.realStats === "lastSeason") {
				statsTemp = basketballStats.stats.filter(
					row =>
						row.slug === slug &&
						row.season === statsSeason &&
						(includePlayoffs || !row.playoffs),
				);
			} else if (
				options.realStats === "allActiveHOF" ||
				options.realStats === "allActive" ||
				options.realStats === "all"
			) {
				statsTemp = basketballStats.stats.filter(
					row =>
						row.slug === slug &&
						row.season <= statsSeason &&
						(includePlayoffs || !row.playoffs || row.season < statsSeason),
				);
			}

			if (statsTemp && statsTemp.length > 0) {
				stats = statsTemp.map(row => {
					let tid = getTidNormal(row.abbrev);
					if (tid === undefined) {
						// Team was disbanded
						tid = PLAYER.DOES_NOT_EXIST;
					}

					const newRow: StatsRow = {
						...row,
						playoffs: !!row.playoffs,
						tid,
						minAvailable: (row.gp ?? 0) * MINUTES_PER_GAME,
						ewa: getEWA(row.per ?? 0, row.min ?? 0, bio.pos),
					};
					delete (newRow as any).slug;
					delete (newRow as any).abbrev;

					return newRow;
				});
			}
		}

		const hof: 1 | undefined =
			!!awards &&
			awards.some(award => award.type === "Inducted into the Hall of Fame")
				? 1
				: undefined;
		const diedYear =
			tid === PLAYER.RETIRED && bio.diedYear <= season
				? bio.diedYear
				: undefined;

		let retiredYear;
		if (ratings.retiredUntil !== undefined) {
			const lastNonRetiredSeason = allRatings.findLast(
				row => row.season < ratings.season && row.retiredUntil === undefined,
			);
			if (lastNonRetiredSeason) {
				retiredYear = lastNonRetiredSeason.season;
			} else {
				// Maybe only one ratings row was passed, so we don't have full history - well, it was sometime before this year!
				retiredYear = ratings.season - 1;
			}
		} else {
			retiredYear = tid === PLAYER.RETIRED ? ratings.season : Infinity;
		}

		pid += 1;

		const p = {
			pid,
			name,
			pos: bio.pos,
			college: bio.college,
			born: {
				year: bornYear,
				loc: bio.country,
			},
			diedYear,
			weight: bio.weight,
			hgt: bio.height,
			tid,
			imgURL: hasPhoto.includes(ratings.slug)
				? `/img/players/${ratings.slug}.jpg`
				: "/img/blank-face.png",
			real: true,
			draft,
			ratings: processedRatings,
			stats,
			injury: undefined as PlayerInjury | undefined,
			contract,
			salaries,
			awards,
			jerseyNumber,
			hof,
			retiredYear,
			srID: ratings.slug,
		};

		if (!p.hof) {
			delete p.hof;
		}

		return p;
	};
};

export default formatPlayerFactory;
