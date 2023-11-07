import {
	memo,
	Fragment,
	type MouseEvent,
	type ReactNode,
	useState,
	type CSSProperties,
	forwardRef,
} from "react";
import ResponsiveTableWrapper from "./ResponsiveTableWrapper";
import { getCols, processPlayerStats } from "../util";
import { filterPlayerStats, getPeriodName, helpers } from "../../common";
import { PLAYER_GAME_STATS } from "../../common/constants.football";
import type { Col, SortBy } from "./DataTable";
import updateSortBys from "./DataTable/updateSortBys";
import { getSortClassName } from "./DataTable/Header";
import range from "lodash-es/range";
import classNames from "classnames";
import {
	formatClock,
	getScoreInfo,
	getText,
	scrimmageToFieldPos,
	type SportState,
} from "../util/processLiveGameEvents.football";
import { OverlayTrigger, Popover } from "react-bootstrap";
import type { PlayByPlayEventScore } from "../../worker/core/GameSim.football/PlayByPlayLogger";

type Team = {
	abbrev: string;
	colors: [string, string, string];
	name: string;
	region: string;
	players: any[];
	season?: number;
};

type BoxScore = {
	gid: number;
	scoringSummary: PlayByPlayEventScore[];
	teams: [Team, Team];
	numPeriods?: number;
	exhibition?: boolean;
};

export const StatsHeader = ({
	cols,
	onClick,
	sortBys,
	sortable,
}: {
	cols: Col[];
	onClick: (b: MouseEvent, a: number) => void;
	sortBys: SortBy[];
	sortable: boolean;
}) => {
	return (
		<>
			{cols.map((col, i) => {
				const { desc, title } = col;

				let className: string | undefined;

				if (sortable) {
					className = getSortClassName(sortBys, i);
				}

				return (
					<th
						className={className}
						key={i}
						onClick={event => {
							onClick(event, i);
						}}
						title={desc}
					>
						{title}
					</th>
				);
			})}
		</>
	);
};

export const sortByStats = (
	stats: string[],
	seasonStats: string[] | undefined,
	sortBys: SortBy[],
	getValue?: (p: any, stat: string) => number,
) => {
	return (a: any, b: any) => {
		for (const [index, order] of sortBys) {
			let stat = stats[index];
			let statsObject = "processed";
			if (stat === undefined && seasonStats) {
				stat = seasonStats[index - stats.length];
				statsObject = "seasonStats";
			}

			const aValue = getValue?.(a, stat) ?? a[statsObject][stat];
			const bValue = getValue?.(b, stat) ?? b[statsObject][stat];

			if (bValue !== aValue) {
				const diff = bValue - aValue;
				if (order === "asc") {
					return -diff;
				}
				return diff;
			}
		}
		return 0;
	};
};

const StatsTableIndividual = ({
	Row,
	exhibition,
	t,
	type,
}: {
	Row: any;
	exhibition?: boolean;
	t: BoxScore["teams"][number];
	type: keyof typeof PLAYER_GAME_STATS;
}) => {
	const stats = PLAYER_GAME_STATS[type].stats;
	const cols = getCols(stats.map(stat => `stat:${stat}`));

	const [sortBys, setSortBys] = useState(() => {
		return PLAYER_GAME_STATS[type].sortBy.map(
			stat => [stats.indexOf(stat), "desc"] as SortBy,
		);
	});

	const onClick = (event: MouseEvent, i: number) => {
		setSortBys(
			prevSortBys =>
				updateSortBys({
					cols,
					event,
					i,
					prevSortBys,
				}) ?? [],
		);
	};

	const players = t.players
		.map(p => {
			return {
				...p,
				processed: processPlayerStats(p, stats),
			};
		})
		.filter(p => filterPlayerStats(p, stats, type))
		.sort(sortByStats(stats, undefined, sortBys));

	const sortable = players.length > 1;
	const highlightCols = sortable ? sortBys.map(sortBy => sortBy[0]) : undefined;

	return (
		<div className="mb-3">
			<ResponsiveTableWrapper>
				<table className="table table-striped table-borderless table-sm table-hover">
					<thead>
						<tr>
							<th colSpan={2}>
								{t.season !== undefined ? `${t.season} ` : null}
								{t.region} {t.name}
							</th>
							<StatsHeader
								cols={cols}
								onClick={onClick}
								sortBys={sortBys}
								sortable={sortable}
							/>
						</tr>
					</thead>
					<tbody>
						{players.map((p, i) => (
							<Row
								key={p.pid}
								exhibition={exhibition}
								i={i}
								p={p}
								stats={stats}
								highlightCols={highlightCols}
							/>
						))}
					</tbody>
				</table>
			</ResponsiveTableWrapper>
		</div>
	);
};

