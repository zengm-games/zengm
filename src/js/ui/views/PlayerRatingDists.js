import PropTypes from "prop-types";
import React from "react";
import { helpers } from "../../common";
import { BoxPlot, Dropdown, NewWindowLink } from "../components";
import { setTitle } from "../util";

const PlayerRatingDists = ({ ratingsAll, season }) => {
    setTitle(`Player Rating Distributions - ${season}`);

    return (
        <div>
            <Dropdown
                view="player_rating_dists"
                fields={["seasons"]}
                values={[season]}
            />
            <h1>
                Player Rating Distributions <NewWindowLink />
            </h1>

            <p>
                More:{" "}
                <a href={helpers.leagueUrl(["player_ratings", season])}>
                    Main Ratings
                </a>
            </p>

            <p>
                These{" "}
                <a href="http://en.wikipedia.org/wiki/Box_plot">
                    box plots
                </a>{" "}
                show the league-wide distributions of player ratings for all
                active players in the selected season. The five vertical lines
                in each plot represent the minimum of the scale (0), the
                minimum, the first{" "}
                <a href="http://en.wikipedia.org/wiki/Quartile">quartile</a>,
                the median, the third quartile, the maximum, and the maximum of
                the scale (100).
            </p>

            <table>
                <tbody>
                    {Object.keys(ratingsAll).map(rating => {
                        return (
                            <tr key={rating}>
                                <td
                                    style={{
                                        textAlign: "right",
                                        paddingRight: "1em",
                                    }}
                                >
                                    {rating}
                                </td>
                                <td width="100%">
                                    <BoxPlot
                                        data={ratingsAll[rating]}
                                        scale={[0, 100]}
                                    />
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

PlayerRatingDists.propTypes = {
    ratingsAll: PropTypes.object.isRequired,
    season: PropTypes.number.isRequired,
};

export default PlayerRatingDists;
