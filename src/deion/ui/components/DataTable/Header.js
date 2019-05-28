// @flow

import classNames from "classnames";
import PropTypes from "prop-types";
import React from "react";
import type { Col, SortBy, SuperCol } from ".";

const FilterHeader = ({
    cols,
    filters,
    handleFilterUpdate,
}: {
    cols: Col[],
    filters: string[],
    handleFilterUpdate: (SyntheticInputEvent<HTMLInputElement>, number) => void,
}) => {
    return (
        <tr>
            {cols.map((col, i) => {
                const filter = filters[i] === undefined ? "" : filters[i];

                return (
                    <th key={i}>
                        <input
                            className="datatable-filter-input"
                            onChange={event => handleFilterUpdate(event, i)}
                            type="text"
                            value={filter}
                        />
                    </th>
                );
            })}
        </tr>
    );
};

FilterHeader.propTypes = {
    cols: PropTypes.arrayOf(
        PropTypes.shape({
            title: PropTypes.string.isRequired,
        }),
    ).isRequired,
    filters: PropTypes.arrayOf(PropTypes.string).isRequired,
    handleFilterUpdate: PropTypes.func.isRequired,
};

const Header = ({
    cols,
    enableFilters,
    filters,
    handleColClick,
    handleFilterUpdate,
    sortBys,
    superCols,
}: {
    cols: Col[],
    enableFilters: boolean,
    filters: string[],
    handleColClick: (SyntheticKeyboardEvent<>, number) => void,
    handleFilterUpdate: (SyntheticInputEvent<HTMLInputElement>, number) => void,
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
                {cols.map(
                    (
                        {
                            classNames: colClassNames,
                            desc,
                            sortSequence,
                            title,
                            width,
                        },
                        i,
                    ) => {
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
                                className={classNames(colClassNames)}
                                key={i}
                                onClick={event => handleColClick(event, i)}
                                title={desc}
                                width={width}
                            >
                                {className ? (
                                    <div className={className}>{title}</div>
                                ) : (
                                    title
                                )}
                            </th>
                        );
                    },
                )}
            </tr>
            {enableFilters ? (
                <FilterHeader
                    cols={cols}
                    filters={filters}
                    handleFilterUpdate={handleFilterUpdate}
                />
            ) : null}
        </thead>
    );
};

Header.propTypes = {
    cols: PropTypes.arrayOf(
        PropTypes.shape({
            desc: PropTypes.string,
            sortSequence: PropTypes.arrayOf(PropTypes.string),
            title: PropTypes.string.isRequired,
            width: PropTypes.string,
        }),
    ).isRequired,
    enableFilters: PropTypes.bool.isRequired,
    filters: PropTypes.arrayOf(PropTypes.string).isRequired,
    handleColClick: PropTypes.func.isRequired,
    handleFilterUpdate: PropTypes.func.isRequired,
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
