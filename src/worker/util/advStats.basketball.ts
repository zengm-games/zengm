import { PHASE } from "../../common";
import { idb } from "../db";
import g from "./g";
import type { TeamFiltered } from "../../common/types";
import advStatsSave from "./advStatsSave";
import defaultGameAttributes from "./defaultGameAttributes";

type Team = TeamFiltered<
	["tid"],
	undefined,
	[
		"gp",
		"ft",
		"pf",
		"ast",
		"fg",
		"pts",
		"fga",
		"orb",
		"tov",
		"fta",
		"trb",
		"oppPts",
		"pace",
		"min",
		"oppFga",
		"oppTpa",
		"drb",
		"oppOrb",
		"oppDrb",
		"oppFta",
		"oppFg",
		"oppTov",
		"oppTrb",
		"blk",
		"ortg",
		"drtg",
		"oppFg",
		"oppFt",
		"stl",
		"tp",
		"poss",
	],
	number
>;

const prls = {
	PG: 11,
	G: 10.75,
	SG: 10.5,
	GF: 10.5,
	SF: 10.5,
	F: 11,
	PF: 11.5,
	FC: 11.05,
	C: 10.6,
};

export const getEWA = (per: number, min: number, pos: string) => {
	let prl;

	if (prls.hasOwnProperty(pos)) {
		// https://github.com/microsoft/TypeScript/issues/21732
		// @ts-ignore
		prl = prls[pos];
	} else {
		// This should never happen unless someone manually enters the wrong position, which can happen in custom roster files
		prl = 10.75;
	}

	const va = (min * (per - prl)) / 67;
	return (va / 30) * 0.8; // 0.8 is a fudge factor to approximate the difference between (BBGM) EWA and (real) win shares
};

// http://www.basketball-reference.com/about/per.html
const calculatePER = (players: any[], teamsInput: Team[], league: any) => {
	const teams = teamsInput.map(t => {
		const paceAdj = t.stats.pace === 0 ? 1 : league.pace / t.stats.pace;

		return {
			...t,
			stats: {
				...t.stats,
				paceAdj,
			},
		};
	});

	const aPER: number[] = [];
	const mins: number[] = [];
	league.aPER = 0;

	const factor =
		2 / 3 - (0.5 * (league.ast / league.fg)) / (2 * (league.fg / league.ft));
	const vop =
		league.pts / (league.fga - league.orb + league.tov + 0.44 * league.fta);
	const drbp = (league.trb - league.orb) / league.trb; // DRB%

	for (let i = 0; i < players.length; i++) {
		const t = teams.find(t => t.tid === players[i].tid);
		if (!t) {
			throw new Error("No team found");
		}

		let uPER;

		if (players[i].stats.min > 10) {
			uPER =
				(1 / players[i].stats.min) *
				(players[i].stats.tp +
					(2 / 3) * players[i].stats.ast +
					(2 - factor * (t.stats.ast / t.stats.fg)) * players[i].stats.fg +
					players[i].stats.ft *
						0.5 *
						(1 +
							(1 - t.stats.ast / t.stats.fg) +
							(2 / 3) * (t.stats.ast / t.stats.fg)) -
					vop * players[i].stats.tov -
					vop * drbp * (players[i].stats.fga - players[i].stats.fg) -
					vop *
						0.44 *
						(0.44 + 0.56 * drbp) *
						(players[i].stats.fta - players[i].stats.ft) +
					vop * (1 - drbp) * (players[i].stats.trb - players[i].stats.orb) +
					vop * drbp * players[i].stats.orb +
					vop * players[i].stats.stl +
					vop * drbp * players[i].stats.blk -
					players[i].stats.pf *
						(league.ft / league.pf - 0.44 * (league.fta / league.pf) * vop));
		} else {
			uPER = 0;
		}

		aPER[i] = t.stats.paceAdj * uPER;
		league.aPER += aPER[i] * players[i].stats.min;
		mins[i] = players[i].stats.min; // Save for EWA calculation
	}

	league.aPER /=
		league.gp *
		5 *
		g.get("numPeriods") *
		(g.get("quarterLength") > 0
			? g.get("quarterLength")
			: defaultGameAttributes.quarterLength);
	const PER = aPER.map(num => num * (15 / league.aPER));

	// Estimated Wins Added http://insider.espn.go.com/nba/hollinger/statistics
	const EWA: number[] = []; // Position Replacement Levels

	for (let i = 0; i < players.length; i++) {
		EWA[i] = getEWA(PER[i], players[i].stats.min, players[i].ratings.pos);
	}

	return {
		per: PER,
		ewa: EWA,
	};
};

