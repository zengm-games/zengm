import { bySport } from "../../../common";
import { NUM_OUTS_PER_INNING } from "../../../common/constants.baseball";
import { defaultGameAttributes, g, helpers } from "../../util";

// This is for league leaders pages and player profile page stat tables
// https://www.basketball-reference.com/about/rate_stat_req.html has some info for basketball, can use as rough guide
const getLeaderRequirements = () => {
	const basketballPerGameStats = {
		minStats: { gp: 58 },
	};
	const basketballAdvancedStats = {
		minStats: { min: 1500 },
	};
	const basketballAdvancedShootingStats = {
		minStats: { fga: 500 },
	};
	const basketballMinTp = Math.max(
		55 * Math.min(1, g.get("threePointTendencyFactor")),
		12,
	);
	const basketballTpStats = {
		minStats: {
			tp: basketballMinTp,
		},
	};
	const basketballMinFg = 300 * g.get("twoPointAccuracyFactor");
	const basketballFgStats = {
		minStats: { fg: basketballMinFg },
	};
	const basketballFt = {
		minStats: { ft: 125 },
	};

	return bySport<
		Record<
			string,
			{
				minStats?: Record<string, number>;
				sortAscending?: true;
				filter?: (p: any) => boolean;

				// For non-numeric stats and other stats that need to have a custom sort, like qbRec
				sortValue?: (value: any) => number;
			}
		>
	>({
		baseball: {
			ba: {
				minStats: { pa: defaultGameAttributes.numGames * 3.1 },
			},
			obp: {
				minStats: { pa: defaultGameAttributes.numGames * 3.1 },
			},
			slg: {
				minStats: { pa: defaultGameAttributes.numGames * 3.1 },
			},
			ops: {
				minStats: { pa: defaultGameAttributes.numGames * 3.1 },
			},
			era: {
				minStats: {
					outs: defaultGameAttributes.numGames * NUM_OUTS_PER_INNING,
				},
				sortAscending: true,
			},
			fip: {
				minStats: {
					outs: defaultGameAttributes.numGames * NUM_OUTS_PER_INNING,
				},
				sortAscending: true,
			},
			whip: {
				minStats: {
					outs: defaultGameAttributes.numGames * NUM_OUTS_PER_INNING,
				},
				sortAscending: true,
			},
			h9: {
				minStats: {
					outs: defaultGameAttributes.numGames * NUM_OUTS_PER_INNING,
				},
				sortAscending: true,
			},
			hr9: {
				minStats: {
					outs: defaultGameAttributes.numGames * NUM_OUTS_PER_INNING,
				},
				sortAscending: true,
			},
			bb9: {
				minStats: {
					outs: defaultGameAttributes.numGames * NUM_OUTS_PER_INNING,
				},
				sortAscending: true,
			},
			so9: {
				minStats: {
					outs: defaultGameAttributes.numGames * NUM_OUTS_PER_INNING,
				},
			},
			pc9: {
				minStats: {
					outs: defaultGameAttributes.numGames * NUM_OUTS_PER_INNING,
				},
				sortAscending: true,
			},
			sow: {
				minStats: {
					outs: defaultGameAttributes.numGames * NUM_OUTS_PER_INNING,
				},
			},
		},
		basketball: {
			pts: {
				minStats: { gp: 58, pts: 1400 },
			},
			trb: {
				minStats: { gp: 58, trb: 800 },
			},
			ast: {
				minStats: { gp: 58, ast: 400 },
			},
			orb: basketballPerGameStats,
			drb: basketballPerGameStats,
			tov: basketballPerGameStats,
			ba: basketballPerGameStats,
			pf: basketballPerGameStats,
			fg: basketballFgStats,
			fga: basketballFgStats,
			fgp: basketballFgStats,
			"2p": basketballFgStats,
			"2pa": basketballFgStats,
			"2pp": basketballFgStats,
			tp: basketballTpStats,
			tpa: basketballTpStats,
			tpp: basketballTpStats,
			ft: basketballFt,
			fta: basketballFt,
			ftp: basketballFt,
			fgAtRim: { minStats: { fgAtRim: basketballMinFg / 5 } },
			fgaAtRim: { minStats: { fgAtRim: basketballMinFg / 5 } },
			fgpAtRim: { minStats: { fgAtRim: basketballMinFg / 5 } },
			fgLowPost: { minStats: { fgLowPost: basketballMinFg / 5 } },
			fgaLowPost: { minStats: { fgLowPost: basketballMinFg / 5 } },
			fgpLowPost: { minStats: { fgLowPost: basketballMinFg / 5 } },
			fgMidRange: { minStats: { fgMidRange: basketballMinFg / 5 } },
			fgaMidRange: { minStats: { fgMidRange: basketballMinFg / 5 } },
			fgpMidRange: { minStats: { fgMidRange: basketballMinFg / 5 } },
			blk: {
				minStats: { gp: 58, blk: 100 },
			},
			stl: {
				minStats: { gp: 58, stl: 125 },
			},
			min: {
				minStats: { gp: 58, min: 1500 },
			},
			per: basketballAdvancedStats,
			ewa: basketballAdvancedStats,
			ws48: basketballAdvancedStats,
			ows: basketballAdvancedStats,
			dws: basketballAdvancedStats,
			ws: basketballAdvancedStats,
			obpm: basketballAdvancedStats,
			dbpm: basketballAdvancedStats,
			bpm: basketballAdvancedStats,
			vorp: basketballAdvancedStats,
			onOff100: basketballAdvancedStats,
			gp: {},
			gs: {},
			dd: {},
			td: {},
			qd: {},
			fxf: {},
			orbp: basketballAdvancedStats,
			drbp: basketballAdvancedStats,
			trbp: basketballAdvancedStats,
			astp: basketballAdvancedStats,
			stlp: basketballAdvancedStats,
			blkp: basketballAdvancedStats,
			tovp: {
				...basketballAdvancedStats,
				sortAscending: true,
			},
			usgp: basketballAdvancedStats,
			pm100: basketballAdvancedStats,
			ortg: basketballAdvancedStats,
			drtg: basketballAdvancedStats,
			minMax: {},
			fgMax: {},
			fgaMax: {},
			tpMax: {},
			tpaMax: {},
			"2pMax": {},
			"2paMax": {},
			ftMax: {},
			ftaMax: {},
			orbMax: {},
			drbMax: {},
			trbMax: {},
			astMax: {},
			tovMax: {},
			stlMax: {},
			blkMax: {},
			baMax: {},
			pfMax: {},
			ptsMax: {},
			pmMax: {},
			gmscMax: {},
			tsp: basketballAdvancedShootingStats,
			efg: basketballAdvancedShootingStats,
			tpar: basketballAdvancedShootingStats,
			ftr: basketballAdvancedShootingStats,
		},
		football: {
			pssYdsPerAtt: {
				minStats: { pss: 14 * 16 },
			},
			cmpPct: {
				minStats: { pss: 14 * 16 },
			},
			qbRat: {
				minStats: { pss: 14 * 16 },
			},
			rusYdsPerAtt: {
				minStats: { rus: 6.25 * 16 },
			},
			recYdsPerAtt: {
				minStats: { rec: 1.875 * 16 },
			},
			gp: {},
			gs: {},
			pssCmp: {},
			pss: {},
			pssYds: {},
			pssTD: {},
			pssInt: {},
			pssLng: {},
			pssSk: {},
			pssSkYds: {},
			fp: {},
			av: {},
			rus: {},
			rusYds: {},
			rusTD: {},
			rusLng: {},
			tgt: {},
			rec: {},
			recYds: {},
			recTD: {},
			recLng: {},
			touches: {},
			ydsFromScrimmage: {},
			rusRecTD: {},
			fmb: {},
			defInt: {},
			defIntYds: {},
			defIntTD: {},
			defIntLng: {},
			defPssDef: {},
			defFmbFrc: {},
			defFmbRec: {},
			defFmbYds: {},
			defFmbTD: {},
			defFmbLng: {},
			defSk: {},
			defTck: {},
			defTckSolo: {},
			defTckAst: {},
			defTckLoss: {},
			defSft: {},
			fmbLost: {},
			pen: {},
			penYds: {},
			fg0: {},
			fga0: {},
			fg20: {},
			fga20: {},
			fg30: {},
			fga30: {},
			fg40: {},
			fga40: {},
			fg50: {},
			fga50: {},
			fgLng: {},
			fg: {},
			fga: {},
			xp: {},
			xpa: {},
			pnt: {},
			pntYds: {},
			pntLng: {},
			pntBlk: {},
			pr: {},
			prYds: {},
			prTD: {},
			prLng: {},
			kr: {},
			krYds: {},
			krTD: {},
			krLng: {},
			qbRec: {
				sortValue: value => helpers.getRecordNumericValue(value),
			},
		},
		hockey: {
			pm: {
				filter: p => p.ratings.pos !== "G",
			},
			min: {
				filter: p => p.ratings.pos !== "G",
			},
			svPct: {
				minStats: { sv: 800 },
			},
			gaa: {
				minStats: { sv: 800 },
				sortAscending: true,
			},
		},
	});
};

export default getLeaderRequirements;
