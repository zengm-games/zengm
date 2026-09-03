import { bySport } from "../../../../common/sportFunctions.ts";
import type {
	AwardSettingIndividual,
	AwardSettingTeam,
} from "../../../../common/types.ts";

// These are mostly copied from defaultGameAttributes, but with some changes to make them more similar to the old default awards (like no conf awards for baseball, and numTeams for some awards)

export const defaultAwards = {
	all: bySport<AwardSettingTeam>({
		baseball: {
			shortName: "OFF",
			name: "All-Offensive",
			formula: "rbr + rbat",
			showStats: "offense",
			numTeams: 1,
		},
		basketball: {
			shortName: "ALL",
			name: "All-League",
			formula:
				"ewa / 22 + vorp / 32 + min(ws/max(teamWs,ws),0.8) / 10 + seasonFraction * winp",
			showStats: "offense",
			numTeams: 3,
		},
		football: {
			shortName: "ALL",
			name: "All-League",
			formula:
				"4*defSk+0.4*defTckLoss+0.2*defTckAst+0.4*defTckSolo+3*defFmbFrc+3*defFmbRec+6*defInt+2*defPssDef",
			formulaByPos: {
				QB: "0.5*(0.125*rusYds+6*rusTD-2*fmbLost) + 1.1*(0.04*pssYds+4*pssTD-2.5*pssInt)",
				RB: "0.125*rusYds+6*rusTD-2*fmbLost + 0.5*(0.0975*recYds+6*recTD)",
				WR: "0.0975*recYds+6*recTD",
				TE: "0.0975*recYds+6*recTD",
				OL: "(pbw+rbw)/(0.1+pba+rba)*(pba+rba)^(1/2)",
				K: "fg",
				P: "pntYds",
			},
			showStats: "overall",
			numTeams: 2,
		},
		hockey: {
			shortName: "ALL",
			name: "All-League",
			showStats: "overall",
			formula: "ps",
			numTeams: 3,
		},
	}),
	alr: bySport<AwardSettingTeam>({
		baseball: {
			shortName: "ALR",
			name: "All-Rookie",
			formula: "war",
			showStats: "overall",
			rookie: true,
			numTeams: 1,
		},
		basketball: {
			shortName: "ALR",
			name: "All-Rookie",
			formula: "ewa / 2.1 + vorp + gp / 82 * pts / 2",
			showStats: "offense",
			rookie: true,
			numTeams: 1,
		},
		football: {
			shortName: "ALR",
			name: "All-Rookie",
			formula:
				"4*defSk+0.4*defTckLoss+0.2*defTckAst+0.4*defTckSolo+3*defFmbFrc+3*defFmbRec+6*defInt+2*defPssDef",
			formulaByPos: {
				QB: "0.5*(0.125*rusYds+6*rusTD-2*fmbLost) + 1.1*(0.04*pssYds+4*pssTD-2.5*pssInt)",
				RB: "0.125*rusYds+6*rusTD-2*fmbLost + 0.5*(0.0975*recYds+6*recTD)",
				WR: "0.0975*recYds+6*recTD",
				TE: "0.0975*recYds+6*recTD",
				OL: "(pbw+rbw)/(0.1+pba+rba)*(pba+rba)^(1/2)",
			},
			showStats: "overall",
			rookie: true,
			numTeams: 1,
		},
		hockey: {
			shortName: "ALR",
			name: "All-Rookie",
			showStats: "overall",
			formula: "ps",
			rookie: true,
			numTeams: 1,
		},
	}),
	fmvp: bySport<AwardSettingIndividual>({
		baseball: {
			shortName: "FMVP",
			name: "Finals MVP",

			// This formula was called fakeWAR in the old award system https://github.com/zengm-games/zengm/blob/4ee432c5b9097ed978749a049fff5823711690dc/src/worker/core/season/doAwards.baseball.ts#L285-L302 only difference now is that some values (abf and totalERA) are estimates from a typical ZGMB league rather than computed from the series total stats. Which arguably is better since there is a lot of noise in an individual series.
			formula:
				"((0.47*h + 0.38*2b + 0.55*3b + 0.93*hr + 0.33*(bb+hbp) - 0.276*(pa-bb-hbp-sf-h)) + (0.3*sb - 0.6*cs) + ((outs/27)*4.04 - er)) * (1+0.75*won)",
			showStats: "overall",
			statRange: -1,
		},
		basketball: {
			shortName: "FMVP",
			name: "Finals MVP",
			formula: "gmsc * (1 + 0.75*won)",
			showStats: "offense",
			statRange: -1,
		},
		football: {
			shortName: "FMVP",
			name: "Finals MVP",
			formula:
				"(pssYds/25 + 4*pssTD + (recYds+rusYds)/10 + 6*(recTD+rusTD+prTD+krTD+defIntTD+defFmbTD) + 1.75*(1.75*defSk + (defTckSolo + defTckAst)/10 + 2*defInt + defPssDef + 2*defFmbFrc + 2*defFmbRec + 5*defSft)) * (1+0.5*won)",
			showStats: "overall",
			statRange: -1,
		},
		hockey: {
			shortName: "PMVP",
			name: "Playoff MVP",
			formula: "pts / 25 + ps - 0.225 * gps + 20 * seasonFraction * winp",
			showStats: "overall",
			statRange: "playoffs",
		},
	}),
	mvp: bySport<AwardSettingIndividual>({
		baseball: {
			shortName: "MVP",
			name: "Most Valuable Player",
			formula: "war",
			showStats: "overall",
			actAs: "mvp",
		},
		basketball: {
			shortName: "MVP",
			name: "Most Valuable Player",

			// Max is to handle negative teamWs. Min is to handle the case that a team has very low WS, don't let anybody have a crazy high fracWS
			formula:
				"ewa / 22 + vorp / 32 + min(ws/max(teamWs,ws),0.8) / 10 + seasonFraction * winp",
			showStats: "offense",
			actAs: "mvp",
		},
		football: {
			shortName: "MVP",
			name: "Most Valuable Player",
			formula:
				"0.125*rusYds+6*rusTD-2*fmbLost + 0.0975*recYds+6*recTD + 1.1*(0.04*pssYds+4*pssTD-2.5*pssInt) + 2.25*(4*defSk+0.4*defTckLoss+0.2*defTckAst+0.4*defTckSolo+3*defFmbFrc+3*defFmbRec+6*defInt+2*defPssDef) + 6*(prTD+krTD) + 4*(pbw+rbw)/(0.1+pba+rba)*(pba+rba)^(1/2)",
			formulaByPos: {
				QB: "0.5*(0.125*rusYds+6*rusTD-2*fmbLost) + 0.0975*recYds+6*recTD + 1.1*(0.04*pssYds+4*pssTD-2.5*pssInt) + 2.25*(4*defSk+0.4*defTckLoss+0.2*defTckAst+0.4*defTckSolo+3*defFmbFrc+3*defFmbRec+6*defInt+2*defPssDef) + 6*(prTD+krTD) + 4*(pbw+rbw)/(0.1+pba+rba)*(pba+rba)^(1/2)",
			},
			showStats: "overall",
			actAs: "mvp",
		},
		hockey: {
			shortName: "MVP",
			name: "Most Valuable Player",
			formula: "pts / 25 + ps - 0.225 * gps + 20 * seasonFraction * winp",
			showStats: "overall",
			actAs: "mvp",
		},
	}),
};