// https://www.basketball-reference.com/about/bpm2.html
/**
 * Comments from nicidob:
 *
 * i left out 2 things: I'm not using the strength-of-schedule adjusted ORtg/DRtg
 * but honestly it was often less than 0.5 pts.
 * https://www.basketball-reference.com/leagues/NBA_2017_ratings.html
 * and I'm only doing 1 "estimate, average, subtract correction" step for the Position/Role estimates (Spreadsheet does 2...  * but like... in his example it went 3.14 -> 3.01 -> 3.00 for the 3 steps so I figured it was fine with just the 3.01... [1=PG, 5=C])
 * and yeah it definitely needs a code review
 * I don't really understand some of the logic in the algorithm, but I think I did it okay.
 * 1) What the hell is this threshold points? And why is it using adjusted points instead of real points? Shooting luck?! It  * seems to ALWAYS adjust down
 * 2) The position constants. I don't get why it uses this weird slope thing but whatever.
 * 3) It does (NetRating/100 - TOTAL BPM)/5 for the team adjustment. This is just really weird to me. Order of magnitudes seems off. It's like ~5, ~35 for the 2 terms, so it feels like only the latter should be /5? But I just copied the spreadsheet math
 */
const calculateBPM = (players: any[], teamsInput: Team[], league: any) => {
	const teams = teamsInput.map(t => {
		const paceAdj = t.stats.pace === 0 ? 1 : league.pace / t.stats.pace;

		return {
			...t,
			stats: {
				...t.stats,
				paceAdj,
			},
		};
	});

	const posNum = {
		PG: 1,
		G: 1.5,
		SG: 2,
		GF: 2.5,
		SF: 3,
		F: 3.5,
		PF: 4,
		FC: 4.5,
		C: 5,
	};
	// BPM does a lot of team-based averages
	// we initialize them here
	const teamAverages: Record<
		number,
		{
			tmRate: number;
			ofRate: number;
			ptsTSA: number;
			teamThresh: number;
			trim1t: number;
			trim1c: number;
			trim2t: number;
			trim2c: number;
			teamBPM: number;
			teamOBPM: number;
			teamAdjBPM: number;
			teamAdjOBPM: number;
		}
	> = {};

	// Count number of teams, which matters for the playoffs
	const numTeams = teams.filter(t => t.stats.gp > 0).length;

	for (const t of teams) {
		const off_rate = t.stats.ortg - league.ortg / numTeams;
		const def_rate = league.drtg / numTeams - t.stats.drtg;
		const team_rate = off_rate + def_rate;
		const pace = t.stats.pace;
		const avg_lead = (team_rate * pace) / 200;
		//console.log('rtg',t.stats.ortg,t.stats.drtg)
		//console.log('team off',team_rate,off_rate,def_rate);
		//console.log(avg_lead);
		const lead_bonus = (0.35 / 2) * avg_lead;
		const adj_team_rate = team_rate + lead_bonus;
		const adj_off_rate = off_rate + lead_bonus;

		teamAverages[t.tid] = {
			tmRate: adj_team_rate,
			ofRate: adj_off_rate,
			ptsTSA: t.stats.pts / (t.stats.fga + 0.44 * t.stats.fta),
			teamThresh: 0,
			trim1t: 0,
			trim1c: 0,
			trim2t: 0,
			trim2c: 0,
			teamBPM: 0,
			teamOBPM: 0,
			teamAdjBPM: 0,
			teamAdjOBPM: 0,
		};
	}

	const playerPoss: number[] = [];
	const playerMin: number[] = [];

	const playerPos: number[] = [];
	const playerRole: number[] = [];

	const adjPts: number[] = [];
	const threshPts: number[] = [];

	// compute team stats
	for (let i = 0; i < players.length; i++) {
		const t = teams.find(t => t.tid === players[i].tid);
		if (!t) {
			throw new Error("No team found");
		}
		const team_pts_tsa = teamAverages[players[i].tid].ptsTSA;

		const p = players[i].stats;
		const tsa = p.fga + p.fta * 0.44;
		const pts_tsa = p.pts / (tsa + 1e-6);
		const adj_pts = (pts_tsa - team_pts_tsa + 1) * tsa;
		const poss = 1e-6 + (p.min * t.stats.pace) / 48;
		const thresh_pts = tsa * (pts_tsa - (team_pts_tsa - 0.33));
		teamAverages[players[i].tid].teamThresh += thresh_pts;
		playerPoss[i] = poss;
		adjPts[i] = adj_pts;
		threshPts[i] = thresh_pts;
	}

	// compute average offensive roles and positions
	for (let i = 0; i < players.length; i++) {
		const t = teams.find(t => t.tid === players[i].tid);
		if (!t) {
			throw new Error("No team found");
		}
		const p = players[i].stats;

		let prl;

		if (posNum.hasOwnProperty(players[i].ratings.pos)) {
			// https://github.com/microsoft/TypeScript/issues/21732
			// @ts-ignore
			prl = posNum[players[i].ratings.pos];
		} else {
			// This should never happen unless someone manually enters the wrong position, which can happen in custom roster files
			prl = 3;
		}
		const minp = t.stats.min > 0 ? (p.min + 1e-9) / (t.stats.min / 5) : 0;
		const trbp = t.stats.trb > 0 ? p.trb / t.stats.trb / minp : 0;
		const stlp = t.stats.stl > 0 ? p.stl / t.stats.stl / minp : 0;
		const pfp = t.stats.pf > 0 ? p.pf / t.stats.pf / minp : 0;
		const astp = t.stats.ast > 0 ? p.ast / t.stats.ast / minp : 0;
		const blkp = t.stats.blk > 0 ? p.blk / t.stats.blk / minp : 0;
		const thsp = threshPts[i] / teamAverages[players[i].tid].teamThresh / minp;

		const est_pos1 =
			2.13 +
			8.668 * trbp -
			2.486 * stlp +
			0.992 * pfp -
			3.536 * astp +
			1.667 * blkp;
		const min_adj1 = (est_pos1 * p.min + prl * 50) / (50 + p.min);
		const trim1 = Math.max(1, Math.min(min_adj1, 5));
		teamAverages[players[i].tid].trim1t += trim1;
		teamAverages[players[i].tid].trim1c += 1;
		playerPos[i] = min_adj1;
		playerMin[i] = minp;

		const orole = 6 - 6.642 * astp - 8.544 * thsp;
		const orole_min1 = (orole * p.min + 4 * 50) / (50 + p.min);
		const otrim1 = Math.max(1, Math.min(orole_min1, 5));
		teamAverages[players[i].tid].trim2t += otrim1;
		teamAverages[players[i].tid].trim2c += 1;
		playerRole[i] = orole_min1;
	}

	// Do a converging iteration, BPM usually does 2 but this is just 1
	for (let i = 0; i < players.length; i++) {
		const trim2 =
			playerPos[i] -
			(teamAverages[players[i].tid].trim1t /
				teamAverages[players[i].tid].trim1c -
				3);
		playerPos[i] = Math.max(1, Math.min(trim2, 5));

		const orole2 =
			playerRole[i] -
			(teamAverages[players[i].tid].trim2t /
				teamAverages[players[i].tid].trim2c -
				3);
		playerRole[i] = Math.max(1, Math.min(orole2, 5));
	}

	const coeffsBPM1 = [
		0.86,
		-0.56,
		-0.246,
		0.389,
		0.58,
		-0.964,
		0.613,
		0.116,
		0.0,
		1.369,
		1.327,
		-0.367,
	];
	const coeffsBPM5 = [
		0.86,
		-0.78,
		-0.343,
		0.389,
		1.034,
		-0.964,
		0.181,
		0.181,
		0.0,
		1.008,
		0.703,
		-0.367,
	];
	const coeffsORBPM1 = [
		0.605,
		-0.33,
		-0.145,
		0.477,
		0.476,
		-0.579,
		0.606,
		-0.112,
		0.0,
		0.177,
		0.725,
		-0.439,
	];
	const coeffsORBPM5 = [
		0.605,
		-0.472,
		-0.208,
		0.477,
		0.476,
		-0.882,
		0.422,
		0.103,
		0.0,
		0.294,
		0.097,
		-0.439,
	];

	const BPM: number[] = [];
	const OBPM: number[] = [];

	for (let i = 0; i < players.length; i++) {
		const p = players[i].stats;
		const role = playerRole[i];
		const pos = playerPos[i];

		const poss = playerPoss[i];
		const pts100 = (adjPts[i] / poss) * 100;
		const fga100 = (p.fga / poss) * 100;
		const fta100 = (p.fta / poss) * 100;
		const tp100 = (p.tp / poss) * 100;
		const ast100 = (p.ast / poss) * 100;
		const stl100 = (p.stl / poss) * 100;
		const blk100 = (p.blk / poss) * 100;
		const pf100 = (p.pf / poss) * 100;

		const to100 = (p.tov / poss) * 100;
		const orb100 = (p.orb / poss) * 100;
		const drb100 = (p.drb / poss) * 100;
		const trb100 = (p.trb / poss) * 100;
		const minp = playerMin[i];

		const coeffsBPM: number[] = [];
		const coeffsORBPM: number[] = [];

		const interBPM =
			pos < 3
				? ((3 - pos) / 2) * -0.818
				: ((pos - 3) / 2) * 0 + ((5 - pos) / 2) * 0 + 1.387 * (role - 3);
		const interORBPM =
			pos < 3
				? ((3 - pos) / 2) * -1.698
				: ((pos - 3) / 2) * 0 + ((5 - pos) / 2) * 0 + 0.43 * (role - 3);

		for (let j = 0; j < coeffsBPM1.length; j++) {
			const posB = j === 1 || j === 2 ? role : pos;

			coeffsBPM[j] =
				((5 - posB) / 4) * coeffsBPM1[j] + ((posB - 1) / 4) * coeffsBPM5[j];
			coeffsORBPM[j] =
				((5 - posB) / 4) * coeffsORBPM1[j] + ((posB - 1) / 4) * coeffsORBPM5[j];
		}

		const scoring =
			pts100 * coeffsBPM[0] +
			fga100 * coeffsBPM[1] +
			fta100 * coeffsBPM[2] +
			tp100 * coeffsBPM[3];
		const scoring2 =
			pts100 * coeffsORBPM[0] +
			fga100 * coeffsORBPM[1] +
			fta100 * coeffsORBPM[2] +
			tp100 * coeffsORBPM[3];

		const ballhandle = ast100 * coeffsBPM[4] + to100 * coeffsBPM[5];
		const ballhandle2 = ast100 * coeffsORBPM[4] + to100 * coeffsORBPM[5];

		const defense =
			orb100 * coeffsBPM[6] +
			drb100 * coeffsBPM[7] +
			trb100 * coeffsBPM[8] +
			stl100 * coeffsBPM[9] +
			blk100 * coeffsBPM[10] +
			pf100 * coeffsBPM[11];
		const defense2 =
			orb100 * coeffsORBPM[6] +
			drb100 * coeffsORBPM[7] +
			trb100 * coeffsORBPM[8] +
			stl100 * coeffsORBPM[9] +
			blk100 * coeffsORBPM[10] +
			pf100 * coeffsORBPM[11];
		const rawBPM = scoring + ballhandle + defense + interBPM;
		const rawOBPM = scoring2 + ballhandle2 + defense2 + interORBPM;

		BPM[i] = rawBPM;
		OBPM[i] = rawOBPM;

		teamAverages[players[i].tid].teamBPM += rawBPM * minp;
		teamAverages[players[i].tid].teamOBPM += rawOBPM * minp;
	}

	for (const t of teams) {
		teamAverages[t.tid].teamAdjBPM =
			(teamAverages[t.tid].tmRate - teamAverages[t.tid].teamBPM) / 5;
		teamAverages[t.tid].teamAdjOBPM =
			(teamAverages[t.tid].ofRate - teamAverages[t.tid].teamOBPM) / 5;
	}
	const DBPM: number[] = [];
	const VORP: number[] = [];
	for (let i = 0; i < players.length; i++) {
		BPM[i] += teamAverages[players[i].tid].teamAdjBPM;
		OBPM[i] += teamAverages[players[i].tid].teamAdjOBPM;
		DBPM[i] = BPM[i] - OBPM[i];

		const t = teams.find(t => t.tid === players[i].tid);
		if (!t) {
			throw new Error("No team found");
		}

		VORP[i] = ((BPM[i] + 2) * playerMin[i] * t.stats.gp) / g.get("numGames");
	}

	return {
		obpm: OBPM,
		dbpm: DBPM,
		vorp: VORP,
	};
};