const StatsTable = ({
	Row,
	boxScore,
	type,
}: {
	Row: any;
	boxScore: BoxScore;
	type: keyof typeof PLAYER_GAME_STATS;
}) => {
	return (
		<>
			{boxScore.teams.map((t, i) => (
				<StatsTableIndividual
					key={i}
					Row={Row}
					exhibition={boxScore.exhibition}
					t={t}
					type={type}
				/>
			))}
		</>
	);
};

// Condenses TD + XP/2P into one event rather than two, and normalizes scoring summary events into consistent format (old style format had the text in it already, new one is just raw metadata from game sim)
const processEvents = (events: PlayByPlayEventScore[], numPeriods: number) => {
	const processedEvents: {
		quarter: string;
		score: [number, number];
		scoreType: string | null;
		t: 0 | 1;
		text: string;
		time: string;
	}[] = [];
	const score = [0, 0] as [number, number];

	for (const event of events) {
		let text: string | undefined;

		const oldEvent = event as any;
		const isOldFormat = oldEvent.text !== undefined;
		if (isOldFormat) {
			// This is an old format entry, with the text already generated!
			text = oldEvent.text;
		} else {
			// This is a new format entry, with metadata that needs to be turned into text
			text = getText(event, numPeriods);
		}

		if (text === undefined) {
			continue;
		}

		// Old format already had team IDs swapped!
		const actualT = isOldFormat ? event.t : event.t === 0 ? 1 : 0;
		const otherT = actualT === 0 ? 1 : 0;

		const scoreInfo = getScoreInfo(text);
		if (scoreInfo.type === "SF") {
			// Safety is recorded as part of a play by the team with the ball, so for scoring purposes we need to swap the teams here and below
			score[otherT] += scoreInfo.points;
		} else {
			score[actualT] += scoreInfo.points;
		}

		const prevEvent: any = processedEvents.at(-1);

		if (prevEvent && scoreInfo.type === "XP") {
			prevEvent.score = score.slice();
			prevEvent.text += ` (${text})`;
		} else if (
			prevEvent &&
			scoreInfo.type === "2P" &&
			event.t === prevEvent.t
		) {
			prevEvent.score = score.slice();
			prevEvent.text += ` (${text})`;
		} else {
			processedEvents.push({
				t: scoreInfo.type === "SF" ? otherT : actualT, // See comment above about safety teams
				quarter: isOldFormat
					? oldEvent.quarter
					: event.quarter <= numPeriods
					? `Q${event.quarter}`
					: `OT${event.quarter - numPeriods}`,
				time: isOldFormat ? oldEvent.time : formatClock(event.clock),
				text,
				score: helpers.deepCopy(score),
				scoreType: scoreInfo.type,
			});
		}
	}

	return processedEvents;
};

const getCount = (events: PlayByPlayEventScore[]) => {
	return events.length;
};

const ScoringSummary = memo(
	({
		events,
		numPeriods,
		teams,
	}: {
		count: number;
		events: PlayByPlayEventScore[];
		numPeriods: number;
		teams: [Team, Team];
	}) => {
		let prevQuarter: string;

		const processedEvents = processEvents(events, numPeriods);

		if (processedEvents.length === 0) {
			return <p>None</p>;
		}

		return (
			<table className="table table-sm border-bottom">
				<tbody>
					{processedEvents.map((event, i) => {
						let quarterText = "???";
						if (event.quarter.startsWith("OT")) {
							const overtimes = parseInt(event.quarter.replace("OT", ""));
							if (overtimes > 1) {
								quarterText = `${helpers.ordinal(overtimes)} overtime`;
							} else {
								quarterText = "Overtime";
							}
						} else {
							const quarter = parseInt(event.quarter.replace("Q", ""));
							if (!Number.isNaN(quarter)) {
								quarterText = `${helpers.ordinal(quarter)} ${getPeriodName(
									numPeriods,
								)}`;
							}
						}

						let quarterHeader: ReactNode = null;
						if (event.quarter !== prevQuarter) {
							prevQuarter = event.quarter;
							quarterHeader = (
								<tr>
									<td className="text-body-secondary" colSpan={5}>
										{quarterText}
									</td>
								</tr>
							);
						}

						return (
							<Fragment key={i}>
								{quarterHeader}
								<tr>
									<td>{teams[event.t].abbrev}</td>
									<td>{event.scoreType}</td>
									<td>
										{event.t === 0 ? (
											<>
												<b>{event.score[0]}</b>-
												<span className="text-body-secondary">
													{event.score[1]}
												</span>
											</>
										) : (
											<>
												<span className="text-body-secondary">
													{event.score[0]}
												</span>
												-<b>{event.score[1]}</b>
											</>
										)}
									</td>
									<td>{event.time}</td>
									<td style={{ whiteSpace: "normal" }}>{event.text}</td>
								</tr>
							</Fragment>
						);
					})}
				</tbody>
			</table>
		);
	},
	(prevProps, nextProps) => {
		return prevProps.count === nextProps.count;
	},
);