export const defaultAwardsBaseball = {
	def: {
		shortName: "DEF",
		name: "All-Defensive",
		formula: "rfld",
		showStats: "defense",
		numTeams: 1,
	} as AwardSettingTeam,
	poy: {
		shortName: "POY",
		name: "Pitcher of the Year",
		formula: "rpit",
		showStats: "sp",
	} as AwardSettingIndividual,
	roy: {
		shortName: "ROY",
		name: "Rookie of the Year",
		formula: "war",
		showStats: "overall",
		rookie: true,
		actAs: "roy",
	} as AwardSettingIndividual,
	rpoy: {
		shortName: "RPOY",
		name: "Relief Pitcher of the Year",
		formula: "rpit",
		showStats: "rp",
		bench: true,
	} as AwardSettingIndividual,
};

export const defaultAwardsBasketball = {
	def: {
		shortName: "DEF",
		name: "All-Defensive",
		formula:
			"dws/3.1 + seasonFraction * winp + gp / 82 * (blk / 4.1 + stl / 1.8)",
		showStats: "defense",
		numTeams: 3,
	} as AwardSettingTeam,
	dpoy: {
		shortName: "DPOY",
		name: "Defensive Player of the Year",
		formula:
			"dws/3.1 + seasonFraction * winp + gp / 82 * (blk / 4.1 + stl / 1.8)",
		showStats: "defense",
	} as AwardSettingIndividual,
	mip: {
		shortName: "MIP",
		name: "Most Improved Player",
		formula: "pts + trb + ast + per",
		showStats: "offense",
		mip: true,
	} as AwardSettingIndividual,
	roy: {
		shortName: "ROY",
		name: "Rookie of the Year",
		formula: "ewa / 2.1 + vorp + gp / 82 * pts / 2",
		showStats: "offense",
		rookie: true,
		actAs: "roy",
	} as AwardSettingIndividual,
	smoy: {
		shortName: "SMOY",
		name: "Sixth Man of the Year",
		formula:
			"ewa / 5.5 + vorp / 2.3 + ws / 4.9 + seasonFraction * winp + gp / 82 * pts / 9.9",
		showStats: "offense",
		bench: true,
	} as AwardSettingIndividual,

	sfmvp: {
		shortName: "SFMVP",
		name: "Semifinals MVP",
		formula: "gmsc * (1 + 0.75*won)",
		showStats: "offense",
		statRange: -2,
	} as AwardSettingIndividual,
};