// https://www.basketball-reference.com/about/glossary.html
const calculatePercentages = (players: any[], teams: Team[]) => {
	const astp: number[] = [];
	const blkp: number[] = [];
	const drbp: number[] = [];
	const orbp: number[] = [];
	const stlp: number[] = [];
	const trbp: number[] = [];
	const usgp: number[] = [];

	for (let i = 0; i < players.length; i++) {
		const p = players[i];
		const t = teams.find(t => t.tid === p.tid);

		if (t === undefined) {
			astp[i] = 0;
			blkp[i] = 0;
			drbp[i] = 0;
			orbp[i] = 0;
			stlp[i] = 0;
			trbp[i] = 0;
			usgp[i] = 0;
		} else {
			astp[i] =
				(100 * p.stats.ast) /
				((p.stats.min / (t.stats.min / 5)) * t.stats.fg - p.stats.fg);
			blkp[i] =
				(100 * (p.stats.blk * (t.stats.min / 5))) /
				(p.stats.min * (t.stats.oppFga - t.stats.oppTpa));
			drbp[i] =
				(100 * (p.stats.drb * (t.stats.min / 5))) /
				(p.stats.min * (t.stats.drb + t.stats.oppOrb));
			orbp[i] =
				(100 * (p.stats.orb * (t.stats.min / 5))) /
				(p.stats.min * (t.stats.orb + t.stats.oppDrb));
			stlp[i] =
				(100 * (p.stats.stl * (t.stats.min / 5))) /
				(p.stats.min * t.stats.poss);
			trbp[i] =
				(100 * (p.stats.trb * (t.stats.min / 5))) /
				(p.stats.min * (t.stats.trb + t.stats.oppTrb));
			usgp[i] =
				(100 *
					((p.stats.fga + 0.44 * p.stats.fta + p.stats.tov) *
						(t.stats.min / 5))) /
				(p.stats.min * (t.stats.fga + 0.44 * t.stats.fta + t.stats.tov));

			if (Number.isNaN(astp[i]) || astp[i] === Infinity) {
				astp[i] = 0;
			}

			if (Number.isNaN(blkp[i]) || blkp[i] === Infinity) {
				blkp[i] = 0;
			}

			if (Number.isNaN(drbp[i]) || drbp[i] === Infinity) {
				drbp[i] = 0;
			}

			if (Number.isNaN(orbp[i]) || orbp[i] === Infinity) {
				orbp[i] = 0;
			}

			if (Number.isNaN(stlp[i]) || stlp[i] === Infinity) {
				stlp[i] = 0;
			}

			if (Number.isNaN(trbp[i]) || trbp[i] === Infinity) {
				trbp[i] = 0;
			}

			if (Number.isNaN(usgp[i]) || usgp[i] === Infinity) {
				usgp[i] = 0;
			}
		}
	}

	return {
		astp,
		blkp,
		drbp,
		orbp,
		stlp,
		trbp,
		usgp,
	};
};

