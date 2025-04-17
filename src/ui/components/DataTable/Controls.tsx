import clsx from "clsx";
import type { SyntheticEvent } from "react";
import { Dropdown } from "react-bootstrap";
import { bySport } from "../../../common/index.ts";
import HelpPopover from "../HelpPopover.tsx";
import type { DataTableRowMetadata } from "./index.tsx";

const style = {
	height: 27,
	marginRight: 6,
};

const Controls = ({
	alwaysShowBulkSelectRows,
	bulkSelectRows,
	enableFilters,
	hideAllControls,
	metadataType,
	name,
	onBulkSelectRows,
	onExportCSV,
	onResetTable,
	onSearch,
	onSelectColumns,
	onToggleFilters,
	searchText,
}: {
	alwaysShowBulkSelectRows: boolean;
	bulkSelectRows: boolean;
	enableFilters: boolean;
	hideAllControls?: boolean;
	metadataType: DataTableRowMetadata["type"] | undefined;
	name: string;
	onBulkSelectRows: () => void;
	onExportCSV: () => void;
	onResetTable: () => void;
	onSearch: (a: SyntheticEvent<HTMLInputElement>) => void;
	onSelectColumns: () => void;
	onToggleFilters: () => void;
	searchText: string;
}) => {
	const positionFilterText = bySport({
		baseball: (
			<>
				<code>SS|3B</code> under a Position column to display shortstops and
				third basemen
			</>
		),
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

	// flex-grow-1 is so the search input expands to its max-width when possible, and then ms-auto needs to be on the inner div otherwise it doesn't do anything
	return (
		<div className="d-flex flex-grow-1 ms-1">
			<div className="ms-auto" />
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
								You can find all rows not matching a string, like{" "}
								<code>!CHI</code> will show all players except those on Chicago.
							</p>
							<p>
								You can make a search exact (searches for the full string) by
								putting it in quotes. For example, <code>2</code> will search
								for any value containing a 2, while <code>"2"</code> will search
								only for the number 2 exactly.
							</p>
							<p>
								You can filter on multiple values at once using logical "or" or
								"and" operators. For example, enter {positionFilterText}, or{" "}
								<code>!"DP"&!"FA"</code> to remove draft prospects and free
								agents from the Player Ratings table.
							</p>
						</HelpPopover>
					</div>
					<a
						className={clsx("btn btn-sm btn-light-bordered cursor-pointer", {
							active: enableFilters,
						})}
						onClick={onToggleFilters}
						style={style}
						title="Filter"
					>
						<span className="glyphicon glyphicon-filter" />
					</a>
					<input
						className="form-control form-control-sm datatable-search mb-2"
						onChange={onSearch}
						placeholder="Search"
						type="search"
						value={searchText}
					/>
				</>
			) : null}
			<Dropdown>
				<Dropdown.Toggle
					bsPrefix="no-caret"
					id={`datatable-controls-${name}`}
					style={{
						cursor: "pointer",
						fontSize: 16,
						lineHeight: "30px",
						padding: "0 0 0 5px",
					}}
					title="Actions"
					variant="btn-link border-0"
				>
					<span className="glyphicon glyphicon-option-vertical text-body-secondary" />
				</Dropdown.Toggle>
				<Dropdown.Menu>
					{metadataType === "player" ? (
						<Dropdown.Item onClick={onBulkSelectRows}>
							{bulkSelectRows ? "Hide bulk select" : "Bulk select"}
							{alwaysShowBulkSelectRows ? " actions" : null}
						</Dropdown.Item>
					) : null}
					<Dropdown.Item onClick={onSelectColumns}>
						Customize columns
					</Dropdown.Item>
					<Dropdown.Item onClick={onExportCSV}>
						Download spreadsheet
					</Dropdown.Item>
					<Dropdown.Item onClick={onResetTable}>Reset table</Dropdown.Item>
				</Dropdown.Menu>
			</Dropdown>
		</div>
	);
};

export default Controls;
