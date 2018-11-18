import PropTypes from "prop-types";
import React from "react";
import { BoxPlot, Dropdown, NewWindowLink } from "../components";
import { helpers, setTitle } from "../util";

const proQuartiles =
    process.env.SPORT === "basketball"
        ? {
              gp: [1, 25, 52, 74, 82],
              min: [0, 11.4857142857, 20.3759398496, 28.6286673736, 41.359375],
              fg: [0, 1.2676056338, 2.6043478261, 4.2253994954, 10.1052631579],
              fga: [0, 2.976744186, 6, 9.144963145, 21.96875],
              fgp: [0, 39.6551724138, 44.2206477733, 48.7304827389, 100],
              tp: [0, 0, 0.25, 0.9499921863, 3],
              tpa: [0, 0.0545454545, 0.9326923077, 2.7269647696, 7.064516129],
              tpp: [0, 0, 28.5714285714, 35.7142857143, 100],
              ft: [0, 0.5, 1.069047619, 2.0634920635, 9.2195121951],
              fta: [0, 0.7464788732, 1.5282193959, 2.8446447508, 10.243902439],
              ftp: [0, 63.6363636364, 74.184204932, 81.4814814815, 100],
              orb: [0, 0.3333333333, 0.6938888889, 1.3094934014, 4.4285714286],
              drb: [0, 1.2272727273, 2.0930735931, 3.2760889292, 9.7317073171],
              trb: [0, 1.625, 2.8438363737, 4.5811403509, 13.1951219512],
              ast: [0, 0.5438596491, 1.1645833333, 2.3024060646, 11.012345679],
              tov: [0, 0.5769230769, 0.9638501742, 1.5492063492, 3.796875],
              stl: [0, 0.2985074627, 0.5330668605, 0.8278070175, 2.3333333333],
              blk: [0, 0.1111111111, 0.23875, 0.5, 2.7804878049],
              pf: [0, 1.2307692308, 1.828536436, 2.4295634921, 4],
              pts: [
                  0,
                  3.3333333333,
                  7.0507246377,
                  11.2698735321,
                  30.1463414634,
              ],
          }
        : {};

const PlayerStatDists = ({ numGames, season, statsAll }) => {
    setTitle(`Player Stat Distributions - ${season}`);

    // Scales for the box plots. This is not done dynamically so that the plots will be comparable across seasons.
    const scale =
        process.env.SPORT === "basketball"
            ? {
                  gp: [0, numGames],
                  gs: [0, numGames],
                  min: [0, 50],
                  fg: [0, 20],
                  fga: [0, 40],
                  fgp: [0, 100],
                  tp: [0, 5],
                  tpa: [0, 10],
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
            <Dropdown
                view="player_stat_dists"
                fields={["seasons"]}
                values={[season]}
            />
            <h1>
                Player Stat Distributions <NewWindowLink />
            </h1>

            <p>
                More:{" "}
                <a href={helpers.leagueUrl(["player_stats", season])}>
                    Main Stats
                </a>
                {process.env.SPORT === "basketball" ? (
                    <>
                        {" "}
                        |{" "}
                        <a
                            href={helpers.leagueUrl([
                                "player_shot_locations",
                                season,
                            ])}
                        >
                            Shot Locations
                        </a>
                    </>
                ) : null}
            </p>

            <p>
                These{" "}
                <a href="http://en.wikipedia.org/wiki/Box_plot">box plots</a>{" "}
                show the league-wide distributions of player stats for all
                active players in the selected season.{" "}
                {process.env.SPORT === "basketball" ? (
                    <>
                        Blue plots are for this league and green plots are from
                        the 2009-2010 NBA season, for comparison. NBA data was
                        generously provided by{" "}
                        <a href="http://www.databasebasketball.com/stats_download.htm">
                            databaseBasketball.com
                        </a>
                        .{" "}
                    </>
                ) : null}
                The five vertical lines in each plot represent the minimum of
                the scale, the minimum, the first{" "}
                <a href="http://en.wikipedia.org/wiki/Quartile">quartile</a>,
                the median, the third quartile, the maximum, and the maximum of
                the scale.
            </p>

            <table>
                <tbody>
                    {Object.keys(statsAll).map(stat => {
                        const bbgmPlot = (
                            <tr key={`${stat}-bbgm`}>
                                <td className="pr-3 text-right">{stat}</td>
                                <td width="100%">
                                    <BoxPlot
                                        color="var(--blue)"
                                        data={statsAll[stat]}
                                        scale={scale[stat]}
                                    />
                                </td>
                            </tr>
                        );
                        let proPlot = null;
                        if (proQuartiles.hasOwnProperty(stat)) {
                            proPlot = (
                                <tr key={`${stat}-pro`}>
                                    <td />
                                    <td width="100%">
                                        <div style={{ marginTop: "-26px" }}>
                                            <BoxPlot
                                                color="var(--green)"
                                                labels={false}
                                                scale={scale[stat]}
                                                quartiles={proQuartiles[stat]}
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
    statsAll: PropTypes.object.isRequired,
};

export default PlayerStatDists;
