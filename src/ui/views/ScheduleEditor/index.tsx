import { useReducer } from "react";
import useTitleBar from "../../hooks/useTitleBar.tsx";
import { helpers } from "../../util/index.ts";
import { DataTable } from "../../components/index.tsx";
import type { View } from "../../../common/types.ts";
import { PHASE, TIME_BETWEEN_GAMES } from "../../../common/constants.ts";
import { groupByUnique, orderBy } from "../../../common/utils.ts";
import { FancySelect, height } from "./FancySelect.tsx";
import { getTeamCols, SummaryTable } from "./SummaryTable.tsx";
import { Dropdown } from "react-bootstrap";

type Schedule = View<"scheduleEditor">["initialSchedule"];

// Not All-Star Game or Trade Deadline
type ActualGame = Extract<Schedule[number], { type: "game" }>;

type ScheduleDay = {
	day: number;
	gamesByAwayTid: Record<number, ActualGame>;
	gamesByHomeTid: Record<number, ActualGame>;
	special: "allStarGame" | "tradeDeadline" | undefined;
};

type Team = View<"scheduleEditor">["teams"][number];

const reducer = (
	schedule: Schedule,
	action:
		| {
				type: "swapHomeAway" | "delete";
				game: ActualGame;
		  }
		| {
				type: "switchAwayTeam";
				away: Team;
				game: ActualGame;
		  }
		| {
				type: "switchHomeTeam";
				home: Team;
				game: ActualGame;
		  }
		| {
				type: "newGame";
				day: number;
				away: Team;
				home: Team;
		  }
		| {
				type: "deleteDay" | "addDay";
				day: number;
		  },
): Schedule => {
	console.log("reducer", action);
	switch (action.type) {
		case "delete":
			return schedule.filter((row) => {
				return row !== action.game;
			});
		case "swapHomeAway":
			return schedule.map((row) => {
				if (row !== action.game) {
					return row;
				}

				return {
					...row,
					awayAbbrev: row.homeAbbrev,
					awayTid: row.homeTid,
					homeAbbrev: row.awayAbbrev,
					homeTid: row.awayTid,
				};
			});
		case "switchAwayTeam":
			return schedule.map((row) => {
				if (row !== action.game) {
					return row;
				}

				return {
					...row,
					awayAbbrev: action.away.seasonAttrs.abbrev,
					awayTid: action.away.tid,
				};
			});
		case "switchHomeTeam":
			return schedule.map((row) => {
				if (row !== action.game) {
					return row;
				}

				return {
					...row,
					homeAbbrev: action.home.seasonAttrs.abbrev,
					homeTid: action.home.tid,
				};
			});
		case "newGame":
			return orderBy(
				[
					...schedule,
					{
						type: "game",
						day: action.day,
						awayAbbrev: action.away.seasonAttrs.abbrev,
						awayTid: action.away.tid,
						homeAbbrev: action.home.seasonAttrs.abbrev,
						homeTid: action.home.tid,
					},
				],
				["day"],
			);
		case "deleteDay":
			return schedule
				.filter((game) => game.day !== action.day)
				.map((game) => {
					if (game.day < action.day) {
						return game;
					}

					return {
						...game,
						day: game.day - 1,
					};
				});
		case "addDay": {
			const placeholderGame = {
				type: "placeholder",
				day: action.day,
			} as const;
			let added = false;
			const scheduleWithNewDay = schedule.flatMap((game) => {
				if (game.day < action.day) {
					return game;
				}

				if (!added) {
					added = true;
					return [
						placeholderGame,
						{
							...game,
							day: game.day + 1,
						},
					];
				}

				return {
					...game,
					day: game.day + 1,
				};
			});

			if (!added) {
				added = true;
				scheduleWithNewDay.push(placeholderGame);
			}

			return scheduleWithNewDay;
		}
	}
};

