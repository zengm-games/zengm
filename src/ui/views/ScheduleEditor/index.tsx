import { useEffect, useReducer, useRef, useState } from "react";
import useTitleBar from "../../hooks/useTitleBar.tsx";
import {
	confirm,
	helpers,
	logEvent,
	toWorker,
	useLocalPartial,
} from "../../util/index.ts";
import { DataTable, StickyBottomButtons } from "../../components/index.tsx";
import type { View } from "../../../common/types.ts";
import { PHASE, TIME_BETWEEN_GAMES } from "../../../common/constants.ts";
import { groupByUnique, orderBy } from "../../../common/utils.ts";
import { FancySelect, height } from "./FancySelect.tsx";
import { getTeamCols, SummaryTable } from "./SummaryTable.tsx";
import { Dropdown } from "react-bootstrap";
import { RegenerateScheduleModal } from "./RegenerateScheduleModal.tsx";
import clsx from "clsx";

type Schedule = View<"scheduleEditor">["schedule"];

// Not All-Star Game or Trade Deadline
type ActualGame = Extract<Schedule[number], { type: "completed" | "game" }>;

type ScheduleDay = {
	day: number;
	gamesByAwayTid: Record<number, ActualGame>;
	gamesByHomeTid: Record<number, ActualGame>;
	special: "allStarGame" | "tradeDeadline" | undefined;
};

type Team = View<"scheduleEditor">["teams"][number];

const deleteSpecial = (
	schedule: Schedule,
	type: "allStarGame" | "tradeDeadline",
) => {
	let day: number | undefined;
	return schedule
		.filter((row) => {
			if (row.type === type) {
				day = row.day;
				return false;
			}
			return true;
		})
		.map((game) => {
			if (day === undefined || game.day <= day) {
				return game;
			}

			return {
				...game,
				day: game.day - 1,
			};
		});
};