export const defaultAwardsFootball = {
	dpoy: {
		shortName: "DPOY",
		name: "Defensive Player of the Year",
		formula:
			"4*defSk+0.4*defTckLoss+0.2*defTckAst+0.4*defTckSolo+3*defFmbFrc+3*defFmbRec+6*defInt+2*defPssDef",
		showStats: "defense",
	} as AwardSettingIndividual,
	droy: {
		shortName: "DROY",
		name: "Defensive Rookie of the Year",
		formula:
			"4*defSk+0.4*defTckLoss+0.2*defTckAst+0.4*defTckSolo+3*defFmbFrc+3*defFmbRec+6*defInt+2*defPssDef",
		showStats: "defense",
		rookie: true,
		actAs: "roy",
	} as AwardSettingIndividual,
	opoy: {
		shortName: "OPOY",
		name: "Offensive Player of the Year",
		formula: "0.125*rusYds+6*rusTD-2*fmbLost + 0.0975*recYds+6*recTD",
		showStats: "overall",
		opoyFormula:
			"0.125*rusYds+6*rusTD-2*fmbLost + 0.0975*recYds+6*recTD + 1.1*(0.04*pssYds+4*pssTD-2.5*pssInt)",
	} as AwardSettingIndividual,
	oroy: {
		shortName: "OROY",
		name: "Offensive Rookie of the Year",
		formula:
			"0.125*rusYds+6*rusTD-2*fmbLost + 0.0975*recYds+6*recTD + 1.1*(0.04*pssYds+4*pssTD-2.5*pssInt)",
		formulaByPos: {
			QB: "0.5*(0.125*rusYds+6*rusTD-2*fmbLost) + 0.0975*recYds+6*recTD + 1.1*(0.04*pssYds+4*pssTD-2.5*pssInt)",
		},
		showStats: "overall",
		rookie: true,
		actAs: "roy",
	} as AwardSettingIndividual,
	poy: {
		shortName: "POY",
		name: "Protector of the Year",
		formula: "(pbw+rbw)/(0.1+pba+rba)*(pba+rba)^(1/2)",
		showStats: "blocking",
	} as AwardSettingIndividual,
};

export const defaultAwardsHockey = {
	dfoy: {
		shortName: "DFOY",
		name: "Defensive Forward of the Year",
		formula: "tk / 25 + hit / 25 + dps",
		formulaByPos: {
			D: "0",
			G: "0",
		},
		showStats: "defense",
	} as AwardSettingIndividual,
	dpoy: {
		shortName: "DPOY",
		name: "Defensive Player of the Year",
		formula: "tk / 25 + hit / 25 + dps",
		showStats: "defense",
	} as AwardSettingIndividual,
	goy: {
		shortName: "GOY",
		name: "Goalie of the Year",

		// Originally wrote this as "(gps / gpGoalie) * min(0.75 * teamGp, gpGoalie)" but that behaves poorly when gpGoalie is 0
		formula: "gps * min(0.75 * teamGp / gpGoalie, 1)",
		showStats: "goalkeeping",
		bench: true,
	} as AwardSettingIndividual,
	roy: {
		shortName: "ROY",
		name: "Rookie of the Year",
		formula: "pts / 25 + ps - 0.225 * gps",
		showStats: "overall",
		rookie: true,
		actAs: "roy",
	} as AwardSettingIndividual,
};
