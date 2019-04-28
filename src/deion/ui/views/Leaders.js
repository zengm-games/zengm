import PropTypes from "prop-types";
import React from "react";
import { helpers, setTitle } from "../util";
import {
    Dropdown,
    JumpTo,
    NewWindowLink,
    PlayerNameLabels,
    ResponsiveTableWrapper,
} from "../components";

const Leaders = ({ categories, playoffs, season }) => {
    setTitle(`League Leaders - ${season}`);

    return (
        <>
            <Dropdown
                view="leaders"
                fields={["seasons", "playoffs"]}
                values={[season, playoffs]}
            />
            <JumpTo season={season} />
            <h1>
                League Leaders <NewWindowLink />
            </h1>

            <p>
                Only eligible players are shown (<i>e.g.</i>{" "}
                {process.env.SPORT === "basketball"
                    ? "a player shooting 2 for 2 on the season is not eligible for the league lead in FG%"
                    : "a quarterback who is 2 for 2 on the season is not eligible for the league lead in completion percentage"}
                ).
            </p>

            <div className="row" style={{ marginTop: -14 }}>
                {categories.map(cat => (
                    <div
                        key={cat.name}
                        className="col-12 col-sm-6 col-md-4"
                        style={{ marginTop: 14 }}
                    >
                        <ResponsiveTableWrapper>
                            <table className="table table-striped table-bordered table-sm leaders">
                                <thead>
                                    <tr title={cat.title}>
                                        <th>{cat.name}</th>
                                        <th>{cat.stat}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cat.data.map((p, j) => (
                                        <tr
                                            key={p.pid}
                                            className={
                                                p.userTeam ? "table-info" : null
                                            }
                                        >
                                            <td>
                                                {j + 1}.{" "}
                                                <PlayerNameLabels
                                                    pid={p.pid}
                                                    injury={p.injury}
                                                    skills={p.ratings.skills}
                                                    watch={p.watch}
                                                >
                                                    {p.nameAbbrev}
                                                </PlayerNameLabels>
                                                <a
                                                    href={helpers.leagueUrl([
                                                        "roster",
                                                        p.abbrev,
                                                        season,
                                                    ])}
                                                    style={{
                                                        marginLeft: "6px",
                                                    }}
                                                >
                                                    {p.abbrev}
                                                </a>
                                            </td>
                                            <td>
                                                {cat.stat === "WS/48"
                                                    ? helpers.roundWinp(p.stat)
                                                    : helpers.roundStat(
                                                          p.stat,
                                                          cat.statProp,
                                                      )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </ResponsiveTableWrapper>
                    </div>
                ))}
            </div>
        </>
    );
};

Leaders.propTypes = {
    categories: PropTypes.arrayOf(PropTypes.object).isRequired,
    playoffs: PropTypes.oneOf(["playoffs", "regularSeason"]).isRequired,
    season: PropTypes.number.isRequired,
};

export default Leaders;