const addGameOnDayByItself = (
	schedule: Schedule,
	gameToAdd: Schedule[number],
) => {
	let added = false;
	const scheduleWithNewDay = schedule.flatMap((game) => {
		if (game.day < gameToAdd.day) {
			return game;
		}

		if (!added) {
			added = true;
			return [
				gameToAdd,
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
		scheduleWithNewDay.push(gameToAdd);
	}

	return scheduleWithNewDay;
};

const notifyPlaceSpecial = (
	type: "allStarGame" | "tradeDeadline",
	day: number,
) => {
	// Without setTimeout, React complains about updating another component when rendering
	setTimeout(() => {
		logEvent({
			type: "info",
			text: `Placed the ${type === "allStarGame" ? "All-Star Game" : "trade deadline"} on day ${day}`,
			saveToDb: false,
		});
	});
};

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
		  }
		| {
				type: "dragDay";
				oldDay: number;
				newDay: number;
		  }
		| {
				type: "swapDays";
				day1: number;
				day2: number;
		  }
		| {
				type: "resetSchedule";
				schedule: Schedule;
		  }
		| {
				type: "clearSchedule";
				maxDayAlreadyPlayed: number;
		  }
		| {
				type: "deleteSpecial";
				special: "allStarGame" | "tradeDeadline";
		  }
		| {
				type: "placeSpecial";
				special: "allStarGame" | "tradeDeadline";
				value: number;
		  },
): Schedule => {
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

				// New team means forceWin may no longer apply
				if (row.forceWin !== undefined) {
					delete row.forceWin;
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

				// New team means forceWin may no longer apply
				if (row.forceWin !== undefined) {
					delete row.forceWin;
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
			return addGameOnDayByItself(schedule, placeholderGame);
		}
		case "dragDay":
			return orderBy(
				schedule.map((game) => {
					const minDay = Math.min(action.newDay, action.oldDay);
					const maxDay = Math.max(action.newDay, action.oldDay);

					if (game.day < minDay || game.day > maxDay) {
						return game;
					}

					if (game.day === action.oldDay) {
						return {
							...game,
							day: action.newDay,
						};
					}

					// By now it means we are in between newDay and oldDay
					if (action.newDay > action.oldDay) {
						return {
							...game,
							day: game.day - 1,
						};
					} else {
						return {
							...game,
							day: game.day + 1,
						};
					}
				}),
				["day"],
			);
		case "swapDays":
			return orderBy(
				schedule.map((game) => {
					if (game.day === action.day1) {
						return {
							...game,
							day: action.day2,
						};
					}

					if (game.day === action.day2) {
						return {
							...game,
							day: action.day1,
						};
					}

					return game;
				}),
				["day"],
			);
		case "resetSchedule":
			return action.schedule;
		case "clearSchedule": {
			// Can't clear completed games! Not sure why any is needed
			const newSchedule: Schedule = schedule.filter(
				(game) => game.type === "completed",
			);

			if (newSchedule.length === 0) {
				// If no games, need a placeholder so games can be added
				newSchedule.push({
					type: "placeholder",
					day: action.maxDayAlreadyPlayed + 1,
				});
			}

			return newSchedule;
		}
		case "deleteSpecial": {
			return deleteSpecial(schedule, action.special);
		}
		case "placeSpecial": {
			// Delete any existing ones
			const newSchedule = deleteSpecial(schedule, action.special);

			const index = Math.round(
				helpers.bound(action.value, 0, 1) * newSchedule.length,
			);

			const existingGame = newSchedule[index] ?? newSchedule[index - 1];
			const specialGame: Schedule[number] =
				action.special === "allStarGame"
					? {
							type: "allStarGame",
							day: 0,
							homeTid: -1,
							awayTid: -2,
						}
					: {
							type: "tradeDeadline",
							day: 0,
							homeTid: -3,
							awayTid: -3,
						};

			let newNewSchedule;
			if (!existingGame) {
				specialGame.day = (newSchedule.at(-1)?.day ?? 0) + 1;

				newNewSchedule = [...newSchedule, specialGame];
			} else if (existingGame.type === "placeholder") {
				specialGame.day = existingGame.day;

				newNewSchedule = newSchedule.map((game) => {
					if (game === existingGame) {
						return specialGame;
					}

					return game;
				});
			} else if (existingGame.type === "completed") {
				// Put after any completed days
				const lastCompletedGame = newSchedule.findLast(
					(game) => game.type === "completed",
				)!;
				specialGame.day = lastCompletedGame.day + 1;

				newNewSchedule = addGameOnDayByItself(newSchedule, specialGame);
			} else {
				specialGame.day = existingGame.day + 1;

				newNewSchedule = addGameOnDayByItself(newSchedule, specialGame);
			}

			notifyPlaceSpecial(action.special, specialGame.day);

			return newNewSchedule;
		}
	}
};

const ScheduleEditor = ({
	allStarGame,
	allStarGameAlreadyHappened,
	canRegenerateSchedule,
	maxDayAlreadyPlayed,
	phase,
	schedule: scheduleProp,
	teams,
	tradeDeadline,
	userTid,
}: View<"scheduleEditor">) => {
	useTitleBar({ title: "Schedule Editor" });

	const [schedule, dispatch] = useReducer(reducer, scheduleProp);
	const [showSummaryStatistics, setShowSummaryStatistics] = useState(false);

	// Reset the saved schedule state when simming a game or something else that will affect this
	const isFirstRender = useRef(true);
	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false;
		} else {
			dispatch({ type: "resetSchedule", schedule: scheduleProp });
		}
	}, [scheduleProp]);

	const { godMode } = useLocalPartial(["godMode"]);

	const [saving, setSaving] = useState(false);
	const [showRegenerateScheduleModal, setShowRegenerateScheduleModal] =
		useState(false);
	const [regenerated, setRegenerated] = useState(false);

	if (phase !== PHASE.REGULAR_SEASON && phase !== PHASE.AFTER_TRADE_DEADLINE) {
		return <p>You can only edit the schedule during the regular season.</p>;
	}
	const scheduleByDay: ScheduleDay[] = [];
	for (const game of schedule) {
		let currentDay = scheduleByDay.at(-1);
		if (!currentDay) {
			if (game.type === "game" || game.type === "completed") {
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
				if (game.type === "game" || game.type === "completed") {
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
					// popperConfig renderOnMount is https://github.com/react-bootstrap/react-bootstrap/issues/6750#issuecomment-2609409983
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
							{godMode ? (
								<Dropdown.Menu
									popperConfig={{ strategy: "fixed" }}
									renderOnMount
								>
									{row.day > maxDayAlreadyPlayed ? (
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
									) : null}
									{row.day > maxDayAlreadyPlayed ? (
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
									) : null}
									{row.day + 1 > maxDayAlreadyPlayed ? (
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
									) : null}
								</Dropdown.Menu>
							) : null}
						</Dropdown>
					),
					searchValue: row.day,
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

							// Highlight winner/loser of completed game
							let completedClassName;
							if (game?.type === "completed") {
								if (game.winnerTid === undefined) {
									completedClassName = "text-warning";
								} else if (game.winnerTid === t.tid) {
									completedClassName = "text-success";
								} else {
									completedClassName = "text-danger";
								}
							}

							return {
								value: (
									<FancySelect
										disabled={
											!godMode ||
											game?.type === "completed" ||
											row.day < maxDayAlreadyPlayed
										}
										value={
											gameHome
												? gameHome.awayTid
												: gameAway
													? gameAway.homeTid
													: "noGame"
										}
										className={clsx(
											"px-1",
											completedClassName,
											row.gamesByAwayTid[t.tid] &&
												completedClassName === undefined
												? "text-body-secondary"
												: undefined,
										)}
										onChange={(event) => {
											const value = event.target.value;
											if (value === "delete" || value === "swapHomeAway") {
												if (game) {
													dispatch({
														type: value,
														game,
													});
												}
											} else {
												const tid = Number.parseInt(value);
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
															game,
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
								searchValue: gameHome
									? gameHome.awayAbbrev
									: gameAway
										? `@${gameAway.homeAbbrev}`
										: undefined,
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
			{!godMode ? (
				<div>
					<span className="alert alert-warning d-inline-block mb-0">
						You can only edit the schedule in{" "}
						<a href={helpers.leagueUrl(["god_mode"])}>God Mode</a>.
					</span>
				</div>
			) : (
				<p className="mb-0">
					Click anywhere in the table to create/update/delete a game.
					{!window.mobile
						? " Middle click on a game to quickly swap the home and away teams."
						: null}
				</p>
			)}
			<DataTable
				className="text-center"
				clickable={false}
				cols={cols}
				defaultSort="disableSort"
				hideAllControls
				name="ScheduleEditor"
				rows={rows}
				sortableRows={
					godMode
						? {
								disableRow: (index) => {
									if (!scheduleByDay[index]) {
										return true;
									}
									return Object.values(
										scheduleByDay[index].gamesByAwayTid,
									).some((game) => game.type === "completed");
								},
								onChange: ({ oldIndex, newIndex }) => {
									dispatch({
										type: "dragDay",
										oldDay: oldIndex + 1,
										newDay: newIndex + 1,
									});
								},
								onSwap: (index1, index2) => {
									dispatch({
										type: "swapDays",
										day1: index1 + 1,
										day2: index2 + 1,
									});
								},
							}
						: undefined
				}
				stickyHeader
			/>

			{showSummaryStatistics ? (
				<>
					<h2 className="mt-5">Schedule Statistics</h2>
					<p className="mb-0">
						The numbers in this table show the total number of games for each
						team/category above (# home games) / (# away games).
					</p>
					<SummaryTable
						schedule={schedule}
						teams={teams}
						teamsByTid={teamsByTid}
						userTid={userTid}
					/>
				</>
			) : (
				<>
					<button
						className="btn btn-secondary"
						onClick={() => {
							setShowSummaryStatistics(true);
						}}
					>
						Show summary statistics
					</button>
				</>
			)}

			{godMode ? (
				<StickyBottomButtons>
					<Dropdown>
						<Dropdown.Toggle variant="secondary" disabled={saving}>
							Actions
						</Dropdown.Toggle>
						<Dropdown.Menu>
							<Dropdown.Item
								onClick={() => {
									let errorMessage;
									if (allStarGameAlreadyHappened) {
										errorMessage =
											"The All-Star Game already happened this season.";
									} else if (allStarGame === null) {
										errorMessage =
											"The All-Star Game is disabled. Go to Tools > League Settings if you want to change that.";
									} else if (allStarGame === -1) {
										errorMessage =
											"The All-Star Game happens during the playoffs. Go to Tools > League Settings if you want to change that.";
									}

									if (errorMessage) {
										dispatch({ type: "deleteSpecial", special: "allStarGame" });
										logEvent({
											type: "info",
											text: errorMessage,
											saveToDb: false,
										});
										return;
									}

									dispatch({
										type: "placeSpecial",
										special: "allStarGame",
										value: allStarGame!,
									});
								}}
							>
								Place All-Star Game in default position
							</Dropdown.Item>
							<Dropdown.Item
								onClick={() => {
									let errorMessage;
									if (phase >= PHASE.AFTER_TRADE_DEADLINE) {
										errorMessage =
											"The trade deadline already happened this season.";
									} else if (tradeDeadline === 1) {
										errorMessage =
											"The trade deadline is disabled. Go to Tools > League Settings if you want to change that.";
									} else if (allStarGame === -1) {
										errorMessage =
											"The All-Star Game happens during the playoffs. Go to Tools > League Settings if you want to change that.";
									}

									if (errorMessage) {
										dispatch({
											type: "deleteSpecial",
											special: "tradeDeadline",
										});
										logEvent({
											type: "info",
											text: errorMessage,
											saveToDb: false,
										});
										return;
									}

									dispatch({
										type: "placeSpecial",
										special: "tradeDeadline",
										value: tradeDeadline,
									});
								}}
							>
								Place Trade Deadline in default position
							</Dropdown.Item>
							<Dropdown.Item
								onClick={async () => {
									if (!canRegenerateSchedule) {
										logEvent({
											type: "error",
											text: "You can only regenerate the schedule at the start of the regular season, when no games have been played.",
											saveToDb: false,
										});
										return;
									}

									setShowRegenerateScheduleModal(true);
								}}
							>
								Regenerate schedule
							</Dropdown.Item>
							<Dropdown.Item
								onClick={async () => {
									const proceed = await confirm(
										"Are you sure you want to delete the entire schedule?",
										{
											okText: "Clear schedule",
										},
									);
									if (proceed) {
										dispatch({
											type: "clearSchedule",
											maxDayAlreadyPlayed,
										});
									}
								}}
							>
								Clear schedule
							</Dropdown.Item>
						</Dropdown.Menu>
					</Dropdown>
					<button
						className="btn btn-primary ms-auto"
						disabled={saving}
						onClick={async () => {
							setSaving(true);

							try {
								await toWorker("main", "setScheduleFromEditor", {
									regenerated,
									schedule,
								});
							} catch (error) {
								logEvent({
									type: "error",
									text: `Error saving schedule: ${error.message}`,
									saveToDb: false,
								});
								throw error;
							}

							logEvent({
								type: "success",
								text: "Saved schedule",
								saveToDb: false,
							});

							setSaving(false);
						}}
					>
						Save schedule
					</button>
				</StickyBottomButtons>
			) : null}
			<RegenerateScheduleModal
				show={showRegenerateScheduleModal}
				onCancel={() => {
					setShowRegenerateScheduleModal(false);
				}}
				onRegenerated={(schedule) => {
					setRegenerated(true);
					dispatch({
						type: "resetSchedule",
						schedule,
					});
					setShowRegenerateScheduleModal(false);
				}}
			/>
		</div>
	);
};

export default ScheduleEditor;
