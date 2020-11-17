import PropTypes from "prop-types";
import React, { ReactNode } from "react";
import { BoxPlot, MoreLinks } from "../components";
import useTitleBar from "../hooks/useTitleBar";
import { getCols } from "../util";
import type { View } from "../../common/types";

const width100 = {
	width: "100%",
};

const proQuartiles =
	process.env.SPORT === "basketball"
		? {
				gp: [4.0, 27.75, 53.0, 73.0, 82.0],
				gs: [0.0, 1.75, 11.0, 45.0, 82.0],
				min: [4.2, 14.9, 21.2, 27.8, 36.9],
				fg: [0.2, 1.9, 3.0, 4.7, 10.8],
				fga: [0.6, 4.3, 6.7, 10.3, 24.5],
				fgp: [15.2, 40.8, 44.2, 48.7, 73.1],
				tp: [0.0, 0.3, 0.8, 1.4, 5.1],
				tpa: [0.0, 1.1, 2.5, 4.0, 13.2],
				tpp: [0.0, 27.8, 33.6, 37.2, 100.0],
				ft: [0.0, 0.6, 1.1, 1.9, 9.7],
				fta: [0.0, 0.88, 1.5, 2.5, 11.0],
				ftp: [0.0, 68.9, 76.7, 82.7, 100.0],
				orb: [0.0, 0.4, 0.7, 1.2, 5.4],
				drb: [0.2, 1.8, 2.6, 3.9, 11.1],
				trb: [0.4, 2.2, 3.3, 4.93, 16.0],
				ast: [0.0, 0.9, 1.5, 2.7, 10.7],
				stl: [0.0, 0.4, 0.6, 0.9, 2.4],
				blk: [0.0, 0.2, 0.3, 0.6, 2.7],
				tov: [0.1, 0.6, 1.0, 1.5, 5.0],
				pf: [0.2, 1.4, 1.8, 2.3, 3.8],
				pts: [0.8, 5.1, 7.9, 12.6, 36.1],
				per: [0.7, 10.4, 13.0, 16.4, 31.0],
		  }
		: {};

const PlayerStatDists = ({
	numGames,
	season,
	statType,
	statsAll,
}: View<"playerStatDists">) => {
	useTitleBar({
		title: "Player Stat Distributions",
		dropdownView: "player_stat_dists",
		dropdownFields: { seasons: season, statTypesAdv: statType },
	});

	// Scales for the box plots. This is not done dynamically so that the plots will be comparable across seasons.
	const scale =
		process.env.SPORT === "basketball" && statType == "perGame"
			? {
					gp: [0, numGames],
					gs: [0, numGames],
					min: [0, 50],
					fg: [0, 20],
					fga: [0, 40],
					fgp: [0, 100],
					tp: [0, 10],
					tpa: [0, 15],
					tpp: [0, 100],
					ft: [0, 15],
					fta: [0, 25],
					ftp: [0, 100],
					orb: [0, 10],
					drb: [0, 15],
					trb: [0, 25],
					ast: [0, 15],
					tov: [0, 10],
					stl: [0, 5],
					blk: [0, 5],
					pf: [0, 6],
					pts: [0, 50],
					per: [0, 35],
			  }
			: {};

	return (
		<>
			<MoreLinks type="playerStats" page="player_stat_dists" season={season} />

			<p>
				These <a href="http://en.wikipedia.org/wiki/Box_plot">box plots</a> show
				the league-wide distributions of player stats for all active players in
				the selected season.{" "}
				{process.env.SPORT === "basketball" ? (
					<>
						Blue plots are for this league and green plots are from the
						2018-2020 NBA seasons, for comparison. NBA data was generously
						provided by{" "}
						<a href="https://www.basketball-reference.com/">
							basketball-reference.com
						</a>
						.{" "}
					</>
				) : null}
				The five vertical lines in each plot represent the minimum of the scale,
				the minimum, the first{" "}
				<a href="http://en.wikipedia.org/wiki/Quartile">quartile</a>, the
				median, the third quartile, the maximum, and the maximum of the scale.
			</p>

			<table>
				<tbody>
					{Object.keys(statsAll)
						.filter(stat => typeof statsAll[stat][0] === "number")
						.map(stat => {
							const col = getCols(`stat:${stat}`)[0];
							const bbgmPlot = (
								<tr key={`${stat}-bbgm`}>
									<td className="pr-3 text-right" title={col.desc}>
										{col.title}
									</td>
									<td style={width100}>
										<BoxPlot
											color="var(--blue)"
											data={statsAll[stat]}
											scale={(scale as any)[stat]}
										/>
									</td>
								</tr>
							);
							let proPlot: ReactNode = null;
							if (proQuartiles.hasOwnProperty(stat) && statType == "perGame") {
								proPlot = (
									<tr key={`${stat}-pro`}>
										<td />
										<td style={width100}>
											<div style={{ marginTop: "-26px" }}>
												<BoxPlot
													color="var(--green)"
													labels={false}
													scale={
														process.env.SPORT === "basketball"
															? (scale as any)[stat]
															: [undefined, undefined]
													}
													quartiles={(proQuartiles as any)[stat]}
												/>
											</div>
										</td>
									</tr>
								);
							}
							return [bbgmPlot, proPlot];
						})}
				</tbody>
			</table>
		</>
	);
};

PlayerStatDists.propTypes = {
	numGames: PropTypes.number.isRequired,
	season: PropTypes.number.isRequired,
	statType: PropTypes.oneOf([
		"advanced",
		"per36",
		"perGame",
		"shotLocations",
		"totals",
		"passing",
		"rushing",
		"defense",
		"kicking",
		"returns",
	]),
	statsAll: PropTypes.object.isRequired,
};

export default PlayerStatDists;
