import { useState } from "react";
import { arrayMoveImmutable } from "array-move";
import { SortableContainer, SortableElement } from "react-sortable-hoc";
import classNames from "classnames";
import { Modal } from "react-bootstrap";
import { toWorker } from "../../util";
import { TableConfig } from "../../util/TableConfig";
import { ColTemp, getAllCols } from "../../util/columns/getCols";
import type { Col } from "../../components/DataTable";

export type ColConfig = {
	title: string;
	hidden: boolean;
	key: number;
};

const Item = SortableElement(
	({
		col,
		hidden,
		onToggleHidden,
	}: {
		col: ColConfig;
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
	onHide,
	config,
	show,
}: {
	config: TableConfig;
	onHide: () => void;
	show: boolean;
}) => {
	const initialColumns: ColTemp[] = getAllCols().map(c => ({
		title: c.title,
		hidden: !config.columns.some(col => col.key === c.key),
		key: c.key,
	}));
	const [columns, setColumns] = useState<ColTemp[]>(initialColumns);
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
			key: config.tableName,
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
