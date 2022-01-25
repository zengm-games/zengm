import { useEffect, useState } from "react";
import { Dropdown, Modal } from "react-bootstrap";
import { toWorker } from "../../util";
import type { TableConfig } from "../../util/TableConfig";
import { ColType, getAllCols } from "../../util/columns/getCols";
import groupBy from "lodash-es/groupBy";
import difference from "lodash-es/difference";

import type { Col } from "./index";
import { processingSpinner } from "../ActionButton";
import { HelpPopover } from "../index";

export type ColConfig = Col & {
	hidden: boolean;
	cat: ColType;
};

const CustomizeColumns = ({
	onHide,
	onSave,
	config,
	show,
}: {
	config: TableConfig;
	onHide: () => void;
	onSave: () => void;
	show: boolean;
}) => {
	const initialColumns: ColConfig[] = getAllCols().map(
		(c): ColConfig => ({
			...c,
			cat: c.cat || "Other",
			hidden: !config.columns.some(col => col.key === c.key),
		}),
	);
	const [columns, setColumns] = useState<ColConfig[]>(initialColumns);

	useEffect(() => {
		const nextColumns = [...columns].map(c => ({
			...c,
			hidden: !config.columns.some(col => col.key === c.key),
		}));
		setColumns(nextColumns);
	}, [config]);

	const onChange = (key: string) => () => {
		const nextColumns = [...columns];
		const i = nextColumns.findIndex(c => c.key === key);
		if (i !== -1) {
			nextColumns[i] = { ...nextColumns[i] };
			nextColumns[i].hidden = !nextColumns[i].hidden;
			setColumns(nextColumns);
		}
	};

	const reset = () => setColumns(initialColumns);

	const exit = () => {
		reset();
		onHide();
	};

	const restore = async () => {
		await toWorker("main", "updateColumns", {
			columns: config.fallback,
			key: config.tableName,
		});
		onHide();
		onSave();
	};

	const save = async () => {
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
		onSave();
	};

	const colsGrouped: { [key: string]: ColConfig[] } = groupBy(
		columns,
		c => c.cat,
	);

	return (
		<Modal
			animation={false}
			size={"lg"}
			show={show}
			onEscapeKeyDown={exit}
			centered
		>
			<Modal.Header onHide={exit} closeButton>
				Customize Columns
			</Modal.Header>
			<Modal.Body className="p-0">
				<ul className="list-group list-group-flush">
					{Object.entries(colsGrouped).map(([group, cols]) => (
						<li key={group} className="list-group-item">
							<strong>{group}</strong>
							<div className="row gy-1">
								{cols.map((col, i) => (
									<div key={i} className="col-lg-4">
										<div className="form-check d-flex">
											<input
												id={`show-column-${col.key}`}
												className="form-check-input cursor-pointer"
												type="checkbox"
												checked={!col.hidden}
												onChange={onChange(col.key)}
											/>
											<label
												className="form-check-label flex-grow-1 ps-1"
												htmlFor={`show-column-${col.key}`}
												title={col.desc}
											>
												{col.title}
												<small className="d-lg-none ms-2">{col.desc}</small>
											</label>
										</div>
									</div>
								))}
							</div>
						</li>
					))}
				</ul>
			</Modal.Body>
			<Modal.Footer className="d-flex settings-buttons">
				<Dropdown>
					<Dropdown.Toggle variant="danger" id="customize-teams-reset">
						Reset
					</Dropdown.Toggle>
					<Dropdown.Menu>
						<Dropdown.Item onClick={reset}>Undo Changes</Dropdown.Item>
						<Dropdown.Item onClick={restore}>Restore Default</Dropdown.Item>
					</Dropdown.Menu>
				</Dropdown>
				<div className="ms-2 pt-2">
					<HelpPopover title="Reset">
						<p>
							<b>Undo Changes</b>: Undo all unsaved configration changes.
						</p>
						<p>
							<b>Restore Default</b>: Restores the table's default configration,
							all saved changes to this table will be lost.
						</p>
					</HelpPopover>
				</div>
				<div className="btn-group ms-auto">
					<button className="btn btn-secondary" onClick={exit}>
						Cancel
					</button>
					<button className="btn btn-primary" onClick={save}>
						Save
					</button>
				</div>
			</Modal.Footer>
		</Modal>
	);
};

export default CustomizeColumns;
