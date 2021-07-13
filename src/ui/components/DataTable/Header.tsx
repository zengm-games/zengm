import classNames from "classnames";
import PropTypes from "prop-types";
import type { SyntheticEvent, MouseEvent } from "react";
import type { Col, SortBy, SuperCol } from ".";

const FilterHeader = ({
	colOrder,
	cols,
	filters,
	handleFilterUpdate,
}: {
	colOrder: {
		colIndex: number;
		hidden?: boolean;
	}[];
	cols: Col[];
	filters: string[];
	handleFilterUpdate: (b: SyntheticEvent<HTMLInputElement>, a: number) => void;
}) => {
	return (
		<tr>
			{colOrder.map(({ colIndex }) => {
				const col = cols[colIndex];

				const filter = filters[colIndex] ?? "";
				return (
					<th key={colIndex}>
						{col.noSearch ? null : (
							<input
								className="datatable-filter-input"
								onChange={event => handleFilterUpdate(event, colIndex)}
								type="text"
								value={filter}
							/>
						)}
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

const SuperCols = ({
	colOrder,
	superCols,
}: {
	colOrder: {
		colIndex: number;
	}[];
	superCols: SuperCol[];
}) => {
	const colIndexes = colOrder.map(x => x.colIndex);
	const maxColIndex1 = Math.max(...colIndexes);
	let maxColIndex2 = -1;
	for (const superCol of superCols) {
		maxColIndex2 += superCol.colspan;
	}
	const maxColIndex = Math.max(maxColIndex1, maxColIndex2);

	// Adjust colspan based on hidden columns from colOrder
	const colspanAdjustments = superCols.map(() => 0);
	let superColIndex = 0;
	let currentSuperColCount = 0;
	for (let i = 0; i <= maxColIndex; i++) {
		const superCol = superCols[superColIndex];
		if (superCol) {
			if (!colIndexes.includes(i)) {
				colspanAdjustments[superColIndex] -= 1;
			}

			currentSuperColCount += 1;
			if (currentSuperColCount >= superCol.colspan) {
				superColIndex += 1;
				currentSuperColCount = 0;
			}
		}
	}

	return (
		<tr>
			{superCols.map(({ colspan, desc, title }, i) => {
				const adjustedColspan = colspan + colspanAdjustments[i];
				if (adjustedColspan <= 0) {
					return null;
				}
				return (
					<th
						key={i}
						colSpan={adjustedColspan}
						style={{
							textAlign: "center",
						}}
						title={desc}
					>
						{title}
					</th>
				);
			})}
		</tr>
	);
};

const Header = ({
	colOrder,
	cols,
	enableFilters,
	filters,
	handleColClick,
	handleFilterUpdate,
	sortBys,
	superCols,
}: {
	colOrder: {
		colIndex: number;
	}[];
	cols: Col[];
	enableFilters: boolean;
	filters: string[];
	handleColClick: (b: MouseEvent, a: number) => void;
	handleFilterUpdate: (b: SyntheticEvent<HTMLInputElement>, a: number) => void;
	sortBys: SortBy[];
	superCols?: SuperCol[];
}) => {
	return (
		<thead>
			{superCols ? (
				<SuperCols colOrder={colOrder} superCols={superCols} />
			) : null}
			<tr>
				{colOrder.map(({ colIndex }) => {
					const {
						classNames: colClassNames,
						desc,
						sortSequence,
						title,
						width,
					} = cols[colIndex];

					let className;
					if (sortSequence && sortSequence.length === 0) {
						className = null;
					} else {
						className = "sorting";

						for (const sortBy of sortBys) {
							if (sortBy[0] === colIndex) {
								className =
									sortBy[1] === "asc" ? "sorting_asc" : "sorting_desc";
								break;
							}
						}
					}

					return (
						<th
							className={classNames(colClassNames, className)}
							key={colIndex}
							onClick={event => handleColClick(event, colIndex)}
							title={desc}
							style={{ width }}
						>
							{title}
						</th>
					);
				})}
			</tr>
			{enableFilters ? (
				<FilterHeader
					colOrder={colOrder}
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
			title: PropTypes.any.isRequired,
		}),
	),
};

export default Header;
