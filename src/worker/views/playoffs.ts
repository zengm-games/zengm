import { season } from "../core";
import { idb } from "../db";
import { g, helpers, orderTeams } from "../util";
import type {
	UpdateEvents,
	ViewInput,
	PlayoffSeries,
} from "../../common/types";
import { groupBy } from "../../common/groupBy";

type SeriesTeam = {
	abbrev: string;
	cid: number;
	imgURL?: string;
	imgURLSmall?: string;
	pendingPlayIn?: true;
	pts?: number;
	region: string;
	regularSeason: {
		won: number;
		lost: number;
		tied?: number;
		otl?: number;
	};
	seed: number;
	tid: number;
	winp: number;
	won?: number;
};

type PlayInMatchup = {
	home: SeriesTeam;
	away: SeriesTeam;
};

type PlayIns =
	| (
			| [PlayInMatchup, PlayInMatchup]
			| [PlayInMatchup, PlayInMatchup, PlayInMatchup]
	  )[]
	| undefined;

type TeamToEdit = {
	tid: number;
	cid: number;
	region: string;
	name: string;
	seed: number | undefined;
	imgURL: string | undefined;
	imgURLSmall: string | undefined;
	record: string;
};

const updatePlayoffs = async (
	inputs: ViewInput<"playoffs">,
	updateEvents: UpdateEvents,
	state: any,
): Promise<{
	canEdit: boolean;
	confNames: string[];
	finalMatchups: boolean;
	matchups: {
		matchup: [number, number];
		rowspan: number;
	}[][];
	numGamesPlayoffSeries: number[];
	numGamesToWinSeries: number[];
	playIns: PlayIns;
	playoffsByConf: boolean;
	season: number;
	series: {
		home: SeriesTeam;
		away?: SeriesTeam;
	}[][];
	teamsToEdit: TeamToEdit[];
	userTid: number;
} | void> => {
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("playoffs") ||
		inputs.season !== state.season ||
		(inputs.season === g.get("season") && updateEvents.includes("gameSim"))
	) {
		let finalMatchups = false;
		let series: PlayoffSeries["series"];
		let playIns: PlayoffSeries["playIns"];

		const playoffSeries = await idb.getCopy.playoffSeries({
			season: inputs.season,
		});

		if (playoffSeries) {
			series = playoffSeries.series;
			playIns = playoffSeries.playIns;
			finalMatchups = true;
		} else {
			const result = await season.genPlayoffSeries();
			series = result.series;
			playIns = result.playIns;
		}

		await helpers.augmentSeries(series, inputs.season);

		if (playIns) {
			await helpers.augmentSeries(playIns, inputs.season);
		}

		// Because augmentSeries mutates series, this is for TypeScript
		const series2 = series as {
			home: SeriesTeam;
			away?: SeriesTeam;
		}[][];
		const playIns2 = playIns as PlayIns;

		// Formatting for the table in playoffs.html
		const matchups: {
			rowspan: number;
			matchup: [number, number];
		}[][] = [];

		for (let i = 0; i < 2 ** (series.length - 2); i++) {
			matchups[i] = [];
		}

		// Fill in with each round. Good lord, this is confusing, due to having to assemble it for an HTML table with rowspans.
		for (let i = 0; i < series.length; i++) {
			let numGamesInSide = 2 ** (series.length - i - 2);

			if (numGamesInSide < 1) {
				numGamesInSide = 1;
			}

			const rowspan = 2 ** i;

			for (let j = 0; j < numGamesInSide; j++) {
				matchups[j * rowspan].splice(i, 0, {
					rowspan,
					matchup: [i, j],
				});

				if (series.length !== i + 1) {
					matchups[j * rowspan].splice(i, 0, {
						rowspan,
						matchup: [i, numGamesInSide + j],
					});
				}
			}
		}

		const confNames = g.get("confs", inputs.season).map(conf => conf.name); // Display the current or archived playoffs

		const numGamesPlayoffSeries = g.get("numGamesPlayoffSeries", inputs.season);

		const playoffsByConf = await season.getPlayoffsByConf(inputs.season);

		let canEdit =
			finalMatchups && g.get("godMode") && inputs.season === g.get("season");
		if (playIns) {
			for (const playIn of playIns) {
				if (playIn.length > 2) {
					// Play-in tournament started
					canEdit = false;
				}
			}
		}
		if (series.length === 0) {
			canEdit = false;
		} else {
			for (const matchup of series[0]) {
				if (matchup.home.won > 0 || (matchup.away && matchup.away.won > 0)) {
					canEdit = false;
				}
			}
		}

		let teamsToEdit: TeamToEdit[] = [];
		if (canEdit) {
			const teamsUnsorted = await idb.getCopies.teamsPlus(
				{
					attrs: ["tid", "region", "name", "imgURL", "imgURLSmall"],
					seasonAttrs: [
						"cid",
						"did",
						"won",
						"lost",
						"tied",
						"otl",
						"winp",
						"pts",
						"wonDiv",
						"lostDiv",
						"tiedDiv",
						"otlDiv",
						"wonConf",
						"lostConf",
						"tiedConf",
						"otlConf",
					],
					stats: ["pts", "oppPts", "gp"],
					season: g.get("season"),
					active: true,
					showNoStats: true,
				},
				"noCopyCache",
			);

			// Sort teams by normal playoff order
			let teams: typeof teamsUnsorted;
			if (playoffsByConf) {
				teams = [];
				const teamsByConf = groupBy(teamsUnsorted, t => t.seasonAttrs.cid);
				for (const teamsConf of Object.values(teamsByConf)) {
					teams.push(...(await orderTeams(teamsConf, teamsUnsorted)));
				}
			} else {
				teams = await orderTeams(teamsUnsorted, teamsUnsorted);
			}

			// All first round matchups
			const matchupsToCheck = [
				...series[0],
				...(playIns ? playIns.map(playIn => playIn.slice(0, 2)).flat() : []),
			];

			const seedsByTid = new Map();
			for (const matchup of matchupsToCheck) {
				seedsByTid.set(matchup.home.tid, matchup.home.seed);
				if (matchup.away && !matchup.away.pendingPlayIn) {
					seedsByTid.set(matchup.away.tid, matchup.away.seed);
				}
			}

			teamsToEdit = teams.map(t => ({
				tid: t.tid,
				cid: t.seasonAttrs.cid,
				region: t.region,
				name: t.name,
				seed: seedsByTid.get(t.tid),
				imgURL: t.imgURL,
				imgURLSmall: t.imgURLSmall,
				record: helpers.formatRecord(t.seasonAttrs),
			}));
		}

		return {
			canEdit,
			confNames,
			finalMatchups,
			matchups,
			numGamesPlayoffSeries,
			numGamesToWinSeries: numGamesPlayoffSeries.map(
				helpers.numGamesToWinSeries,
			),
			playIns: playIns2,
			playoffsByConf,
			season: inputs.season,
			series: series2,
			teamsToEdit,
			userTid: g.get("userTid"),
		};
	}
};

export default updatePlayoffs;
