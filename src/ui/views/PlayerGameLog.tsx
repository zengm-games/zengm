import useTitleBar from "../hooks/useTitleBar.tsx";
import type { View } from "../../common/types.ts";
import TopStuff from "./Player/TopStuff.tsx";
import { getCols, helpers } from "../util/index.ts";
import { DataTable, InjuryIcon } from "../components/index.tsx";
import { NoGamesMessage } from "./GameLog.tsx";
import type { DataTableRow } from "../components/DataTable/index.tsx";
import { isSport } from "../../common/index.ts";
import clsx from "clsx";

type DecisionPlayer = {
	w: number;
	l: number;
	sv: number;
	bs: number;
	hld: number;
	seasonStats: {
		w: number;
		l: number;
		sv: number;
		bs: number;
		hld: number;
	};
};

const baseballDecision = (p: DecisionPlayer) => {
	if (p.w > 0) {
		if (p.bs > 0) {
			return "BW";
		}

		return "W";
	}

	if (p.l > 0) {
		if (p.bs > 0) {
			return "BL";
		}
		if (p.hld > 0) {
			return "HL";
		}
		return "L";
	}

	if (p.sv > 0) {
		return "SV";
	}

	if (p.bs > 0) {
		return "BS";
	}

	if (p.hld > 0) {
		return "H";
	}
};

const baseballDecisionGames = (
	p: DecisionPlayer,
	decision: NonNullable<ReturnType<typeof baseballDecision>>,
) => {
	if (
		decision === "W" ||
		decision === "BW" ||
		decision === "L" ||
		decision === "BL" ||
		decision === "HL"
	) {
		return {
			count: p.seasonStats.w + p.seasonStats.l,
			formatted: helpers.formatRecord({
				won: p.seasonStats.w,
				lost: p.seasonStats.l,
			}),
		};
	} else if (decision === "SV") {
		return {
			count: p.seasonStats.sv,
			formatted: `${p.seasonStats.sv}`,
		};
	} else if (decision === "BS") {
		return {
			count: p.seasonStats.bs,
			formatted: `${p.seasonStats.bs}`,
		};
	} else if (decision === "H") {
		return {
			count: p.seasonStats.hld,
			formatted: `${p.seasonStats.hld}`,
		};
	} else {
		throw new Error("Should never happen");
	}
};

export const BaseballDecision = ({
	className,
	exhibition,
	p,
	wlColors,
}: {
	className?: string;
	exhibition?: boolean;
	p: DecisionPlayer;
	wlColors?: boolean;
}) => {
	const decision = baseballDecision(p);
	if (decision !== undefined) {
		const colorClassName = wlColors
			? decision === "W" || decision === "BW"
				? "text-success"
				: decision === "L" || decision === "BL" || decision === "HL"
					? "text-danger"
					: undefined
			: undefined;
		const { formatted } = baseballDecisionGames(p, decision);

		return (
			<span className={clsx(colorClassName, className)}>
				{decision}
				{exhibition || formatted === undefined ? null : <> ({formatted})</>}
			</span>
		);
	}

	return null;
};

const wrappedBaseballDecision = (p: DecisionPlayer) => {
	let searchValue;
	let sortValue = ""; // Otherwise it doesn't work if undefined
	const decision = baseballDecision(p);
	if (decision !== undefined) {
		const { count, formatted } = baseballDecisionGames(p, decision);
		searchValue = `${decision} (${formatted})`;
		sortValue = `${decision}${count + 10000}`;
	}

	return {
		value: <BaseballDecision p={p} />,
		searchValue,
		sortValue,
	};
};

