import PropTypes from "prop-types";
import React from "react";
import { PlayoffMatchup, ResponsiveTableWrapper } from "../components";
import useTitleBar from "../hooks/useTitleBar";

const width100 = {
	width: "100%",
};

type SeriesTeam = {
	abbrev: string;
	cid: number;
	imgURL?: string;
	pts?: number;
	region: string;
	regularSeason: {
		won: number;
		lost: number;
		tied?: number;
	};
	seed: number;
	tid: number;
	winp: number;
	won?: number;
};

const Playoffs = ({
	confNames,
	finalMatchups,
	matchups,
	numGamesToWinSeries,
	season,
	series,
	userTid,
}: {
	confNames: string[];
	finalMatchups: boolean;
	matchups: {
		matchup: [number, number];
		rowspan: number;
	}[][];
	numGamesToWinSeries: number[];
	season: number;
	series: {
		home: SeriesTeam;
		away?: SeriesTeam;
	}[][];
	userTid: number;
}) => {
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
	return (
		<>
			{!finalMatchups ? (
				<p>
					This is what the playoff matchups would be if the season ended right
					now.
				</p>
			) : null}

			{confNames.length === 2 && numRounds > 1 ? (
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
									return (
										<td
											key={j}
											rowSpan={m.rowspan}
											style={{ width: `${100 / (numRounds * 2 - 1)}%` }}
										>
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
				</table>
			</ResponsiveTableWrapper>
		</>
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
