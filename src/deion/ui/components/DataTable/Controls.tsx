import classNames from "classnames";
import PropTypes from "prop-types";
import React from "react";
import DropdownItem from "reactstrap/lib/DropdownItem";
import DropdownMenu from "reactstrap/lib/DropdownMenu";
import DropdownToggle from "reactstrap/lib/DropdownToggle";
import UncontrolledDropdown from "reactstrap/lib/UncontrolledDropdown";
import HelpPopover from "../HelpPopover";

const Controls = ({
	enableFilters,
	onExportCSV,
	onSearch,
	onToggleFilters,
}: {
	enableFilters: boolean;
	onExportCSV: () => void;
	onSearch: (a: SyntheticInputEvent<HTMLInputElement>) => void;
	onToggleFilters: () => void;
}) => {
	const positionFilterText =
		process.env.SPORT === "football"
			? '"WR|TE" under a Position column to display wide receivers and tight ends'
			: '"C|PF" under a Position column to display centers and power forwards';
	return (
		<div className="datatable-controls">
			<HelpPopover
				placement="bottom"
				style={{
					marginRight: "6px",
				}}
				title="Filtering"
			>
				<p>
					The main search box looks in all columns, but you can filter on the
					values in specific columns by clicking the "Filter" button{" "}
					<span className="glyphicon glyphicon-filter" /> and entering text
					below the column headers.
				</p>
				<p>
					For numeric columns, you can enter "&gt;50" to show values greater
					than or equal to 50, "&lt;50" for the opposite, and "=50" for values
					exactly equal to 50.
				</p>
				<p>
					You can also filter on multiple values at once. For example, enter{" "}
					{positionFilterText}.
				</p>
			</HelpPopover>
			<a
				className={classNames("btn btn-sm btn-light-bordered cursor-pointer", {
					active: enableFilters,
				})}
				onClick={onToggleFilters}
				style={{
					marginBottom: 1,
					marginRight: 6,
				}}
				title="Filter"
			>
				<span className="glyphicon glyphicon-filter" />
			</a>
			<label>
				<input
					className="form-control form-control-sm"
					onChange={onSearch}
					placeholder="Search"
					type="search"
				/>
			</label>
			<UncontrolledDropdown className="float-right">
				<DropdownToggle
					style={{
						cursor: "pointer",
						fontSize: 16,
						lineHeight: "30px",
						paddingLeft: 5,
					}}
					tag="span"
					title="Actions"
				>
					<span className="glyphicon glyphicon-option-vertical text-muted" />
				</DropdownToggle>
				<DropdownMenu right>
					<DropdownItem onClick={onExportCSV}>
						Download Spreadsheet
					</DropdownItem>
				</DropdownMenu>
			</UncontrolledDropdown>
		</div>
	);
};

Controls.propTypes = {
	enableFilters: PropTypes.bool.isRequired,
	onExportCSV: PropTypes.func.isRequired,
	onSearch: PropTypes.func.isRequired,
	onToggleFilters: PropTypes.func.isRequired,
};
export default Controls;
