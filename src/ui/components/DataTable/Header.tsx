import clsx from "clsx";
import {
	type SyntheticEvent,
	type MouseEvent,
	Fragment,
	forwardRef,
	useRef,
	useLayoutEffect,
} from "react";
import type { Col, SortBy, SuperCol } from ".";
import { range } from "../../../common/utils";
import { Dropdown } from "react-bootstrap";

const FilterHeader = ({
	colOrder,
	cols,
	filters,
	handleFilterUpdate,
	showBulkSelectCheckboxes,
}: {
	colOrder: {
		colIndex: number;
		hidden?: boolean;
	}[];
	cols: Col[];
	filters: string[];
	handleFilterUpdate: (b: SyntheticEvent<HTMLInputElement>, a: number) => void;
	showBulkSelectCheckboxes: boolean;
}) => {
	return (
		<tr>
			{showBulkSelectCheckboxes ? <th /> : null}
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

const SuperCols = ({
	colOrder,
	showBulkSelectCheckboxes,
	superCols,
}: {
	colOrder: {
		colIndex: number;
	}[];
	showBulkSelectCheckboxes: boolean;
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
			{showBulkSelectCheckboxes ? <th /> : null}
			{superCols
				.map(({ colspan, desc, title }, i) => {
					const adjustedColspan = colspan + colspanAdjustments[i];
					return {
						adjustedColspan,
						colspan,
						desc,
						title,
					};
				})
				.filter(({ adjustedColspan }) => adjustedColspan > 0)
				.map(({ adjustedColspan, desc, title }, i) => {
					// No vertical border for left and right edges of table, but we do need it in between to separate superCols
					const addBorders = i > 0 && i < superCols.length - 1;

					// Split up column into N individual columns, rather than one with an adjustedColspan. Why? For stickyCols, otherwise it's hard to know how much of a superCol belongs to the sticky col. This hack works as long as the sticky col has an empty superCol. If not, it'll behave a bit strangely still.
					if (!title && adjustedColspan > 1) {
						return (
							<Fragment key={i}>
								{range(adjustedColspan).map(j => {
									return (
										<th
											key={j}
											className={
												addBorders
													? clsx({
															"border-start": j === 0,
															"border-end": j === adjustedColspan - 1,
														})
													: undefined
											}
										/>
									);
								})}
							</Fragment>
						);
					}

					const className = addBorders ? "border-start border-end" : undefined;

					return (
						<th
							key={i}
							colSpan={adjustedColspan}
							style={{
								textAlign: "center",
							}}
							title={desc}
							className={className}
						>
							{title}
						</th>
					);
				})}
		</tr>
	);
};

export const getSortClassName = (sortBys: SortBy[], i: number) => {
	let className = "sorting";

	for (const sortBy of sortBys) {
		if (sortBy[0] === i) {
			className = `sorting_highlight ${
				sortBy[1] === "asc" ? "sorting_asc" : "sorting_desc"
			}`;
			break;
		}
	}

	return className;
};

type CheckboxState = "checked" | "unchecked" | "indeterminate";

// forwardRef needed for react-bootstrap types
const CustomToggle = forwardRef(
	(
		{
			children,
			onClick,
		}: {
			children: CheckboxState;
			onClick: (event: MouseEvent) => void;
		},
		ref,
	) => {
		const inputRef = useRef<HTMLInputElement>(null);

		useLayoutEffect(() => {
			if (inputRef.current) {
				if (children === "indeterminate") {
					inputRef.current.indeterminate = true;
				} else if (children === "checked") {
					inputRef.current.checked = true;
					inputRef.current.indeterminate = false;
				} else {
					inputRef.current.checked = false;
					inputRef.current.indeterminate = false;
				}
			}
		}, [children]);

		return (
			<input
				className="form-check-input"
				type="checkbox"
				onClick={event => {
					event.preventDefault();
					onClick(event);
				}}
				ref={element => {
					inputRef.current = element;

					if (typeof ref === "function") {
						ref(element);
					} else if (ref) {
						ref.current = element;
					}
				}}
			/>
		);
	},
);

const BulkSelectHeaderCheckbox = () => {
	const state: CheckboxState = "indeterminate";

	// Similar to singleCheckbox stuff below
	const onClickCell = (event: MouseEvent) => {
		if (event.target && (event.target as any).tagName === "TH") {
			console.log("TODO, SHOULD OPEN MENU");
		}
	};

	return (
		<th data-no-row-highlight onClick={onClickCell}>
			<Dropdown>
				<Dropdown.Toggle as={CustomToggle}>{state}</Dropdown.Toggle>
				<Dropdown.Menu>
					<Dropdown.Item>Select all</Dropdown.Item>
					<Dropdown.Item>Select visible</Dropdown.Item>
					<Dropdown.Item>Clear</Dropdown.Item>
				</Dropdown.Menu>
			</Dropdown>
		</th>
	);
};

const Header = ({
	colOrder,
	cols,
	enableFilters,
	filters,
	handleColClick,
	handleFilterUpdate,
	showBulkSelectCheckboxes,
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
	showBulkSelectCheckboxes: boolean;
	sortBys: SortBy[];
	superCols?: SuperCol[];
}) => {
	return (
		<thead>
			{superCols ? (
				<SuperCols
					colOrder={colOrder}
					showBulkSelectCheckboxes={showBulkSelectCheckboxes}
					superCols={superCols}
				/>
			) : null}
			<tr>
				{showBulkSelectCheckboxes ? <BulkSelectHeaderCheckbox /> : null}
				{colOrder.map(({ colIndex }) => {
					const {
						classNames: colClassNames,
						desc,
						sortSequence,
						title,
						titleReact,
						width,
					} = cols[colIndex];

					let className;
					if (sortSequence && sortSequence.length === 0) {
						className = null;
					} else {
						className = getSortClassName(sortBys, colIndex);
					}

					return (
						<th
							className={clsx(colClassNames, className)}
							key={colIndex}
							onClick={event => {
								handleColClick(event, colIndex);
							}}
							title={desc}
							style={{ width }}
						>
							{titleReact ?? title}
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
					showBulkSelectCheckboxes={showBulkSelectCheckboxes}
				/>
			) : null}
		</thead>
	);
};

export default Header;