const PlayerGameLog = ({
	bestPos,
	currentSeason,
	customMenu,
	freeAgent,
	gender,
	godMode,
	injured,
	jerseyNumberInfos,
	numGamesPlayoffSeires,
	phase,
	player,
	randomDebutsForeverPids,
	retired,
	showContract,
	showRatings,
	showTradeFor,
	showTradingBlock,
	spectator,
	statSummary,
	teamColors,
	teamJersey,
	teamName,
	teamURL,
	userTid,
	willingToSign,
	gameLog,
	season,
	seasonsWithStats,
	showDecisionColumn,
	stats,
	superCols,
}: View<"playerGameLog">) => {
	useTitleBar({
		title: player.name,
		customMenu,
		dropdownView: "player_game_log",
		dropdownFields: {
			playerProfile: "gameLog",
			seasons: season,
		},
		dropdownCustomOptions: {
			seasons: seasonsWithStats.map((season) => ({
				key: season,
				value: String(season),
			})),
		},
		dropdownCustomURL: (fields) => {
			const parts =
				fields.playerProfile === "gameLog"
					? ["player_game_log", player.pid, fields.seasons]
					: ["player", player.pid];

			return helpers.leagueUrl(parts);
		},
	});

	const cols = getCols([
		"#",
		"Team",
		"@",
		"Opp",
		"Result",
		"Record",
		"",
		...(isSport("baseball") && showDecisionColumn ? ["Decision"] : []),
		...stats.map((stat) => `stat:${stat}`),
	]);

	const makeRow = (game: (typeof gameLog)[number], i: number): DataTableRow => {
		return {
			key: i,
			data: [
				i + 1,
				<>
					{game.seed !== undefined ? `${game.seed}. ` : null}
					<a
						href={helpers.leagueUrl([
							"roster",
							`${game.abbrev}_${game.tid}`,
							season,
						])}
					>
						{game.abbrev}
					</a>
				</>,
				game.away ? "@" : "",
				{
					value: (
						<>
							{game.oppSeed !== undefined ? `${game.oppSeed}. ` : null}
							<a
								href={helpers.leagueUrl([
									"roster",
									`${game.oppAbbrev}_${game.oppTid}`,
									season,
								])}
							>
								{game.oppAbbrev}
							</a>
						</>
					),
					sortValue: game.oppAbbrev,
					searchValue: game.oppAbbrev,
				},
				{
					value: (
						<a
							href={helpers.leagueUrl([
								"game_log",
								game.tid < 0 ? "special" : `${game.abbrev}_${game.tid}`,
								season,
								game.gid,
							])}
						>
							{game.result}
						</a>
					),
					sortValue: game.diff,
					searchValue: game.result,
				},
				helpers.formatRecord(game),
				{
					value: <InjuryIcon className="ms-0" injury={game.injury} />,
					sortValue: game.injury.gamesRemaining,
					searchValue: game.injury.gamesRemaining,
					classNames: "text-center",
				},
				...(isSport("baseball") && showDecisionColumn
					? [wrappedBaseballDecision(game.stats as any)]
					: []),
				...stats.map((stat) =>
					game.stats[stat] === undefined
						? undefined
						: helpers.roundStat(game.stats[stat], stat, true),
				),
			],
		};
	};

	const rowsRegularSeason = gameLog
		.filter((game) => !game.playoffs)
		.map(makeRow);

	const playoffGames = gameLog.filter((game) => game.playoffs);
	const rowsPlayoffs = playoffGames.map(makeRow);

	// Add separators to playoff series when there is one more than a single game
	let striped;
	if (numGamesPlayoffSeires.some((numGames) => numGames > 1)) {
		striped = false;

		let prevOppTid;
		let oppTidCounter = -1;
		const classes = [
			"",
			"table-info",
			"table-primary",
			"table-success",
			"table-light",
			"table-danger",
			"table-warning",
			"table-secondary",
			"table-active",
		];
		for (const [i, game] of playoffGames.entries()) {
			if (game.oppTid !== prevOppTid) {
				prevOppTid = game.oppTid;
				oppTidCounter += 1;
			}

			rowsPlayoffs[i]!.classNames = classes[oppTidCounter % classes.length];
		}
	} else {
		striped = true;
	}

	let noGamesMessage;
	if (gameLog.length === 0) {
		noGamesMessage = (
			<NoGamesMessage warnAboutDelete={season < currentSeason} />
		);
	}

	return (
		<>
			<TopStuff
				bestPos={bestPos}
				currentSeason={currentSeason}
				freeAgent={freeAgent}
				gender={gender}
				godMode={godMode}
				injured={injured}
				jerseyNumberInfos={jerseyNumberInfos}
				phase={phase}
				player={player}
				randomDebutsForeverPids={randomDebutsForeverPids}
				retired={retired}
				season={season}
				showContract={showContract}
				showRatings={showRatings}
				showTradeFor={showTradeFor}
				showTradingBlock={showTradingBlock}
				spectator={spectator}
				statSummary={statSummary}
				teamColors={teamColors}
				teamJersey={teamJersey}
				teamName={teamName}
				teamURL={teamURL}
				userTid={userTid}
				willingToSign={willingToSign}
			/>

			{noGamesMessage ? (
				noGamesMessage
			) : (
				<>
					{rowsRegularSeason.length > 0 ? (
						<>
							<DataTable
								cols={cols}
								defaultSort={[0, "asc"]}
								name="PlayerGameLog"
								rows={rowsRegularSeason}
								superCols={superCols}
							/>
						</>
					) : null}
					{rowsPlayoffs.length > 0 ? (
						<>
							<DataTable
								className={rowsRegularSeason.length > 0 ? "mt-5" : undefined}
								cols={cols}
								defaultSort={[0, "asc"]}
								name="PlayerGameLogPlayoffs"
								rows={rowsPlayoffs}
								striped={striped}
								superCols={superCols}
								title={<h2>Playoffs</h2>}
							/>
						</>
					) : null}
				</>
			)}
		</>
	);
};

export default PlayerGameLog;
