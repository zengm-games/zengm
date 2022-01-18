import classNames from "classnames";
import type { SyntheticEvent } from "react";
import { Dropdown } from "react-bootstrap";
import { bySport } from "../../../common";
import HelpPopover from "../HelpPopover";

const hideAllControlsStyle = {
	marginTop: -30,
};

const style = {
	height: 27,
	marginRight: 6,
};

const Controls = ({
	enableFilters,
	hideAllControls,
	name,
	onExportCSV,
	onResetTable,
	onSearch,
	onSelectColumns,
	onToggleFilters,
	searchText,
}: {
	enableFilters: boolean;
	hideAllControls?: boolean;
	name: string;
	onExportCSV: () => void;
	onResetTable: () => void;
	onSearch: (a: SyntheticEvent<HTMLInputElement>) => void;
	onSelectColumns: () => void;
	onToggleFilters: () => void;
	searchText: string;
}) => {
	const positionFilterText = bySport({
		basketball: (
			<>
				<code>C|PF</code> under a Position column to display centers and power
				forwards
			</>
		),
		football: (
			<>
				<code>WR|TE</code> under a Position column to display wide receivers and
				tight ends
			</>
		),
		hockey: (
			<>
				<code>C|W</code> under a Position column to display centers and wingers
			</>
		),
	});

	return (
		<div
			className="datatable-controls d-flex"
			style={hideAllControls ? hideAllControlsStyle : undefined}
		>
			{!hideAllControls ? (
				<>
					<div className="d-flex align-items-center" style={style}>
						<HelpPopover title="Filtering">
							<p>
								The main search box looks in all columns, but you can filter on
								the values in specific columns by clicking the "Filter" button{" "}
								<span className="glyphicon glyphicon-filter" /> and entering
								text below the column headers.
							</p>
							<p>
								For numeric columns, you can enter <code>&gt;50</code> to show
								values greater than or equal to 50 and <code>&lt;50</code> for
								the opposite.
							</p>
							<p>
								You can filter on multiple values at once using a logical OR
								operator. For example, enter {positionFilterText}.
							</p>
							<p>
								You can find all rows not matching a string, like{" "}
								<code>!CHI</code> will show all players except those on Chicago.
							</p>
							<p>
								You can make a search exact (searches for the full string) by
								putting it in quotes. For example, <code>2</code> will search
								for any value containing a 2, while <code>"2"</code> will search
								only for the number 2 exactly.
							</p>
						</HelpPopover>
					</div>
					<a
						className={classNames(
							"btn btn-sm btn-light-bordered cursor-pointer",
							{
								active: enableFilters,
							},
						)}
						onClick={onToggleFilters}
						style={style}
						title="Filter"
					>
						<span className="glyphicon glyphicon-filter" />
					</a>
					<label className="form-label">
						<input
							className="form-control form-control-sm"
							onChange={onSearch}
							placeholder="Search"
							type="search"
							value={searchText}
						/>
					</label>
				</>
			) : null}
			<Dropdown className="float-end">
				<Dropdown.Toggle
					as="span"
					bsPrefix="no-caret"
					id={`datatable-controls-${name}`}
					style={{
						cursor: "pointer",
						fontSize: 16,
						lineHeight: "30px",
						paddingLeft: 5,
					}}
					title="Actions"
				>
					<span className="glyphicon glyphicon-option-vertical text-muted" />
				</Dropdown.Toggle>
				<Dropdown.Menu>
					<Dropdown.Item onClick={onSelectColumns}>
						Customize Columns
					</Dropdown.Item>
					<Dropdown.Item onClick={onExportCSV}>
						Download Spreadsheet
					</Dropdown.Item>
					<Dropdown.Item onClick={onResetTable}>Reset Table</Dropdown.Item>
				</Dropdown.Menu>
			</Dropdown>
		</div>
	);
};

export default Controls;