// 12 is for 2 endzones and 10 10-yard areas in between
const NUM_SECTIONS = 12;
const DEFAULT_HEIGHT = 200;

const FieldBackground = ({ t, t2 }: { t: Team; t2: Team }) => {
	return (
		<div className="d-flex align-items-stretch position-absolute w-100 h-100">
			{range(NUM_SECTIONS).map(i => {
				const style: CSSProperties = {
					width: `${(1 / 12) * 100}%`,
				};
				const ENDZONE_OFFENSE = i === 0;
				const ENDZONE_DEFENSE = i === NUM_SECTIONS - 1;

				const endzoneTeam = ENDZONE_OFFENSE
					? t
					: ENDZONE_DEFENSE
					? t2
					: undefined;
				if (endzoneTeam) {
					style.backgroundColor = endzoneTeam.colors[0];
					style.color = endzoneTeam.colors[1];
					style.writingMode = "vertical-lr";
				}
				if (ENDZONE_OFFENSE) {
					style.transform = "rotate(180deg)";
				}

				let yardLine: number | undefined;
				if (i > 1 && i <= 6) {
					yardLine = (i - 1) * 10;
				} else if (i > 6 && i <= 10) {
					yardLine = 100 - (i - 1) * 10;
				}

				return (
					<div
						key={i}
						className={classNames("d-flex", {
							"border-start": i > 0,
							"bg-success": !endzoneTeam,
							"align-items-center justify-content-center": endzoneTeam,
							"flex-column justify-content-between": yardLine !== undefined,
						})}
						style={style}
					>
						{endzoneTeam ? (
							<div
								className="fs-2 text-center overflow-hidden"
								style={{ whiteSpace: "nowrap" }}
							>
								{endzoneTeam.name}
							</div>
						) : null}
						{yardLine !== undefined ? (
							<>
								{range(2).map(i => (
									<div key={i} style={{ marginLeft: "-.5rem" }}>
										{yardLine}
									</div>
								))}
							</>
						) : null}
					</div>
				);
			})}
		</div>
	);
};

const yardsToPercent = (yards: number) => {
	return (Math.abs(yards) * 10) / NUM_SECTIONS;
};

const yardLineToPercent = (yards: number) => {
	return ((10 + yards) * 10) / NUM_SECTIONS;
};

const VerticalLine = ({ color, yards }: { color: string; yards: number }) => {
	return (
		<div
			className="position-absolute h-100"
			style={{
				width: 2,
				backgroundColor: color,
				left: `${yardLineToPercent(yards)}%`,
			}}
		/>
	);
};

const PlayBar = forwardRef<
	HTMLDivElement,
	{
		first: boolean;
		kickoff: boolean;
		last: boolean;
		play: SportState["plays"][number];
		t: 0 | 1;
	}
>(
	(
		{
			first,
			kickoff,
			last,
			play,
			t,
			...props // https://github.com/react-bootstrap/react-bootstrap/issues/2208
		},
		ref,
	) => {
		const TAG_WIDTH = 60;

		const negative = play.yards < 0;

		// True if this is a kickoff or punt
		const intendedChangeOfPossession = false;

		const turnover = intendedChangeOfPossession
			? t === play.t && !first
			: t !== play.t;

		let score: string | undefined;
		if (play.scoreInfos.length > 0) {
			score = `${play.scoreInfos.map(info => info.type).join("+")}`;
		}

		const yardLinePercent = yardLineToPercent(play.scrimmage);
		const yardsPercent = yardsToPercent(play.yards);

		// -2 is to account for border
		let marginLeft;
		if (negative) {
			marginLeft = `calc(${yardLinePercent}% - ${yardsPercent}%)`;
		} else {
			marginLeft = `calc(${yardLineToPercent(play.scrimmage)}% - ${
				TAG_WIDTH - 2
			}px)`;
		}

		const borderStyleName = negative ? "borderLeft" : ("borderRight" as const);

		return (
			<div
				className={`d-flex ${first ? "mt-4" : "mt-1"}${last ? " mb-4" : ""}`}
				style={{
					// For some reason this puts it above the field background and below dropdown menus
					zIndex: 0,
				}}
			>
				<div
					ref={ref}
					className={`${negative ? "rounded-end" : "rounded-start"}`}
					style={{
						backgroundColor: turnover
							? "var(--bs-red)"
							: score
							? "var(--bs-yellow)"
							: intendedChangeOfPossession
							? "var(--bs-gray-200)"
							: "var(--bs-blue)",
						marginLeft,
						width: `calc(${TAG_WIDTH}px + ${yardsPercent}%)`,
					}}
					{...props}
				>
					<div
						className={`${
							negative
								? "text-start ps-1 rounded-end float-end"
								: "text-end pe-1 rounded-start"
						}`}
						style={{
							width: TAG_WIDTH,
							[borderStyleName]: "2px solid var(--bs-blue)",
							backgroundColor: turnover
								? "var(--bs-red)"
								: score
								? "var(--bs-yellow)"
								: "var(--bs-gray-400)",
							color: turnover ? "var(--bs-black)" : "var(--bs-white)",
						}}
					>
						{kickoff
							? "Kickoff"
							: `${helpers.ordinal(play.down)} & ${play.toGo}`}
					</div>
				</div>
				{score ? (
					<div
						className={`px-1 ${
							negative ? "text-end rounded-start" : "text-start rounded-end"
						}`}
						style={{
							backgroundColor: "var(--bs-yellow)",
							color: "var(--bs-white)",
						}}
					>
						{score}
					</div>
				) : null}
			</div>
		);
	},
);

