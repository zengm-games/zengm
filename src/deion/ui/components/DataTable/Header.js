// @flow

import PropTypes from "prop-types";
import * as React from "react";
import type { Col, SortBy, SuperCol } from ".";

type Props = {};

type State = {
    dirty: boolean,
    open: boolean,
    currentSelection: string[],
};

class OptionsFilter extends React.Component<Props, State> {
    constructor(props) {
        super(props);
        this.state = {
            dirty: false,
            open: false,
            currentSelection: [],
        };
        this.toggleOpen = this.toggleOpen.bind(this);
        this.selectAll = this.selectAll.bind(this);
        this.selectNone = this.selectNone.bind(this);
        this.handleSelect = this.handleSelect.bind(this);
        this.handleClickOutside = this.handleClickOutside.bind(this);
        this.handleApply = this.handleApply.bind(this);
    }

    static getDerivedStateFromProps(nextProps: Props, prevState: State) {
        if (!prevState.dirty) {
            return {
                currentSelection: nextProps.filter,
            };
        }

        return null;
    }

    toggleOpen() {
        this.setState(state => {
            return {
                open: !state.open,
            };
        });
    }

    selectAll() {
        this.setState({
            currentSelection: this.props.allPositions,
            dirty: true,
        });
    }

    selectNone() {
        this.setState({
            currentSelection: [],
            dirty: true,
        });
    }

    handleSelect(event) {
        const value = event.target.checked;
        const name = event.target.name;

        if (value && !this.state.currentSelection.includes(name)) {
            this.setState(state => ({
                currentSelection: [...state.currentSelection, name],
                dirty: true,
            }));
        } else if (!value && this.state.currentSelection.includes(name)) {
            this.setState(state => ({
                currentSelection: state.currentSelection.filter(
                    val => val !== name,
                ),
                dirty: true,
            }));
        }
    }

    handleClickOutside(event) {
        if (event.target.closest(".datatable-dropdown")) {
            return;
        }

        if (this.state.open) {
            this.setState({
                dirty: false,
                open: false,
            });
        }
    }

    handleApply() {
        this.setState({
            open: false,
        });

        this.props.handleFilterUpdateOptions(
            this.state.currentSelection,
            this.props.i,
        );
    }

    componentDidMount() {
        document.addEventListener("click", this.handleClickOutside);
    }

    componentWillUnmount() {
        document.removeEventListener("click", this.handleClickOutside);
    }

    render() {
        const {
            allPositions,
            filter,
        }: {
            allPositions?: string[],
            cols: Col[],
            filter: string[],
            handleFilterUpdateOptions: (string[], number) => void,
            handleFilterUpdateText: (
                SyntheticInputEvent<HTMLInputElement>,
                number,
            ) => void,
        } = this.props;

        let value = filter.join(",");
        if (filter.length === 0) {
            value = "None";
        } else if (filter.length === allPositions.length) {
            value = "All";
        }

        const button = (
            <input
                className="datatable-filter-input"
                value={value}
                title={value}
                readOnly
                onClick={this.toggleOpen}
                style={{
                    cursor: "pointer",
                }}
                tabIndex="-1"
                type="text"
            />
        );

        if (!this.state.open) {
            return <div className="datatable-dropdown">{button}</div>;
        }

        const options = (
            <div
                className="datatable-dropdown-options border"
                style={{
                    height: 2 + (allPositions.length + 1) * 19 + 30,
                }}
            >
                <div>
                    <a href="" onClick={this.selectAll}>
                        All
                    </a>{" "}
                    |{" "}
                    <a href="" onClick={this.selectNone}>
                        None
                    </a>
                </div>
                <div className="form-group form-check mb-1">
                    {allPositions.map(pos => (
                        <div key={pos}>
                            <label className="form-check-label">
                                <input
                                    className="form-check-input"
                                    checked={this.state.currentSelection.includes(
                                        pos,
                                    )}
                                    name={pos}
                                    onChange={this.handleSelect}
                                    type="checkbox"
                                />
                                {pos}
                            </label>
                        </div>
                    ))}
                </div>
                <button
                    className="btn btn-primary btn-xs"
                    onClick={this.handleApply}
                >
                    Apply
                </button>
            </div>
        );

        return (
            <div className="datatable-dropdown">
                {button}
                <div className="datatable-dropdown-options-parent">
                    {options}
                </div>
            </div>
        );
    }
}

OptionsFilter.propTypes = {
    allPositions: PropTypes.arrayOf(PropTypes.string).isRequired,
    filter: PropTypes.arrayOf(PropTypes.string).isRequired,
    handleFilterUpdateOptions: PropTypes.func.isRequired,
    i: PropTypes.number.isRequired,
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
                                i={i}
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
