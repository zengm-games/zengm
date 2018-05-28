import PropTypes from "prop-types";
import React from "react";
import { helpers } from "../../common";
import { getCols, setTitle } from "../util";
import { DataTable, NewWindowLink } from "../components";

const HallOfFame = ({ players, userTid }) => {
    setTitle("Hall of Fame");

    const superCols = [
        {
            title: "",
            colspan: 6,
        },
        {
            title: "Best Season",
            colspan: 8,
        },
        {
            title: "Career Stats",
            colspan: 7,
        },
    ];

    const cols = getCols(
        "Name",
        "Pos",
        "Drafted",
        "Retired",
        "Pick",
        "Peak Ovr",
        "Year",
        "Team",
        "G",
        "Min",
        "PPG",
        "Reb",
        "Ast",
        "PER",
        "G",
        "Min",
        "PPG",
        "Reb",
        "Ast",
        "PER",
        "EWA",
    );

    const rows = players.map(p => {
        return {
            key: p.pid,
            data: [
                <a href={helpers.leagueUrl(["player", p.pid])}>{p.name}</a>,
                p.ratings[p.ratings.length - 1].pos,
                p.draft.year,
                p.retiredYear,
                p.draft.round > 0 ? `${p.draft.round}-${p.draft.pick}` : "",
                p.peakOvr,
                p.bestStats.season,
                <a
                    href={helpers.leagueUrl([
                        "roster",
                        p.bestStats.abbrev,
                        p.bestStats.season,
                    ])}
                >
                    {p.bestStats.abbrev}
                </a>,
                p.bestStats.gp,
                p.bestStats.min.toFixed(1),
                p.bestStats.pts.toFixed(1),
                p.bestStats.trb.toFixed(1),
                p.bestStats.ast.toFixed(1),
                p.bestStats.per.toFixed(1),
                p.careerStats.gp,
                p.careerStats.min.toFixed(1),
                p.careerStats.pts.toFixed(1),
                p.careerStats.trb.toFixed(1),
                p.careerStats.ast.toFixed(1),
                p.careerStats.per.toFixed(1),
                p.careerStats.ewa.toFixed(1),
            ],
            classNames: {
                danger: p.legacyTid === userTid,
                info:
                    p.statsTids
                        .slice(0, p.statsTids.length - 1)
                        .includes(userTid) && p.legacyTid !== userTid,
                success:
                    p.statsTids[p.statsTids.length - 1] === userTid &&
                    p.legacyTid !== userTid,
            },
        };
    });

    return (
        <div>
            <h1>
                Hall of Fame <NewWindowLink />
            </h1>

            <p>
                Players are eligible to be inducted into the Hall of Fame after
                they retire. The formula for inclusion is very similar to{" "}
                <a href="http://espn.go.com/nba/story/_/id/8736873/nba-experts-rebuild-springfield-hall-fame-espn-magazine">
                    the method described in this article
                </a>. Hall of Famers who played for your team are{" "}
                <span className="text-info">highlighted in blue</span>. Hall of
                Famers who retired with your team are{" "}
                <span className="text-success">highlighted in green</span>. Hall
                of Famers who played most of their career with your team are{" "}
                <span className="text-danger">highlighted in red</span>.
            </p>

            <DataTable
                cols={cols}
                defaultSort={[20, "desc"]}
                name="HallOfFame"
                pagination
                rows={rows}
                superCols={superCols}
            />
        </div>
    );
};

HallOfFame.propTypes = {
    players: PropTypes.arrayOf(PropTypes.object).isRequired,
    userTid: PropTypes.number.isRequired,
};

export default HallOfFame;
