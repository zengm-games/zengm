// @flow

import PropTypes from "prop-types";
import * as React from "react";
import type { Col, SortBy, SuperCol } from ".";

const OptionsFilter = ({
    allPositions,
    filter,
    handleFilterUpdateOptions,
}: {
    allPositions?: string[],
    cols: Col[],
    filter: string[],
    handleFilterUpdateOptions: (string[], number) => void,
    handleFilterUpdateText: (
        SyntheticInputEvent<HTMLInputElement>,
        number,
    ) => void,
}) => {
    console.log("FilterHeader allPositions", allPositions);
    return (
        <div>
            <p>All | None</p>
            {allPositions.map(pos => (
                <div>
                    <input
                        className="form-check-input"
                        type="checkbox"
                        value=""
                        id="defaultCheck1"
                    />
                    <label className="form-check-label" htmlFor="defaultCheck1">
                        {pos}
                    </label>
                </div>
            ))}
        </div>
    );
};

OptionsFilter.propTypes = {
    allPositions: PropTypes.arrayOf(PropTypes.string).isRequired,
    filter: PropTypes.arrayOf(PropTypes.string).isRequired,
    handleFilterUpdateOptions: PropTypes.func.isRequired,
};

const FilterHeader = ({
    allPositions,
    cols,
    filters,
    handleFilterUpdateOptions,
    handleFilterUpdateText,
}: {
    allPositions?: string[],
    cols: Col[],
    filters: (string | string[])[],
    handleFilterUpdateOptions: (string[], number) => void,
    handleFilterUpdateText: (
        SyntheticInputEvent<HTMLInputElement>,
        number,
    ) => void,
}) => {
    console.log("FilterHeader allPositions", allPositions);

    return (
        <tr>
            {cols.map((col, i) => {
                const filter = filters[i] === undefined ? "" : filters[i];

                return (
                    <th key={i}>
                        {typeof filter === "string" ? (
                            <input
                                className="datatable-filter-input"
                                onChange={event =>
                                    handleFilterUpdateText(event, i)
                                }
                                type="text"
                                value={filter}
                            />
                        ) : (
                            <OptionsFilter
                                allPositions={allPositions}
                                handleFilterUpdateOptions={
                                    handleFilterUpdateOptions
                                }
                                filter={filter}
                            />
                        )}
                    </th>
                );
            })}
        </tr>
    );
};

FilterHeader.propTypes = {
    allPositions: PropTypes.arrayOf(PropTypes.string),
    cols: PropTypes.arrayOf(
        PropTypes.shape({
            title: PropTypes.string.isRequired,
        }),
    ).isRequired,
    filters: PropTypes.arrayOf(
        PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.arrayOf(PropTypes.string),
        ]),
    ).isRequired,
    handleFilterUpdateOptions: PropTypes.func.isRequired,
    handleFilterUpdateText: PropTypes.func.isRequired,
};

const Header = ({
    allPositions,
    cols,
    enableFilters,
    filters,
    handleColClick,
    handleFilterUpdateOptions,
    handleFilterUpdateText,
    sortBys,
    superCols,
}: {
    allPositions?: string[],
    cols: Col[],
    enableFilters: boolean,
    filters: (string | string[])[],
    handleColClick: (SyntheticKeyboardEvent<>, number) => void,
    handleFilterUpdateOptions: (string[], number) => void,
    handleFilterUpdateText: (
        SyntheticInputEvent<HTMLInputElement>,
        number,
    ) => void,
    sortBys: SortBy[],
    superCols?: SuperCol[],
}) => {
    return (
        <thead>
            {superCols ? (
                <tr>
                    {superCols.map(({ colspan, desc, title }, i) => {
                        return (
                            <th
                                key={i}
                                colSpan={colspan}
                                style={{ textAlign: "center" }}
                                title={desc}
                            >
                                {title}
                            </th>
                        );
                    })}
                </tr>
            ) : null}
            <tr>
                {cols.map(({ desc, sortSequence, title, width }, i) => {
                    let className;
                    if (sortSequence && sortSequence.length === 0) {
                        className = null;
                    } else {
                        className = "sorting";
                        for (const sortBy of sortBys) {
                            if (sortBy[0] === i) {
                                className =
                                    sortBy[1] === "asc"
                                        ? "sorting_asc"
                                        : "sorting_desc";
                                break;
                            }
                        }
                    }
                    return (
                        <th
                            className={className}
                            key={i}
                            onClick={event => handleColClick(event, i)}
                            title={desc}
                            width={width}
                        >
                            {title}
                        </th>
                    );
                })}
            </tr>
            {enableFilters ? (
                <FilterHeader
                    allPositions={allPositions}
                    cols={cols}
                    filters={filters}
                    handleFilterUpdateOptions={handleFilterUpdateOptions}
                    handleFilterUpdateText={handleFilterUpdateText}
                />
            ) : null}
        </thead>
    );
};

Header.propTypes = {
    allPositions: PropTypes.arrayOf(PropTypes.string),
    cols: PropTypes.arrayOf(
        PropTypes.shape({
            desc: PropTypes.string,
            sortSequence: PropTypes.arrayOf(PropTypes.string),
            title: PropTypes.string.isRequired,
            width: PropTypes.string,
        }),
    ).isRequired,
    enableFilters: PropTypes.bool.isRequired,
    filters: PropTypes.arrayOf(
        PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.arrayOf(PropTypes.string),
        ]),
    ).isRequired,
    handleColClick: PropTypes.func.isRequired,
    handleFilterUpdateOptions: PropTypes.func.isRequired,
    handleFilterUpdateText: PropTypes.func.isRequired,
    sortBys: PropTypes.arrayOf(
        PropTypes.arrayOf(
            PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        ),
    ).isRequired,
    superCols: PropTypes.arrayOf(
        PropTypes.shape({
            colspan: PropTypes.number.isRequired,
            desc: PropTypes.string,
            title: PropTypes.string.isRequired,
        }),
    ),
};

export default Header;
