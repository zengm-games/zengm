import groupBy from "lodash/groupBy";
import PropTypes from "prop-types";
import React from "react";
import { DataTable, Dropdown, NewWindowLink } from "../components";
import { getCols, helpers, setTitle } from "../util";

const formatYear = year => {
    return Object.keys(year).map((k, i) => {
        const years = helpers.yearRanges(year[k].map(y => y.season)).join(", ");
        return (
            <span key={i}>
                {i > 0 ? ", " : null}
                {k} <small>({years})</small>
            </span>
        );
    });
};

const CheckmarkOrCross = ({ children }) => {
    if (children === 1) {
        return <span className="glyphicon glyphicon-ok text-success" />;
    }

    return <span className="glyphicon glyphicon-remove text-danger" />;
};
CheckmarkOrCross.propTypes = {
    children: PropTypes.number.isRequired,
};

const AwardsRecords = ({
    awardType,
    awardTypeVal,
    awardsRecords,
    playerCount,
}) => {
    setTitle("Awards Records");
    const cols = getCols("Name", "Count", "Year", "Last", "Retired", "HOF");

    const rows = awardsRecords.map(a => {
        return {
            key: a.pid,
            data: [
                <a href={helpers.leagueUrl(["player", a.pid])}>{a.name}</a>,
                a.count,
                formatYear(groupBy(a.years, "team")),
                a.lastYear,
                <CheckmarkOrCross>{a.retired ? 1 : 0}</CheckmarkOrCross>,
                <CheckmarkOrCross>{a.hof ? 1 : 0}</CheckmarkOrCross>,
            ],
        };
    });

    return (
        <>
            <Dropdown
                view="awards_records"
                fields={["awardType"]}
                values={[awardType]}
            />
            <h1>
                Awards
                <NewWindowLink />
            </h1>

            <p>
                More:{" "}
                <a href={helpers.leagueUrl(["history_all"])}>League History</a>{" "}
                | <a href={helpers.leagueUrl(["team_records"])}>Team Records</a>
            </p>

            <h4 className="mb-3">
                {playerCount} players - {awardTypeVal}
            </h4>

            <DataTable
                cols={cols}
                defaultSort={[1, "desc"]}
                name="AwardsRecords"
                rows={rows}
                pagination
            />
        </>
    );
};

AwardsRecords.propTypes = {
    awardType: PropTypes.string.isRequired,
    awardTypeVal: PropTypes.string.isRequired,
    awardsRecords: PropTypes.arrayOf(PropTypes.object).isRequired,
    playerCount: PropTypes.number.isRequired,
};

export default AwardsRecords;