// https://www.basketball-reference.com/about/ratings.html
const calculateRatings = (players: any[], teams: Team[], league: any) => {
	const drtg: number[] = [];
	const dws: number[] = [];
	const ortg: number[] = [];
	const ows: number[] = [];

	for (let i = 0; i < players.length; i++) {
		const p = players[i];
		const t = teams.find(t => t.tid === p.tid);

		if (t === undefined) {
			drtg[i] = 0;
			ortg[i] = 0;
		} else {
			// Defensive rating
			const dorPct = t.stats.oppOrb / (t.stats.oppOrb + t.stats.drb);
			const dfgPct = t.stats.oppFg / t.stats.oppFga;
			const fmwt =
				(dfgPct * (1 - dorPct)) /
				(dfgPct * (1 - dorPct) + (1 - dfgPct) * dorPct);
			const stops1 =
				p.stats.stl +
				p.stats.blk * fmwt * (1 - 1.07 * dorPct) +
				p.stats.drb * (1 - fmwt);
			const stops2 =
				(((t.stats.oppFga - t.stats.oppFg - t.stats.blk) / t.stats.min) *
					fmwt *
					(1 - 1.07 * dorPct) +
					(t.stats.oppTov - t.stats.stl) / t.stats.min) *
					p.stats.min +
				(p.stats.pf / t.stats.pf) *
					0.4 *
					t.stats.oppFta *
					(1 - t.stats.oppFt / t.stats.oppFta) ** 2;
			const stops = stops1 + stops2;
			const stopPct = (stops * t.stats.min) / (t.stats.poss * p.stats.min);
			const dPtsPerscPoss =
				t.stats.oppPts /
				(t.stats.oppFg +
					(1 - (1 - t.stats.oppFt / t.stats.oppFta) ** 2) *
						t.stats.oppFta *
						0.4);
			drtg[i] =
				t.stats.drtg +
				0.2 * (100 * dPtsPerscPoss * (1 - stopPct) - t.stats.drtg);

			// Defensive win shares
			const marginalDefense =
				(p.stats.min / t.stats.min) *
				t.stats.poss *
				(1.08 * (league.pts / league.poss) - drtg[i] / 100);
			const marginalPtsPerWin =
				0.32 * (league.pts / league.gp) * (t.stats.pace / league.pace);
			dws[i] = marginalDefense / marginalPtsPerWin;

			// Offensive rating
			const ftRatio = p.stats.fta > 0 ? p.stats.ft / p.stats.fta : 0;
			const qAst =
				(p.stats.min / (t.stats.min / 5)) *
					(1.14 * ((t.stats.ast - p.stats.ast) / t.stats.fg)) +
				(((t.stats.ast / t.stats.min) * p.stats.min * 5 - p.stats.ast) /
					((t.stats.fg / t.stats.min) * p.stats.min * 5 - p.stats.fg)) *
					(1 - p.stats.min / (t.stats.min / 5));
			const fgPart =
				p.stats.fg *
				(1 - 0.5 * ((p.stats.pts - p.stats.ft) / (2 * p.stats.fga)) * qAst);
			const astPart =
				0.5 *
				((t.stats.pts - t.stats.ft - (p.stats.pts - p.stats.ft)) /
					(2 * (t.stats.fga - p.stats.fga))) *
				p.stats.ast;
			const ftPart = (1 - (1 - ftRatio) ** 2) * 0.4 * p.stats.fta;
			const teamScoringPoss =
				t.stats.fg +
				(1 - (1 - t.stats.ft / t.stats.fta) ** 2) * t.stats.fta * 0.4;
			const teamOrbPct = t.stats.orb / (t.stats.orb + t.stats.oppDrb);
			const teamPlayPct =
				teamScoringPoss / (t.stats.fga + t.stats.fta * 0.4 + t.stats.tov);
			const teamOrbWeight =
				((1 - teamOrbPct) * teamPlayPct) /
				((1 - teamOrbPct) * teamPlayPct + teamOrbPct * (1 - teamPlayPct));
			const orbPart = p.stats.orb * teamOrbWeight * teamPlayPct;
			const scPoss =
				(fgPart + astPart + ftPart) *
					(1 - (t.stats.orb / teamScoringPoss) * teamOrbWeight * teamPlayPct) +
				orbPart;
			const fgxPoss = (p.stats.fga - p.stats.fg) * (1 - 1.07 * teamOrbPct);
			const ftxPoss = (1 - ftRatio) ** 2 * 0.4 * p.stats.fta;
			const totPoss = scPoss + fgxPoss + ftxPoss + p.stats.tov;
			const pProdFgPart =
				2 *
				(p.stats.fg + 0.5 * p.stats.tp) *
				(1 - 0.5 * ((p.stats.pts - p.stats.ft) / (2 * p.stats.fga)) * qAst);
			const pProdAstPart =
				2 *
				((t.stats.fg - p.stats.fg + 0.5 * (t.stats.tp - p.stats.tp)) /
					(t.stats.fg - p.stats.fg)) *
				0.5 *
				((t.stats.pts - t.stats.ft - (p.stats.pts - p.stats.ft)) /
					(2 * (t.stats.fga - p.stats.fga))) *
				p.stats.ast;
			const pProdOrbPart =
				p.stats.orb *
				teamOrbWeight *
				teamPlayPct *
				(t.stats.pts /
					(t.stats.fg +
						(1 - (1 - t.stats.ft / t.stats.fta) ** 2) * 0.4 * t.stats.fta));
			const pProd =
				(pProdFgPart + pProdAstPart + p.stats.ft) *
					(1 - (t.stats.orb / teamScoringPoss) * teamOrbWeight * teamPlayPct) +
				pProdOrbPart;
			ortg[i] = 100 * (pProd / totPoss);

			// Offensive win shares
			const marginalOffense =
				pProd - 0.92 * (league.pts / league.poss) * totPoss;
			ows[i] = marginalOffense / marginalPtsPerWin;

			if (Number.isNaN(drtg[i]) || drtg[i] === Infinity) {
				drtg[i] = 0;
			}

			if (Number.isNaN(dws[i]) || dws[i] === Infinity || p.stats.min < 10) {
				dws[i] = 0;
			}

			if (Number.isNaN(ortg[i]) || ortg[i] === Infinity) {
				ortg[i] = 0;
			}

			if (Number.isNaN(ows[i]) || ows[i] === Infinity || p.stats.min < 10) {
				ows[i] = 0;
			}
		}
	}

	return {
		drtg,
		dws,
		ortg,
		ows,
	};
};

