import PropTypes from "prop-types";
import { PlayoffMatchup, ResponsiveTableWrapper } from "../components";
import useTitleBar from "../hooks/useTitleBar";
import type { View } from "../../common/types";
import { helpers } from "../util";
import range from "lodash-es/range";

const width100 = {
	width: "100%",
};

const Playoffs = ({
	confNames,
	finalMatchups,
	matchups,
	numGamesPlayoffSeries,
	numGamesToWinSeries,
	playIns,
	playoffsByConf,
	season,
	series,
	userTid,
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

	const numRounds = series.length;

	const numGamesPlayoffSeriesReflected: (number | undefined)[] = [
		...numGamesPlayoffSeries,
		...[...numGamesPlayoffSeries].reverse().slice(1),
	];
	for (let i = 0; i < series.length; i++) {
		if (series[i].length === 0) {
			numGamesPlayoffSeriesReflected[i] = undefined;
			numGamesPlayoffSeriesReflected[
				numGamesPlayoffSeriesReflected.length - 1 - i
			] = undefined;
		}
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

	const playInPlural = playIns && playIns.length > 1 ? "s" : "";
	const playInPluralAlt = playIns && playIns.length > 1 ? "" : "s";

	return (
		<div style={{ maxWidth }}>
			{!finalMatchups ? (
				<p>
					This is what the playoff matchups would be if the season ended right
					now.
				</p>
			) : null}

			{playoffsByConf && numRounds > 1 ? (
				<h2 className="d-none d-sm-block">
					{confNames[1]} <span className="float-right">{confNames[0]}</span>
				</h2>
			) : null}

			<ResponsiveTableWrapper>
				<table className="table-sm" style={width100}>
					<tbody>
						{matchups.map((row, i) => (
							<tr key={i}>
								{row.map((m, j) => {
									if (j + 1 > maxNumCols) {
										maxNumCols = j + 1;
									}

									return (
										<td key={j} rowSpan={m.rowspan} style={tdStyle}>
											<PlayoffMatchup
												numGamesToWinSeries={numGamesToWinSeries[m.matchup[0]]}
												season={season}
												series={series[m.matchup[0]][m.matchup[1]]}
												userTid={userTid}
											/>
										</td>
									);
								})}
							</tr>
						))}
					</tbody>
					<tfoot>
						<tr className="text-center text-muted">
							{numGamesPlayoffSeriesReflected.map((numGames, i) => {
								let text = null;
								if (numGames !== undefined) {
									text = `Best of ${numGames}`;
								}

								// Div wrapper is needed if you have a play-in tournament and one playoff round
								return (
									<td key={i}>
										<div style={tdStyle}>{text}</div>
									</td>
								);
							})}
						</tr>
					</tfoot>
				</table>
			</ResponsiveTableWrapper>

			{playIns ? (
				<>
					<h2>Play-In Tournament</h2>
					<p className="mb-2">
						The winner{playInPlural} of the {playIns[0][0].home.seed}/
						{playIns[0][0].away.seed} game{playInPlural} make{playInPluralAlt}{" "}
						the playoffs. Then the loser{playInPlural} play{playInPluralAlt} the
						winner{playInPlural} of the {playIns[0][1].home.seed}/
						{playIns[0][1].away.seed} game{playInPlural} for the final playoffs
						spot{playInPlural}.
					</p>
					{[...playIns].reverse().map((playIn, i) => {
						return (
							<ResponsiveTableWrapper key={i}>
								<table className="table-sm" style={width100}>
									<tbody>
										<tr>
											<td style={tdStyle}>
												<PlayoffMatchup
													numGamesToWinSeries={1}
													season={season}
													series={playIn[0]}
													userTid={userTid}
												/>
											</td>
											<td style={tdStyle} rowSpan={2}>
												{playIn[2] ? (
													<PlayoffMatchup
														numGamesToWinSeries={1}
														season={season}
														series={playIn[2]}
														userTid={userTid}
													/>
												) : null}
											</td>
											{range(maxNumCols - 2).map(j => (
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

Playoffs.propTypes = {
	confNames: PropTypes.arrayOf(PropTypes.string).isRequired,
	finalMatchups: PropTypes.bool.isRequired,
	matchups: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.object)).isRequired,
	numGamesToWinSeries: PropTypes.arrayOf(PropTypes.number).isRequired,
	season: PropTypes.number.isRequired,
	series: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.object)).isRequired,
	userTid: PropTypes.number.isRequired,
};

export default Playoffs;
