import { useState } from "react";
import { arrayMoveImmutable } from "array-move";
import { SortableContainer, SortableElement } from "react-sortable-hoc";
import classNames from "classnames";
import { Modal } from "react-bootstrap";
import { toWorker } from "../../util";

export type Col = {
	title: string;
	hidden: boolean;
	key: number;
	type: string;
};

const Item = SortableElement(
	({
		col,
		hidden,
		onToggleHidden,
	}: {
		col: Col;
		hidden: boolean;
		onToggleHidden: () => void;
	}) => {
		const title = col.title;

		return (
			<div className="form-check">
				<input
					className="form-check-input"
					type="checkbox"
					checked={!hidden}
					onChange={onToggleHidden}
				/>
				<label className="form-check-label cursor-grab">{title}</label>
			</div>
		);
	},
);

const Container = SortableContainer(
	({ children, isDragged }: { children: any[]; isDragged: boolean }) => {
		return (
			<ul
				className={classNames(
					"list-unstyled mb-0 cursor-grab user-select-none",
					{
						"cursor-grabbing": isDragged,
					},
				)}
			>
				{children}
			</ul>
		);
	},
);

const RosterCustomizeColumns = ({
	allStats,
	allRatings,
	onHide,
	cols,
	show,
	table,
}: {
	allStats: string[];
	allRatings: string[];
	onHide: () => void;
	cols: string[];
	show: boolean;
	table: string;
}) => {
	let i = 1;
	const initialColumns: Col[] = [
		...allRatings.map(col => ({
			title: col,
			key: i++,
			hidden: !cols.includes(col),
			type: "ratings",
		})),
		...allStats.map(col => ({
			title: col,
			key: i++,
			hidden: !cols.includes(col),
			type: "stats",
		})),
	];
	const [columns, setColumns] = useState<Col[]>(initialColumns);
	const [isDragged, setIsDragged] = useState(false);

	const onSortEnd = ({ oldIndex, newIndex }) => {
		const nextColumns = arrayMoveImmutable(columns, oldIndex, newIndex);
		setColumns(nextColumns);
	};

	const onToggleHidden = (i: number) => () => {
		const nextColumns = [...columns];
		if (nextColumns[i]) {
			nextColumns[i] = { ...nextColumns[i] };
			nextColumns[i].hidden = !nextColumns[i].hidden;
			setColumns(nextColumns);
		}
	};

	const onReset = () => setColumns(initialColumns);

	const hide = async () => {
		await toWorker("main", "updateColumns", {
			columns: columns,
			key: table,
		});
		onHide();
	};

	return (
		<Modal animation={false} centered show={show}>
			<Modal.Header closeButton>Customize Columns</Modal.Header>
			<Modal.Body>
				<p>
					Click and drag to reorder columns, or use the checkboxes to show/hide
					columns.
				</p>
				<Container
					helperClass="sort-inside-modal"
					isDragged={isDragged}
					onSortStart={() => {
						setIsDragged(true);
					}}
					onSortEnd={args => {
						setIsDragged(false);
						onSortEnd(args);
					}}
				>
					{columns.map((column, i) => {
						return (
							<Item
								key={column.key}
								index={i}
								onToggleHidden={onToggleHidden(i)}
								hidden={column.hidden}
								col={column}
							/>
						);
					})}
				</Container>
			</Modal.Body>
			<Modal.Footer>
				<button className="btn btn-danger" onClick={onReset}>
					Reset
				</button>
				<button className="btn btn-secondary" onClick={hide}>
					Close
				</button>
			</Modal.Footer>
		</Modal>
	);
};

export default RosterCustomizeColumns;
