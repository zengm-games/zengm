import PropTypes from "prop-types";
import React from "react";
import { BoxPlot, Dropdown, NewWindowLink } from "../components";
import { helpers, setTitle } from "../util";

const PlayerRatingDists = ({ ratingsAll, season }) => {
    setTitle(`Player Rating Distributions - ${season}`);

    return (
        <>
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
                <a href="http://en.wikipedia.org/wiki/Box_plot">box plots</a>{" "}
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
                                <td className="pr-3 text-right">{rating}</td>
                                <td width="100%">
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