const FieldAndDrive = ({
	boxScore,
	sportState,
}: {
	boxScore: BoxScore;
	sportState: SportState;
}) => {
	const t = sportState.t;
	const t2 = t === 0 ? 1 : 0;

	const yards = sportState.scrimmage - sportState.initialScrimmage;

	return (
		<div className="mb-3">
			<div className="d-flex mb-1">
				{sportState.text}
				{!sportState.awaitingKickoff ? (
					<div className="ms-auto">
						Drive: {sportState.numPlays} play
						{sportState.numPlays === 1 ? "" : "s"}, {yards} yard
						{yards === 1 ? "" : "s"}
					</div>
				) : null}
			</div>
			<div
				className="position-relative d-flex flex-column"
				style={{
					minHeight: DEFAULT_HEIGHT,
				}}
			>
				<FieldBackground t={boxScore.teams[t]} t2={boxScore.teams[t2]} />
				<VerticalLine color="var(--bs-blue)" yards={sportState.scrimmage} />
				{!sportState.awaitingKickoff ? (
					<VerticalLine
						color="var(--bs-yellow)"
						yards={sportState.scrimmage + sportState.toGo}
					/>
				) : null}
				{sportState.plays.map((play, i) => {
					return (
						<OverlayTrigger
							key={i}
							trigger={["click", "hover"]}
							placement="auto"
							overlay={
								<Popover>
									<Popover.Body>
										<ul className="mb-0 list-unstyled">
											{sportState.awaitingKickoff ? (
												i === 0 ? (
													<li>
														{boxScore.teams[sportState.t].abbrev} kicking off
													</li>
												) : null
											) : (
												<li>
													{helpers.ordinal(play.down)} & {play.toGo},{" "}
													{scrimmageToFieldPos(play.scrimmage)}
												</li>
											)}
											{play.texts.map((text, j) => (
												<li key={j}>{text}</li>
											))}
										</ul>
									</Popover.Body>
								</Popover>
							}
							rootClose
						>
							<PlayBar
								first={i === 0}
								kickoff={sportState.awaitingKickoff}
								last={i === sportState.plays.length - 1}
								play={play}
								t={sportState.t}
							/>
						</OverlayTrigger>
					);
				})}
			</div>
		</div>
	);
};

const BoxScore = ({
	boxScore,
	sportState,
	Row,
}: {
	boxScore: BoxScore;
	sportState: SportState;
	Row: any;
}) => {
	const liveGameSim = (boxScore as any).won?.name === undefined;

	return (
		<div className="mb-3">
			{liveGameSim ? (
				<FieldAndDrive boxScore={boxScore} sportState={sportState} />
			) : undefined}

			<h2>Scoring Summary</h2>
			<ScoringSummary
				key={boxScore.gid}
				count={getCount(boxScore.scoringSummary)}
				events={boxScore.scoringSummary}
				numPeriods={boxScore.numPeriods ?? 4}
				teams={boxScore.teams}
			/>
			{[
				"Passing",
				"Rushing",
				"Receiving",
				"Kicking",
				"Punting",
				"Returns",
				"Defense",
			].map(title => (
				<Fragment key={title}>
					<h2>{title}</h2>
					<StatsTable
						Row={Row}
						boxScore={boxScore}
						type={title.toLowerCase() as any}
					/>
				</Fragment>
			))}
		</div>
	);
};

export default BoxScore;
