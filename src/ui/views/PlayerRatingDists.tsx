import PropTypes from "prop-types";
import { BoxPlot, MoreLinks } from "../components";
import useTitleBar from "../hooks/useTitleBar";
import type { View } from "../../common/types";

const width100 = {
	width: "100%",
};

const PlayerRatingDists = ({
	ratingsAll,
	season,
}: View<"playerRatingDists">) => {
	useTitleBar({
		title: "Player Rating Distributions",
		dropdownView: "player_rating_dists",
		dropdownFields: { seasons: season },
	});

	return (
		<>
			<MoreLinks
				type="playerRatings"
				page="player_rating_dists"
				season={season}
			/>

			<p>
				These <a href="http://en.wikipedia.org/wiki/Box_plot">box plots</a> show
				the league-wide distributions of player ratings for all active players
				in the selected season. The five vertical lines in each plot represent
				the minimum of the scale (0), the minimum, the first{" "}
				<a href="http://en.wikipedia.org/wiki/Quartile">quartile</a>, the
				median, the third quartile, the maximum, and the maximum of the scale
				(100).
			</p>

			<table>
				<tbody>
					{Object.keys(ratingsAll).map(rating => {
						return (
							<tr key={rating}>
								<td className="pr-3 text-right">{rating}</td>
								<td style={width100}>
									<BoxPlot
										color="var(--blue)"
										data={ratingsAll[rating]}
										scale={[0, 100]}
									/>
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		</>
	);
};

PlayerRatingDists.propTypes = {
	ratingsAll: PropTypes.object.isRequired,
	season: PropTypes.number.isRequired,
};

export default PlayerRatingDists;
