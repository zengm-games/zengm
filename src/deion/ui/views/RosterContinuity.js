// @flow

import PropTypes from "prop-types";
import React from "react";
import { DataTable, NewWindowLink } from "../components";
import { getCols, setTitle } from "../util";

type Props = {
    abbrevs: string[],
    season: number,
    seasons: number[][],
    userTid: number,
};

const RosterContinuity = ({ abbrevs, season, seasons, userTid }: Props) => {
    setTitle("Roster Continuity");

    const cols = [
        ...getCols("Season"),
        ...abbrevs.map((abbrev, i) => {
            return {
                classNames: userTid === i ? "table-info" : undefined,
                sortSequence: ["desc", "asc"],
                sortType: "number",
                title: abbrev,
            };
        }),
    ];

    const rows = seasons.map((seasonRow, i) => {
        return {
            key: season - i,
            data: [
                season - i,
                ...seasonRow.map(pct => {
                    return {
                        classNames:
                            process.env.SPORT === "basketball"
                                ? {
                                      "table-danger": pct < 0.7,
                                      "table-warning": pct >= 0.7 && pct < 0.85,
                                      "table-success": pct >= 0.85,
                                  }
                                : {
                                      "table-danger": pct < 0.725,
                                      "table-warning":
                                          pct >= 0.725 && pct < 0.825,
                                      "table-success": pct >= 0.825,
                                  },
                        value: pct.toFixed(2),
                    };
                }),
            ],
        };
    });

    return (
        <>
            <h1>
                Roster Continuity <NewWindowLink />
            </h1>

            <p>
                Each cell in the table shows the percentage of minutes played
                that season by players who were on the same team the previous
                season.
            </p>

            <DataTable
                // $FlowFixMe
                cols={cols}
                defaultSort={[0, "desc"]}
                name="RosterContinuity"
                pagination
                rows={rows}
            />
        </>
    );
};

RosterContinuity.propTypes = {
    abbrevs: PropTypes.arrayOf(PropTypes.string).isRequired,
    season: PropTypes.number.isRequired,
    seasons: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)).isRequired,
    userTid: PropTypes.number.isRequired,
};

export default RosterContinuity;
