import { ResponsiveTableWrapper } from "../components/ResponsiveTableWrapper.tsx";
import useTitleBar from "../hooks/useTitleBar.tsx";
import type { View } from "../../common/types.ts";
import { helpers } from "../util/helpers.ts";
import { toWorker } from "../util/toWorker.ts";
import { useLayoutEffect, useRef, useState } from "react";
import clsx from "clsx";
import { range } from "../../common/utils.ts";
import { PlayoffMatchup } from "../components/PlayoffMatchup.tsx";
import { useLocal } from "../util/local.ts";

type TeamToEdit = View<"playoffs">["teamsToEdit"][number];

const Playoffs = ({
	canEdit,
	confNames,
	finalMatchups,
	matchups,
	numGamesPlayoffSeries,
	numGamesToWinSeries,
	playIns,
	playoffsByConf,
	season,
	series,
	teamsToEdit,
}: View<"playoffs">) => {
	useTitleBar({
		title: "Playoffs",
		jumpTo: true,
		jumpToSeason: season,
		dropdownView: "playoffs",
		dropdownFields: {
			seasons: season,
		},
	});
	const { userTid } = useLocal(["userTid"]);

	const [editing, setEditing] = useState(false);
	const [teamsEdited, setTeamsEdited] = useState(teamsToEdit);
	const actuallyEditing = canEdit && editing;

	const numRounds = series.length;

	const numGamesPlayoffSeriesReflected: (number | undefined)[] = [
		...numGamesPlayoffSeries,
		...[...numGamesPlayoffSeries].reverse().slice(1),
	];
	for (const [i, row] of series.entries()) {
		if (row.length === 0) {
			numGamesPlayoffSeriesReflected[i] = undefined;
			numGamesPlayoffSeriesReflected[
				numGamesPlayoffSeriesReflected.length - 1 - i
			] = undefined;
		}
	}

	// Championship banner is placed with position relative, which overflows the ResponsiveTableWrapper in some cases unless this height is manually specified
	const tableRef = useRef<HTMLTableElement>(null);
	const [minTableHeight, setMinTableHeight] = useState(0);
	{
		let showingBanner = false;
		if (numRounds === numGamesPlayoffSeries.length) {
			const finals = series.at(-1)?.[0];
			if (finals) {
				const toWin = numGamesToWinSeries.at(-1);
				const homeWon = !finals.away || finals.home.won === toWin;
				const awayWon = finals.away?.won === toWin;
				if (homeWon || awayWon) {
					showingBanner = true;
				}
			}
		}
		useLayoutEffect(() => {
			const updateHeight = () => {
				if (tableRef.current) {
					const tableHeight = tableRef.current.scrollHeight;
					setMinTableHeight(tableHeight);
				} else {
					setMinTableHeight(0);
				}
			};
			updateHeight();

			window.addEventListener("optimizedResize", updateHeight);
			return () => {
				window.removeEventListener("optimizedResize", updateHeight);
			};
		}, [season, showingBanner]);
	}

	if (numRounds === 0) {
		return finalMatchups ? (
			<p>There were no playoffs this season.</p>
		) : (
			<p>
				Your league is configured to not have any playoff series. The league
				champion will be the 1st place team in the regular season. If you would
				like to change this, go to{" "}
				<a href={helpers.leagueUrl(["settings"])}>league settings</a> and change
				the "# Playoff Games" setting.
			</p>
		);
	}

	// HACK!! if you have a play-in tournament and one playoff round
	const numRoundsWithPlayIn = playIns && numRounds === 1 ? 1.5 : numRounds;

	const maxWidth = 210 * (2 * numRoundsWithPlayIn - 1);

	const tdStyle = { width: `${100 / (numRoundsWithPlayIn * 2 - 1)}%` };

	let maxNumCols = 0;

	const editingInfo = actuallyEditing
		? {
				byConf: playoffsByConf,
				onChange: (prevTeam: TeamToEdit, newTeam: TeamToEdit) => {
					// Swap seeds of these two teams
					setTeamsEdited((teams) =>
						teams.map((t) => {
							if (t.tid === prevTeam.tid) {
								return {
									...t,
									seed: newTeam.seed,
								};
							}

							if (t.tid === newTeam.tid) {
								return {
									...t,
									seed: prevTeam.seed,
								};
							}

							return t;
						}),
					);
				},
				teams: teamsEdited,
			}
		: undefined;

	// Hide "Best of X" footer if it's the same number of games every series
	const showFooter = numGamesPlayoffSeries.some(
		(numGames) => numGames !== numGamesPlayoffSeries[0],
	);

	return (
		<div style={{ maxWidth }}>
			{!finalMatchups ? (
				<p>
					This is what the playoff matchups would be if the season ended right
					now.
				</p>
			) : canEdit ? (
				<div className="mb-3">
					<button
						className={clsx("btn", editing ? "btn-primary" : "btn-god-mode")}
						onClick={async () => {
							if (!editing) {
								setEditing(true);
							} else {
								await toWorker("main", "updatePlayoffTeams", teamsEdited);
								setEditing(false);
							}
						}}
					>
						{editing ? "Save changes" : "Edit playoff teams"}
					</button>
					{editing ? (
						<button
							className="btn btn-secondary ms-2"
							onClick={() => {
								setEditing(false);
								setTeamsEdited(teamsToEdit);
							}}
						>
							Cancel
						</button>
					) : null}
				</div>
			) : null}

			{(playoffsByConf === 2 || playoffsByConf === 4) && numRounds > 1 ? (
				<h2 className="d-none d-sm-block mb-2">
					{confNames[playoffsByConf === 2 ? 1 : 2]}{" "}
					<span className="float-end">{confNames[0]}</span>
				</h2>
			) : null}

			<ResponsiveTableWrapper
				className={showFooter ? "mb-1" : "mb-3"}
				style={{ minHeight: minTableHeight, overflowY: "clip" }}
			>
				<table className="table-sm w-100" ref={tableRef}>
					<tbody>
						{matchups.map((row, i) => (
							<tr key={i}>
								{row.map((m, j) => {
									if (j + 1 > maxNumCols) {
										maxNumCols = j + 1;
									}
									const finals =
										m.matchup[0] === numGamesPlayoffSeries.length - 1;

									return (
										<td key={j} rowSpan={m.rowspan} style={tdStyle}>
											<PlayoffMatchup
												bannerForWinner={finals}
												numGamesToWinSeries={numGamesToWinSeries[m.matchup[0]]}
												season={season}
												series={series[m.matchup[0]]![m.matchup[1]]}
												userTid={userTid}
												editing={editingInfo}
											/>
										</td>
									);
								})}
							</tr>
						))}
					</tbody>
					{showFooter ? (
						<tfoot>
							<tr className="text-center text-body-secondary">
								{numGamesPlayoffSeriesReflected.map((numGames, i) => {
									let text = null;
									if (numGames !== undefined) {
										text = `Best of ${numGames}`;
									}

									// Div wrapper is needed if you have a play-in tournament and one playoff round
									return (
										<td key={i}>
											<div
												style={
													numRoundsWithPlayIn === 1.5 ? tdStyle : undefined
												}
											>
												{text}
											</div>
										</td>
									);
								})}
							</tr>
						</tfoot>
					) : null}
				</table>
			</ResponsiveTableWrapper>

			{playoffsByConf === 4 ? (
				<h2 className="d-none d-sm-block mb-3">
					{confNames[3]} <span className="float-end">{confNames[1]}</span>
				</h2>
			) : (
				<div className="mb-3" />
			)}

			{playIns ? (
				<>
					<h2>Play-In Tournament</h2>
					<p className="mb-2">
						The {helpers.plural("winner", playIns.length)} of the{" "}
						{playIns[0]![0].home.seed}/{playIns[0]![0].away.seed}{" "}
						{helpers.plural("game makes", playIns.length, "games make")} the{" "}
						playoffs. Then the{" "}
						{helpers.plural("loser plays", playIns.length, "losers play")} the{" "}
						{helpers.plural("winner", playIns.length)} of the{" "}
						{playIns[0]![1].home.seed}/{playIns[0]![1].away.seed}{" "}
						{helpers.plural("game", playIns.length)} for the final playoffs{" "}
						{helpers.plural("spot", playIns.length)}.
					</p>
					{[...playIns].reverse().map((playIn, i) => {
						return (
							<ResponsiveTableWrapper key={i}>
								<table className="table-sm w-100">
									<tbody>
										<tr>
											<td style={tdStyle}>
												<PlayoffMatchup
													numGamesToWinSeries={1}
													season={season}
													series={playIn[0]}
													userTid={userTid}
													extraHighlight
													editing={editingInfo}
												/>
											</td>
											<td style={tdStyle} rowSpan={2}>
												{playIn[2] ? (
													<PlayoffMatchup
														numGamesToWinSeries={1}
														season={season}
														series={playIn[2]}
														userTid={userTid}
														extraHighlight
													/>
												) : null}
											</td>
											{range(maxNumCols - 2).map((j) => (
												<td key={j} style={tdStyle} />
											))}
										</tr>
										<tr>
											<td style={tdStyle}>
												<PlayoffMatchup
													numGamesToWinSeries={1}
													season={season}
													series={playIn[1]}
													userTid={userTid}
													editing={editingInfo}
												/>
											</td>
										</tr>
									</tbody>
								</table>
							</ResponsiveTableWrapper>
						);
					})}
				</>
			) : null}
		</div>
	);
};

export default Playoffs;
