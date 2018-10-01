import PropTypes from "prop-types";
import React from "react";
import { helpers, setTitle } from "../util";
import {
    Dropdown,
    JumpTo,
    NewWindowLink,
    PlayerNameLabels,
} from "../components";

const Leaders = ({ categories, season }) => {
    setTitle(`League Leaders - ${season}`);

    return (
        <>
            <Dropdown view="leaders" fields={["seasons"]} values={[season]} />
            <JumpTo season={season} />
            <h1>
                League Leaders <NewWindowLink />
            </h1>

            <p>
                Only eligible players are shown (<i>e.g.</i> a player shooting 2
                for 2 on the season is not eligible for the league lead in FG%).
            </p>

            <div className="row" style={{ marginTop: -20 }}>
                {categories.map(cat => (
                    <div
                        key={cat.name}
                        className="col-12 col-sm-6 col-md-4"
                        style={{ marginTop: 20 }}
                    >
                        <div className="table-responsive">
                            <table className="table table-striped table-bordered table-sm shorten-col-0 leaders">
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
                                                <div className="shortened-col">
                                                    {j + 1}.{" "}
                                                    <PlayerNameLabels
                                                        pid={p.pid}
                                                        injury={p.injury}
                                                        skills={
                                                            p.ratings.skills
                                                        }
                                                        watch={p.watch}
                                                    >
                                                        {p.nameAbbrev}
                                                    </PlayerNameLabels>
                                                    <a
                                                        href={helpers.leagueUrl(
                                                            [
                                                                "roster",
                                                                p.abbrev,
                                                                season,
                                                            ],
                                                        )}
                                                        style={{
                                                            marginLeft: "6px",
                                                        }}
                                                    >
                                                        {p.abbrev}
                                                    </a>
                                                </div>
                                            </td>
                                            <td>
                                                {cat.stat === "WS/48"
                                                    ? helpers.roundWinp(p.stat)
                                                    : p.stat.toFixed(1)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
};

Leaders.propTypes = {
    categories: PropTypes.arrayOf(PropTypes.object).isRequired,
    season: PropTypes.number.isRequired,
};

export default Leaders;