const ScheduleEditor = ({
	godMode,
	initialSchedule,
	phase,
	teams,
	userTid,
}: View<"scheduleEditor">) => {
	useTitleBar({ title: "Schedule Editor" });

	const [schedule, dispatch] = useReducer(reducer, initialSchedule);

	if (phase !== PHASE.REGULAR_SEASON) {
		return <p>You can only edit the schedule during the regular season.</p>;
	}

	if (!godMode) {
		return (
			<>
				<p>
					You can only edit the schedule in{" "}
					<a href={helpers.leagueUrl(["god_mode"])}>God Mode</a>.
				</p>
			</>
		);
	}

	const scheduleByDay: ScheduleDay[] = [];
	for (const game of schedule) {
		let currentDay = scheduleByDay.at(-1);
		if (!currentDay) {
			if (game.type === "game") {
				currentDay = {
					day: game.day,
					gamesByAwayTid: { [game.awayTid]: game },
					gamesByHomeTid: { [game.homeTid]: game },
					special: undefined,
				};
			} else {
				currentDay = {
					day: game.day,
					gamesByAwayTid: {},
					gamesByHomeTid: {},
					special: game.type === "placeholder" ? undefined : game.type,
				};
			}
			scheduleByDay.push(currentDay);
		} else if (currentDay.day <= game.day) {
			// Add blank days up to this game, if necessary
			let day = currentDay.day;
			let newDay = true;
			while (day < game.day) {
				day += 1;
				newDay = true;

				currentDay = {
					day,
					gamesByAwayTid: {},
					gamesByHomeTid: {},
					special: undefined,
				};
				scheduleByDay.push(currentDay);
			}

			if (game.type === "placeholder") {
				continue;
			}

			if (newDay) {
				if (game.type === "game") {
					currentDay.gamesByAwayTid[game.awayTid] = game;
					currentDay.gamesByHomeTid[game.homeTid] = game;
				} else {
					currentDay.special = game.type;
				}
			} else {
				if (
					currentDay.gamesByHomeTid[game.homeTid] ||
					currentDay.gamesByHomeTid[game.awayTid] ||
					currentDay.gamesByAwayTid[game.homeTid] ||
					currentDay.gamesByAwayTid[game.awayTid]
				) {
					throw new Error(
						`Team ${game.homeTid} has two games on day ${game.day}`,
					);
				}
				if (game.type !== "game") {
					throw new Error(
						"All-Star Game and Trade Deadline must be on their own days",
					);
				}
				currentDay.gamesByAwayTid[game.awayTid] = game;
				currentDay.gamesByHomeTid[game.homeTid] = game;
			}
		} else {
			throw new Error("Schedule is not sorted by day");
		}
	}

	const teamsByTid = groupByUnique(teams, "tid");

	const cols = [
		{
			desc: helpers.upperCaseFirstLetter(TIME_BETWEEN_GAMES),
			title: helpers.upperCaseFirstLetter(TIME_BETWEEN_GAMES[0]!),
		},
		...getTeamCols(teams, userTid),
	];

	const rows = scheduleByDay.map((row) => {
		return {
			key: row.day,
			classNames: row.special ? "table-info" : undefined,
			data: [
				{
					value: (
						<Dropdown>
							<Dropdown.Toggle
								bsPrefix="no-caret"
								style={{
									height,
								}}
								title="Actions"
								variant="btn-link border-0 py-0 px-2 w-100 d-flex align-items-center justify-content-end"
							>
								<span>
									{row.day}{" "}
									<span className="glyphicon glyphicon-option-vertical text-body-secondary" />
								</span>
							</Dropdown.Toggle>
							<Dropdown.Menu>
								<Dropdown.Item
									onClick={() => {
										dispatch({
											type: "deleteDay",
											day: row.day,
										});
									}}
								>
									Delete {TIME_BETWEEN_GAMES} {row.day}
								</Dropdown.Item>
								<Dropdown.Item
									onClick={() => {
										dispatch({
											type: "addDay",
											day: row.day,
										});
									}}
								>
									Add {TIME_BETWEEN_GAMES} above
								</Dropdown.Item>
								<Dropdown.Item
									onClick={() => {
										dispatch({
											type: "addDay",
											day: row.day + 1,
										});
									}}
								>
									Add {TIME_BETWEEN_GAMES} below
								</Dropdown.Item>
							</Dropdown.Menu>
						</Dropdown>
					),
					classNames: "p-0",
				},
				...(row.special
					? [
							{
								value:
									row.special === "allStarGame"
										? "All-Star Game"
										: "Trade Deadline",
								classNames: "text-start",
								colSpanToEnd: true,
							},
						]
					: teams.map((t) => {
							const gameAway = row.gamesByAwayTid[t.tid];
							const gameHome = row.gamesByHomeTid[t.tid];
							const game = gameHome ?? gameAway;
							return {
								value: (
									<FancySelect
										value={
											gameHome
												? gameHome.awayTid
												: gameAway
													? gameAway.homeTid
													: "noGame"
										}
										className={
											row.gamesByAwayTid[t.tid]
												? "text-body-secondary"
												: undefined
										}
										onChange={(event) => {
											const value = event.target.value;
											if (value === "delete" || value === "swapHomeAway") {
												if (game) {
													dispatch({
														type: value,
														game: game,
													});
												}
											} else {
												const tid = parseInt(value);
												const t2 = teamsByTid[tid];
												if (t2) {
													if (gameHome) {
														dispatch({
															type: "switchAwayTeam",
															away: t2,
															game: gameHome,
														});
													} else if (gameAway) {
														dispatch({
															type: "switchHomeTeam",
															home: t2,
															game: gameAway,
														});
													} else {
														dispatch({
															type: "newGame",
															away: t2,
															home: t,
															day: row.day,
														});
													}
												}
											}
										}}
										onMiddleClick={
											game
												? () => {
														dispatch({
															type: "swapHomeAway",
															game: game,
														});
													}
												: undefined
										}
										options={[
											...(game
												? [
														{
															key: "summary",
															value: `${game.awayAbbrev} @ ${game.homeAbbrev}`,
														},
														{ key: "delete", value: "Delete game" },
														{
															key: "swapHomeAway",
															value: "Swap home/away",
														},
													]
												: [
														{
															key: "summary",
															value: `${t.seasonAttrs.abbrev} vs...`,
														},
													]),
											...teams
												.filter((t2) => {
													// Don't show self
													if (t2.tid === t.tid) {
														return false;
													}

													// Keep team in list if it's the current opponent
													if (
														gameAway?.homeTid === t2.tid ||
														gameHome?.awayTid === t2.tid
													) {
														return true;
													}

													// Hide all teams with other games already
													return (
														!row.gamesByAwayTid[t2.tid] &&
														!row.gamesByHomeTid[t2.tid]
													);
												})
												.map((t2) => {
													return {
														key: t2.tid,
														value: t2.seasonAttrs.abbrev,
													};
												}),
										]}
									/>
								),
								classNames: "p-0",
							};
						})),
			],
		};
	});

	return (
		<div>
			<p>
				Home games are shown in normal text and away games are shown in{" "}
				<span className="text-body-secondary">faded text</span>.
			</p>
			<p>Click anywhere in the table to create/update/delete a game.</p>
			{!window.mobile ? (
				<p>Middle click on a game to quickly swap the home and away teams.</p>
			) : null}
			<DataTable
				className="text-center"
				cols={cols}
				defaultSort="disableSort"
				hideAllControls
				name="ScheduleEditor"
				rows={rows}
			/>

			<h2>Schedule Statistics</h2>
			<p className="mb-0">
				The numbers in this table show the total number of games for each
				team/category, and then below that is (# home games) / (# away games).
			</p>
			<SummaryTable
				schedule={schedule}
				teams={teams}
				teamsByTid={teamsByTid}
				userTid={userTid}
			/>
		</div>
	);
};

export default ScheduleEditor;
