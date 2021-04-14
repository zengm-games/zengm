import loadStatsBasketball, { BasketballStats } from "./loadStats.basketball";
import { helpers, PHASE, PLAYER } from "../../../common";
import type { GetLeagueOptions } from "../../../common/types";
import { LATEST_SEASON, LATEST_SEASON_WITH_DRAFT_POSITIONS } from "./getLeague";
import getOnlyRatings from "./getOnlyRatings";
import type { Basketball, Ratings } from "./loadData.basketball";
import nerfDraftProspect from "./nerfDraftProspect";
import oldAbbrevTo2020BBGMAbbrev from "./oldAbbrevTo2020BBGMAbbrev";
import setDraftProspectRatingsBasedOnDraftPosition from "./setDraftProspectRatingsBasedOnDraftPosition";

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
		if (tidCache.hasOwnProperty(abbrev)) {
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
		ratings: Ratings,
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
		if (draftProspect) {
			tid = PLAYER.UNDRAFTED;
		} else {
			tid = PLAYER.FREE_AGENT;
			let statsRow;
			if (options.type === "real" && options.phase >= PHASE.PLAYOFFS) {
				// Search backwards - last team a player was on that season
				for (let i = basketball.stats.length - 1; i >= 0; i--) {
					const row = basketball.stats[i];
					if (row.slug === slug && row.season === ratings.season) {
						statsRow = row;
						break;
					}
				}
			} else {
				// Search forwards - first team a player was on that season
				statsRow = basketball.stats.find(
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

		if (!jerseyNumber) {
			// Fallback (mostly for draft prospects) - pick first number in database
			const statsRow2 = basketball.stats.find(row => row.slug === slug);
			if (statsRow2) {
				jerseyNumber = statsRow2.jerseyNumber;
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
			if (season >= LATEST_SEASON) {
				// Auto-apply extensions, otherwise will feel weird
				const salaryRowExtension = basketball.salaries.find(
					row => row.start > season && row.slug === slug,
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

			const awardsCustoffSeason =
				options.type === "real" &&
				options.phase !== undefined &&
				options.phase > PHASE.PLAYOFFS
					? season + 1
					: season;
			awards =
				allAwards && !draftProspect
					? helpers.deepCopy(
							allAwards.filter(award => award.season < awardsCustoffSeason),
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

		const age = ratings.season - bornYear;

		// Whitelist, to get rid of any other columns
		const currentRatings = getOnlyRatings(ratings);

		if (draftProspect) {
			nerfDraftProspect(currentRatings);

			if (
				options.type === "real" &&
				options.realDraftRatings === "draft" &&
				draft.year <= LATEST_SEASON_WITH_DRAFT_POSITIONS
			) {
				setDraftProspectRatingsBasedOnDraftPosition(currentRatings, age, bio);
			}
		}

		const name = legends ? `${bio.name} ${ratings.season}` : bio.name;

		let stats: any;
		if (options.type === "real" && basketballStats) {
			let statsTemp: BasketballStats | undefined;

			const statsSeason =
				options.phase > PHASE.REGULAR_SEASON
					? options.season
					: options.season - 1;
			const includePlayoffs = options.phase !== PHASE.PLAYOFFS;

			if (options.realStats === "lastSeason") {
				statsTemp = basketballStats.filter(
					row =>
						row.slug === slug &&
						row.season === statsSeason &&
						(includePlayoffs || !row.playoffs),
				);
			} else if (options.realStats === "allSeasonsActive") {
				statsTemp = basketballStats.filter(
					row =>
						row.slug === slug &&
						row.season <= statsSeason &&
						(includePlayoffs || !row.playoffs || row.season < statsSeason),
				);
			}

			if (statsTemp) {
				stats = statsTemp.map(row => {
					const tid = getTidNormal(row.abbrev);
					if (tid === undefined) {
						throw new Error("tid not found");
					}

					const newRow: Omit<typeof row, "slug" | "abbrev"> & {
						tid: number;
					} = {
						...row,
						tid,
					};
					delete (newRow as any).slug;
					delete (newRow as any).abbrev;

					return newRow;
				});
			}
		}

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
			stats,
			injury,
			contract,
			awards,
			jerseyNumber,
			srID: ratings.slug,
		};
	};
};

export default formatPlayerFactory;
