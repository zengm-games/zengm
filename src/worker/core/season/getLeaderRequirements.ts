import { bySport } from "../../../common";
import { NUM_OUTS_PER_INNING } from "../../../common/constants.baseball";
import { defaultGameAttributes, g } from "../../util";

const getLeaderRequirements = () => {
	return bySport<
		Record<
			string,
			{
				minStats?: Record<string, number>;
				sortAscending?: true;
				filter?: (p: any) => boolean;
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
				minStats: { gp: 70, pts: 1400 },
			},
			trb: {
				minStats: { gp: 70, trb: 800 },
			},
			ast: {
				minStats: { gp: 70, ast: 400 },
			},
			fgp: {
				minStats: { fg: 300 * g.get("twoPointAccuracyFactor") },
			},
			tpp: {
				minStats: {
					tp: Math.max(55 * Math.min(1, g.get("threePointTendencyFactor")), 12),
				},
			},
			ftp: {
				minStats: { ft: 125 },
			},
			blk: {
				minStats: { gp: 70, blk: 100 },
			},
			stl: {
				minStats: { gp: 70, stl: 125 },
			},
			min: {
				minStats: { gp: 70, min: 2000 },
			},
			per: {
				minStats: { min: 2000 },
			},
			ewa: {
				minStats: { min: 2000 },
			},
			ws48: {
				minStats: { min: 2000 },
			},
			ows: {
				minStats: { min: 2000 },
			},
			dws: {
				minStats: { min: 2000 },
			},
			ws: {
				minStats: { min: 2000 },
			},
			obpm: {
				minStats: { min: 2000 },
			},
			dbpm: {
				minStats: { min: 2000 },
			},
			bpm: {
				minStats: { min: 2000 },
			},
			vorp: {
				minStats: { min: 2000 },
			},
			onOff100: {
				minStats: { min: 2000 },
			},
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
