import PropTypes from "prop-types";
import React from "react";
import { helpers } from "../../common";
import { setTitle } from "../util";
import {
    Dropdown,
    JumpTo,
    NewWindowLink,
    PlayerNameLabels,
} from "../components";

const Leaders = ({ categories, season }) => {
    setTitle(`League Leaders - ${season}`);

    return (
        <div>
            <Dropdown view="leaders" fields={["seasons"]} values={[season]} />
            <JumpTo season={season} />
            <h1>
                League Leaders <NewWindowLink />
            </h1>

            <p>
                Only eligible players are shown (<i>e.g.</i> a player shooting 2
                for 2 on the season is not eligible for the league lead in FG%).
            </p>

            <div className="row">
                {categories.map((cat, i) => (
                    <div key={cat.name}>
                        <div className="col-md-4 col-sm-6">
                            <div className="table-responsive">
                                <table className="table table-striped table-bordered table-condensed leaders">
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
                                                    p.userTeam ? "info" : null
                                                }
                                            >
                                                <td>
                                                    {j + 1}.{" "}
                                                    <PlayerNameLabels
                                                        pid={p.pid}
                                                        injury={p.injury}
                                                        skills={
                                                            p.ratings.skills
                                                        }
                                                        watch={p.watch}
                                                    >
                                                        {p.name}
                                                    </PlayerNameLabels>,{" "}
                                                    <a
                                                        href={helpers.leagueUrl(
                                                            [
                                                                "roster",
                                                                p.abbrev,
                                                                season,
                                                            ],
                                                        )}
                                                    >
                                                        {p.abbrev}
                                                    </a>
                                                </td>
                                                <td>
                                                    {cat.stat === "WS/48"
                                                        ? helpers.roundWinp(
                                                              p.stat,
                                                          )
                                                        : p.stat.toFixed(1)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        {i % 3 === 2 ? (
                            <div className="clearfix visible-md visible-lg" />
                        ) : null}
                        {i % 2 === 1 ? (
                            <div className="clearfix visible-sm" />
                        ) : null}
                    </div>
                ))}
            </div>
        </div>
    );
};

Leaders.propTypes = {
    categories: PropTypes.arrayOf(PropTypes.object).isRequired,
    season: PropTypes.number.isRequired,
};

export default Leaders;