/**
 * Calcualte the advanced stats for each active player and write them to the database.
 *
 * Currently this is just PER.
 *
 * @memberOf util.advStats
 * @return {Promise}
 */
const advStats = async () => {
	// Total player stats (not per game averages)
	// For PER: pos, min, tp, ast, fg, ft, tov, fga, fta, trb, orb, stl, blk, pf
	// For AST%: min, fg
	// For BLK%: min, blk
	// For DRB%: min, drb
	// For ORB%: min, orb
	// For STL%: min, stl
	// For TRB%: min, trb
	// For USG%: min, fga, fta, tov
	// For DRtg: min, pf, blk, stl, drb
	// For Ortg: min, tp, ast, fg, pts, ft, fga, fta, orb
	const playersRaw = await idb.cache.players.indexGetAll("playersByTid", [
		0, // Active players have tid >= 0
		Infinity,
	]);
	const players = await idb.getCopies.playersPlus(playersRaw, {
		attrs: ["pid", "tid"],
		stats: [
			"min",
			"tp",
			"ast",
			"fg",
			"ft",
			"tov",
			"fga",
			"fta",
			"trb",
			"orb",
			"stl",
			"blk",
			"pf",
			"drb",
			"pts",
		],
		ratings: ["pos"],
		season: g.get("season"),
		playoffs: PHASE.PLAYOFFS === g.get("phase"),
		regularSeason: PHASE.PLAYOFFS !== g.get("phase"),
		statType: "totals",
	});

	// Total team stats (not per game averages)	// For PER: gp, ft, pf, ast, fg, pts, fga, orb, tov, fta, trb, oppPts, pace
	// For AST%: min, fg
	// For BLK%: min, oppFga, oppTpa
	// For DRB%: min, drb, oppOrb
	// For ORB%: min, orb, oppDrb
	// For STL%: min, stl, poss
	// For TRB%: min, trb, oppTrb
	// For USG%: min, fga, fta, tov
	// For DRtg: blk, drb, drtg, min, oppFga, oppFg, oppFta, oppFt, oppOrb, oppPts, oppTov, stl, poss
	// For Ortg: min, pts, ft, fg, fga, fta, ast, oppDrb, orb, tp, tov, poss

	const teams = await idb.getCopies.teamsPlus({
		attrs: ["tid"],
		stats: [
			"gp",
			"ft",
			"pf",
			"ast",
			"fg",
			"pts",
			"fga",
			"orb",
			"tov",
			"fta",
			"trb",
			"oppPts",
			"pace",
			"min",
			"oppFga",
			"oppTpa",
			"drb",
			"oppOrb",
			"oppDrb",
			"oppFta",
			"oppFg",
			"oppTov",
			"oppTrb",
			"blk",
			"drtg",
			"ortg",
			"oppFg",
			"oppFt",
			"stl",
			"tp",
			"poss",
		],
		season: g.get("season"),
		playoffs: PHASE.PLAYOFFS === g.get("phase"),
		regularSeason: PHASE.PLAYOFFS !== g.get("phase"),
		statType: "totals",
		addDummySeason: true,
		active: true,
	});

	// Total league stats (not per game averages)
	// For PER: gp, ft, pf, ast, fg, pts, fga, orb, tov, fta, trb
	const leagueStats = [
		"gp",
		"ft",
		"pf",
		"ast",
		"fg",
		"pts",
		"fga",
		"orb",
		"tov",
		"fta",
		"trb",
		"pace",
		"poss",
		"drtg",
		"ortg",
	];
	const league: any = teams.reduce((memo: any, t: any) => {
		for (const key of leagueStats) {
			// Special case for pace - scale by number of games
			const value = key === "pace" ? t.stats.pace * t.stats.gp : t.stats[key];

			if (memo.hasOwnProperty(key)) {
				memo[key] += value;
			} else {
				memo[key] = value;
			}
		}

		return memo;
	}, {});

	// Special case for pace - scale by number of games
	league.pace /= league.gp;

	// If no games have been played, somehow, don't continue. But why would no games be played? I don't know, but it happens some times.
	if (league.gp === 0) {
		return;
	}

	const updatedStats = {
		...calculatePER(players, teams, league),
		...calculatePercentages(players, teams),
		...calculateRatings(players, teams, league),
		...calculateBPM(players, teams, league),
	};
	await advStatsSave(players, playersRaw, updatedStats);
};

export default advStats;
