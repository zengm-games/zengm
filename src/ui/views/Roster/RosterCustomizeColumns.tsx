import { useState } from "react";
import { arrayMoveImmutable } from "array-move";
import { SortableContainer, SortableElement } from "react-sortable-hoc";
import classNames from "classnames";
import { Modal } from "react-bootstrap";
import { toWorker } from "../../util";
import { TableConfig } from "../../util/TableConfig";
import { ColTemp, getAllCols } from "../../util/columns/getCols";
import type { Col } from "../../components/DataTable";
import { difference, differenceWith } from "lodash-es";

export type ColConfig = {
	title: string;
	desc: string;
	hidden: boolean;
	key: string;
};

const RosterCustomizeColumns = ({
	onHide,
	config,
	show,
}: {
	config: TableConfig;
	onHide: () => void;
	show: boolean;
}) => {
	const initialColumns: ColConfig[] = getAllCols().map(
		(c): ColConfig => ({
			title: c.title,
			desc: c.desc || "",
			hidden: !config.columns.some(col => col.key === c.key),
			key: c.key ?? c.title,
		}),
	);
	const [columns, setColumns] = useState<ColConfig[]>(initialColumns);

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
		const enabledColumns: string[] = columns
				.filter(c => !c.hidden)
				.map(c => c.key),
			currentColumns: string[] = config.columns.map(c => c.key);

		// Find columns we need to remove, and columns we need to add
		const removeColumns: string[] = difference(currentColumns, enabledColumns),
			addColumns: string[] = difference(enabledColumns, currentColumns);

		// Apply removals and adding to currentColumns while trying to preserve the order of currentColumns
		const nextColumns: string[] = currentColumns.filter(
			c => !removeColumns.includes(c),
		);
		nextColumns.push(...addColumns);

		await toWorker("main", "updateColumns", {
			columns: nextColumns,
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
				{columns.map((col, i) => {
					return (
						<div className="form-check" key={i}>
							<input
								id={`show-column-${i}`}
								className="form-check-input cursor-pointer"
								type="checkbox"
								checked={!col.hidden}
								onChange={onToggleHidden(i)}
							/>
							<label
								className="form-check-label cursor-pointer user-select-none"
								htmlFor={`show-column-${i}`}
							>
								{col.title} <small className="ml-1">{col.desc}</small>
							</label>
						</div>
					);
				})}
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
