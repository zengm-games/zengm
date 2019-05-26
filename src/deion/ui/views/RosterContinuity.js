// @flow

import PropTypes from "prop-types";
import * as React from "react";
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
        ...abbrevs.map(abbrev => {
            return {
                sortSequence: ["desc", "asc"],
                sortType: "number",
                title: abbrev,
            };
        }),
    ];

    const rows = seasons.map((seasonRow, i) => {
        return {
            key: season - i,
            data: [season - i, ...seasonRow.map(pct => pct.toFixed(2))],
        };
    });

    return (
        <>
            <h1>
                Roster Continuity <NewWindowLink />
            </h1>

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
